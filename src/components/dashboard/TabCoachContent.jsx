import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import {
  Dumbbell, Plus, X, Check, Trash2, Copy,
  ChevronDown, ChevronUp, MoreHorizontal,
  Users, Calendar, Trophy, Zap, BookOpen,
  Play, Edit2, Search, Award, MessageSquarePlus,
  BarChart2, ClipboardList, Heart,
  MessageCircle, TrendingUp, Video, Link,
  Apple, Droplets, Moon, Star, Flame,
  Bell, Camera, Send, Clock, ChevronRight,
  Layers, FileText, LayoutGrid, Layout,
  Target, Activity, Smile, Coffee,
  CheckSquare, Square, ArrowRight, Upload,
  Repeat, AlignLeft, ToggleLeft, Hash,
  Eye, Grid, List, Lock,
} from 'lucide-react';

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,400&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .coach-root * { box-sizing: border-box; }
  .coach-root { font-family: 'DM Sans', sans-serif; }

  .coach-layout { display: grid; grid-template-columns: minmax(0,1fr) clamp(260px,22%,290px); gap: 16px; align-items: start; }
  .coach-left  { display: flex; flex-direction: column; gap: 14px; }
  .coach-right { display: flex; flex-direction: column; gap: 10px; }

  .tab-nav { display: flex; gap: 2px; padding: 4px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; }
  .tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 8px 6px; border-radius: 10px; border: none; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; background: transparent; }
  .tab-btn.active { background: rgba(167,139,250,0.15); color: #a78bfa; box-shadow: inset 0 0 0 1px rgba(167,139,250,0.3); }
  .tab-btn:not(.active) { color: #3a5070; }
  .tab-btn:not(.active):hover { color: #64748b; background: rgba(255,255,255,0.03); }

  .workout-card { border-radius: 14px; background: #0c1a2e; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
  .workout-card:hover { border-color: rgba(167,139,250,0.35); transform: translateY(-1px); }
  .workout-card.selected { border-color: rgba(167,139,250,0.5); background: rgba(167,139,250,0.04); }

  .exercise-row { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 4px; }
  .exercise-row:hover .ex-delete { opacity: 1; }
  .ex-delete { opacity: 0; transition: opacity 0.1s; }

  .section-block { border-radius: 12px; padding: 12px 13px; margin-bottom: 8px; }
  .type-btn { padding: 5px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
  .assign-btn { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.025); cursor: pointer; transition: all 0.14s; text-align: left; width: 100%; font-family: 'DM Sans', sans-serif; }
  .assign-btn:hover { background: rgba(255,255,255,0.05); transform: translateY(-1px); }

  .program-day { border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); min-height: 64px; padding: 8px; transition: border-color 0.15s; cursor: pointer; }
  .program-day:hover { border-color: rgba(167,139,250,0.25); }
  .program-day.rest { background: rgba(255,255,255,0.01); }

  .habit-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 11px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 6px; transition: all 0.14s; }
  .habit-row:hover { border-color: rgba(255,255,255,0.12); }

  .nutrition-card { border-radius: 12px; background: #0c1a2e; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }

  .cal-day { border-radius: 9px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); min-height: 72px; padding: 6px; transition: border-color 0.15s; cursor: pointer; }
  .cal-day:hover { border-color: rgba(167,139,250,0.25); }
  .cal-day.today { border-color: rgba(167,139,250,0.4); background: rgba(167,139,250,0.04); }
  .cal-event { border-radius: 5px; padding: 2px 5px; font-size: 9px; font-weight: 700; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .form-question { border-radius: 11px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); padding: 12px; margin-bottom: 8px; }

  .pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 800; }

  .side-card { background: #0c1a2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px; }

  .scrollbar-hide { scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  .shimmer-dot { width: 6px; height: 6px; border-radius: 50%; animation: pulse-dot 1.5s ease-in-out infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }

  @media (max-width: 780px) {
    .coach-layout { grid-template-columns: 1fr; }
    .coach-right  { order: -1; }
    .tab-btn span.tab-label { display: none; }
  }
`;

/* ─── Constants ───────────────────────────────────────────────────────────── */
const WORKOUT_TYPES = {
  hiit:       { label: 'HIIT',       color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   emoji: '⚡' },
  strength:   { label: 'Strength',   color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)',  emoji: '🏋️' },
  yoga:       { label: 'Yoga',       color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  emoji: '🧘' },
  cardio:     { label: 'Cardio',     color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.25)',  emoji: '🏃' },
  core:       { label: 'Core',       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  emoji: '🎯' },
  beginner:   { label: 'Beginner',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', emoji: '🌱' },
  stretching: { label: 'Stretching', color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)',  border: 'rgba(45,212,191,0.25)',  emoji: '🤸' },
};

const HABIT_ICONS = { Droplets, Moon, Flame, Dumbbell, Apple, Heart, Activity, Coffee, Star, Zap };
const HABIT_CATS = [
  { id: 'hydration', label: 'Hydration', icon: Droplets, color: '#38bdf8' },
  { id: 'sleep',     label: 'Sleep',     icon: Moon,     color: '#818cf8' },
  { id: 'nutrition', label: 'Nutrition', icon: Apple,    color: '#34d399' },
  { id: 'movement',  label: 'Movement',  icon: Activity, color: '#fbbf24' },
  { id: 'mindset',   label: 'Mindset',   icon: Star,     color: '#f87171' },
];

const Q_TYPES = [
  { id: 'scale',    label: '1–10 Scale', icon: BarChart2 },
  { id: 'text',     label: 'Free Text',  icon: AlignLeft },
  { id: 'yesno',    label: 'Yes / No',   icon: ToggleLeft },
  { id: 'number',   label: 'Number',     icon: Hash },
];

const DEFAULT_WORKOUTS = [
  { id: 'w1', name: 'HIIT Blast', type: 'hiit', duration: 45, difficulty: 'Advanced',
    warmup:  [{ id:'e1',name:'High knees',sets:'',reps:'2 min'},{id:'e2',name:'Jump rope',sets:'',reps:'3 min'}],
    main:    [{ id:'e3',name:'KB Swings',sets:'4',reps:'20'},{id:'e4',name:'Burpees',sets:'4',reps:'15'},{id:'e5',name:'Box Jumps',sets:'4',reps:'10'},{id:'e6',name:'Battle ropes',sets:'4',reps:'30s'}],
    cooldown:[{ id:'e7',name:'Hip flexor stretch',sets:'',reps:'60s'},{id:'e8',name:'Quad stretch',sets:'',reps:'60s'}],
    notes:'Rest 45s between exercises, 2 min between rounds.' },
  { id: 'w2', name: 'Strength Builder', type: 'strength', duration: 60, difficulty: 'Intermediate',
    warmup:  [{id:'e9',name:'Mobility drills',sets:'',reps:'5 min'},{id:'e10',name:'Band work',sets:'2',reps:'15'}],
    main:    [{id:'e11',name:'Back Squat',sets:'5',reps:'5'},{id:'e12',name:'Bench Press',sets:'4',reps:'8'},{id:'e13',name:'Barbell Row',sets:'4',reps:'8'},{id:'e14',name:'Romanian DL',sets:'3',reps:'10'}],
    cooldown:[{id:'e15',name:'Foam roll',sets:'',reps:'3 min'},{id:'e16',name:'Pigeon stretch',sets:'',reps:'90s each'}],
    notes:'Rest 2–3 min between sets. Focus on form over load.' },
  { id: 'w3', name: 'Beginner Conditioning', type: 'beginner', duration: 30, difficulty: 'Beginner',
    warmup:  [{id:'e17',name:'March in place',sets:'',reps:'2 min'},{id:'e18',name:'Arm circles',sets:'',reps:'30s'}],
    main:    [{id:'e19',name:'Bodyweight squats',sets:'3',reps:'12'},{id:'e20',name:'Knee push-ups',sets:'3',reps:'10'},{id:'e21',name:'Reverse lunges',sets:'3',reps:'10 each'},{id:'e22',name:'Glute bridges',sets:'3',reps:'15'}],
    cooldown:[{id:'e23',name:'Cat-cow stretch',sets:'',reps:'1 min'},{id:'e24',name:"Child's pose",sets:'',reps:'60s'}],
    notes:'Perfect for new members.' },
  { id: 'w4', name: 'Core Finisher', type: 'core', duration: 15, difficulty: 'Intermediate',
    warmup:  [{id:'e25',name:'Cat-cow',sets:'',reps:'1 min'}],
    main:    [{id:'e26',name:'Plank hold',sets:'3',reps:'45s'},{id:'e27',name:'Dead bugs',sets:'3',reps:'10 each'},{id:'e28',name:'Russian twists',sets:'3',reps:'20'},{id:'e29',name:'Hollow holds',sets:'3',reps:'30s'}],
    cooldown:[{id:'e30',name:'Supine twist',sets:'',reps:'45s each'}],
    notes:'Add at the end of any session.' },
];

const DEFAULT_PROGRAMS = [
  { id:'p1', name:'12-Week Strength Foundation', weeks:12, type:'strength', description:'Progressive overload linear strength program.', weeks_data: {} },
  { id:'p2', name:'4-Week Fat Loss Sprint', weeks:4, type:'hiit', description:'High-intensity conditioning blocks.', weeks_data: {} },
];

const DEFAULT_HABITS = [
  { id:'h1', name:'Drink 2L water', category:'hydration', target:'2L daily', color:'#38bdf8' },
  { id:'h2', name:'Sleep 8 hours', category:'sleep', target:'By 10pm', color:'#818cf8' },
  { id:'h3', name:'Eat 3 meals', category:'nutrition', target:'No skipping', color:'#34d399' },
  { id:'h4', name:'10,000 steps', category:'movement', target:'Daily walk', color:'#fbbf24' },
];

const DEFAULT_FORMS = [
  { id:'f1', name:'Weekly Check-in', questions:[
    {id:'q1',type:'scale',prompt:'How was your energy this week? (1–10)'},
    {id:'q2',type:'scale',prompt:'Sleep quality this week? (1–10)'},
    {id:'q3',type:'number',prompt:'Current body weight (kg)'},
    {id:'q4',type:'text',prompt:'Any pain, soreness, or concerns?'},
  ]},
  { id:'f2', name:'Onboarding Assessment', questions:[
    {id:'q5',type:'text',prompt:'What are your main fitness goals?'},
    {id:'q6',type:'yesno',prompt:'Do you have any injuries or physical limitations?'},
    {id:'q7',type:'text',prompt:'What does your typical week look like?'},
    {id:'q8',type:'scale',prompt:'How would you rate your current fitness level?'},
  ]},
];

const DEFAULT_PLANS = [
  { id:'n1', name:'Fat Loss Plan', calories:1800, protein:160, carbs:140, fat:60, notes:'High protein, moderate carb deficit.', meals:[
    {id:'m1',name:'Breakfast',foods:'Greek yogurt, berries, oats'},
    {id:'m2',name:'Lunch',foods:'Chicken breast, rice, greens'},
    {id:'m3',name:'Dinner',foods:'Salmon, sweet potato, broccoli'},
    {id:'m4',name:'Snack',foods:'Protein shake, almonds'},
  ]},
  { id:'n2', name:'Muscle Building', calories:2800, protein:200, carbs:300, fat:80, notes:'Caloric surplus, prioritise protein timing.',meals:[
    {id:'m5',name:'Breakfast',foods:'Eggs, avocado toast, banana'},
    {id:'m6',name:'Pre-workout',foods:'Rice cakes, peanut butter'},
    {id:'m7',name:'Post-workout',foods:'Protein shake, white rice'},
    {id:'m8',name:'Dinner',foods:'Beef, pasta, mixed veg'},
  ]},
];

const CAL_EVENTS_SEED = [
  { id:'ce1', date: format(new Date(), 'yyyy-MM-dd'), title:'Post: Monday motivation', type:'post', color:'#a78bfa' },
  { id:'ce2', date: format(addDays(new Date(),2), 'yyyy-MM-dd'), title:'Check-in form', type:'form', color:'#34d399' },
  { id:'ce3', date: format(addDays(new Date(),4), 'yyyy-MM-dd'), title:'Class recap', type:'recap', color:'#38bdf8' },
  { id:'ce4', date: format(addDays(new Date(),6), 'yyyy-MM-dd'), title:'Progress photos', type:'photo', color:'#fbbf24' },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function uid() { return Math.random().toString(36).slice(2,9); }

function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

const cardBase = { background:'#0c1a2e', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:14 };
const inputBase = { padding:'7px 10px', borderRadius:8, background:'#060c18', border:'1px solid rgba(255,255,255,0.08)', color:'#f0f4f8', fontSize:11, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif" };

/* ─── Micro-components ────────────────────────────────────────────────────── */
function SectionLabel({ children, accent='#a78bfa', action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:3, height:14, borderRadius:99, background:accent, flexShrink:0 }}/>
        <span style={{ fontSize:13, fontWeight:900, color:'#f0f4f8', letterSpacing:'-0.01em', fontFamily:"'Space Grotesk',sans-serif" }}>{children}</span>
      </div>
      {action}
    </div>
  );
}

function DotMenu({ items }) {
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown',h);
    return () => document.removeEventListener('mousedown',h);
  },[open]);
  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={e=>{ e.stopPropagation(); setOpen(o=>!o); }}
        style={{ width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:7,cursor:'pointer' }}>
        <MoreHorizontal style={{ width:12,height:12,color:'rgba(255,255,255,0.4)' }}/>
      </button>
      {open && (
        <div style={{ position:'absolute',top:30,right:0,zIndex:9999,background:'#1a1f36',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,boxShadow:'0 8px 28px rgba(0,0,0,0.5)',minWidth:130,overflow:'hidden' }}>
          {items.map((item,i) => (
            <button key={i} onClick={e=>{ e.stopPropagation(); setOpen(false); item.action(); }}
              style={{ width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 13px',fontSize:11,fontWeight:600,color:item.danger?'#f87171':'#d4e4f4',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>e.currentTarget.style.background=item.danger?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.05)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <item.icon style={{ width:11,height:11 }}/> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ children, color, bg, border }) {
  return (
    <span style={{ fontSize:9,fontWeight:800,color,background:bg,border:`1px solid ${border}`,borderRadius:5,padding:'1px 6px',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'0.03em' }}>
      {children}
    </span>
  );
}

function NewBtn({ onClick, label, color='#a78bfa' }) {
  return (
    <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:9,background:`${color}18`,border:`1px solid ${color}35`,color,fontSize:10,fontWeight:800,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif" }}>
      <Plus style={{ width:10,height:10 }}/>{label}
    </button>
  );
}

/* ─── Workout tab ─────────────────────────────────────────────────────────── */
function ExerciseRow({ ex, onChange, onDelete }) {
  return (
    <div className="exercise-row">
      <Dumbbell style={{ width:10,height:10,color:'#3a5070',flexShrink:0 }}/>
      <input value={ex.name} onChange={e=>onChange({...ex,name:e.target.value})} placeholder="Exercise name"
        style={{ ...inputBase,flex:1,padding:'4px 7px' }}/>
      <input value={ex.sets} onChange={e=>onChange({...ex,sets:e.target.value})} placeholder="Sets"
        style={{ ...inputBase,width:40,padding:'4px 6px' }}/>
      <span style={{ fontSize:10,color:'#3a5070' }}>×</span>
      <input value={ex.reps} onChange={e=>onChange({...ex,reps:e.target.value})} placeholder="Reps"
        style={{ ...inputBase,width:72,padding:'4px 7px' }}/>
      <input value={ex.video||''} onChange={e=>onChange({...ex,video:e.target.value})} placeholder="Video URL"
        style={{ ...inputBase,width:100,padding:'4px 7px',fontSize:10 }}/>
      <button onClick={onDelete} className="ex-delete"
        style={{ background:'none',border:'none',cursor:'pointer',color:'#f87171',padding:0,display:'flex',flexShrink:0 }}>
        <X style={{ width:11,height:11 }}/>
      </button>
    </div>
  );
}

function SectionBlock({ title, accent, exercises, onChange, icon: Icon }) {
  const addEx = () => onChange([...exercises,{id:uid(),name:'',sets:'',reps:'',video:''}]);
  const upd   = (idx,ex) => { const u=[...exercises]; u[idx]=ex; onChange(u); };
  const del   = (idx)    => onChange(exercises.filter((_,i)=>i!==idx));
  return (
    <div className="section-block" style={{ background:`${accent}05`,border:`1px solid ${accent}16` }}>
      <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:9 }}>
        <div style={{ width:24,height:24,borderRadius:7,background:`${accent}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <Icon style={{ width:11,height:11,color:accent }}/>
        </div>
        <span style={{ fontSize:11,fontWeight:800,color:'#f0f4f8' }}>{title}</span>
        <span style={{ fontSize:9,color:'#3a5070' }}>{exercises.length} exercise{exercises.length!==1?'s':''}</span>
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:9,color:'#3a5070',fontStyle:'italic' }}>name · sets · reps · video url</span>
      </div>
      {exercises.map((ex,i)=><ExerciseRow key={ex.id||i} ex={ex} onChange={u=>upd(i,u)} onDelete={()=>del(i)}/>)}
      <button onClick={addEx}
        style={{ display:'flex',alignItems:'center',gap:4,fontSize:9,fontWeight:700,color:accent,background:`${accent}0a`,border:`1px solid ${accent}1f`,borderRadius:6,padding:'4px 9px',cursor:'pointer',marginTop:2,fontFamily:"'DM Sans',sans-serif" }}>
        <Plus style={{ width:9,height:9 }}/> Add exercise
      </button>
    </div>
  );
}

function WorkoutEditor({ workout, workouts, onSave, onCancel }) {
  const [draft,setDraft] = useState(() => workout
    ? { ...workout, warmup:[...workout.warmup], main:[...workout.main], cooldown:[...workout.cooldown] }
    : { id:uid(), name:'', type:'strength', duration:45, difficulty:'Intermediate', warmup:[], main:[], cooldown:[], notes:'' }
  );
  const tc = WORKOUT_TYPES[draft.type]||WORKOUT_TYPES.strength;
  return (
    <div style={{ borderRadius:16,background:'#0c1a2e',border:`1px solid ${tc.color}28`,overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 12px',background:`${tc.color}06`,borderBottom:`1px solid ${tc.color}16` }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:30,height:30,borderRadius:9,background:tc.bg,border:`1px solid ${tc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>{tc.emoji}</div>
            <span style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>{workout?'Edit Workout':'New Workout'}</span>
          </div>
          <button onClick={onCancel}
            style={{ width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b',cursor:'pointer' }}>
            <X style={{ width:11,height:11 }}/>
          </button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 80px 110px',gap:6,marginBottom:8 }}>
          <input value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} placeholder="Workout name" style={{ ...inputBase }}/>
          <input value={draft.duration} onChange={e=>setDraft(p=>({...p,duration:e.target.value}))} placeholder="Mins" type="number" style={{ ...inputBase }}/>
          <select value={draft.difficulty} onChange={e=>setDraft(p=>({...p,difficulty:e.target.value}))} style={{ ...inputBase,cursor:'pointer' }}>
            {['Beginner','Intermediate','Advanced','Elite'].map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
          {Object.entries(WORKOUT_TYPES).map(([key,t])=>(
            <button key={key} onClick={()=>setDraft(p=>({...p,type:key}))} className="type-btn"
              style={{ background:draft.type===key?t.bg:'transparent',border:`1px solid ${draft.type===key?t.border:'rgba(255,255,255,0.07)'}`,color:draft.type===key?t.color:'#3a5070' }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'14px 16px' }}>
        <SectionBlock title="Warmup" accent="#38bdf8" icon={Play} exercises={draft.warmup} onChange={v=>setDraft(p=>({...p,warmup:v}))}/>
        <SectionBlock title="Main Workout" accent={tc.color} icon={Dumbbell} exercises={draft.main} onChange={v=>setDraft(p=>({...p,main:v}))}/>
        <SectionBlock title="Cooldown" accent="#34d399" icon={Heart} exercises={draft.cooldown} onChange={v=>setDraft(p=>({...p,cooldown:v}))}/>
        <div style={{ marginTop:2 }}>
          <div style={{ fontSize:9,fontWeight:700,color:'#3a5070',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5 }}>Coaching Notes</div>
          <textarea value={draft.notes} onChange={e=>setDraft(p=>({...p,notes:e.target.value}))} placeholder="Tips, modifications, cues, equipment…"
            style={{ ...inputBase,width:'100%',minHeight:54,resize:'vertical',lineHeight:1.5,padding:'7px 10px' }}/>
        </div>
        <div style={{ display:'flex',gap:7,marginTop:12 }}>
          <button onClick={onCancel}
            style={{ flex:1,padding:'9px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
            Cancel
          </button>
          <button onClick={()=>onSave(draft)} disabled={!draft.name.trim()}
            style={{ flex:2,padding:'9px',borderRadius:9,background:draft.name.trim()?`${tc.color}20`:'rgba(255,255,255,0.03)',border:`1px solid ${draft.name.trim()?`${tc.color}38`:'rgba(255,255,255,0.06)'}`,color:draft.name.trim()?tc.color:'#3a5070',fontSize:11,fontWeight:800,cursor:draft.name.trim()?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif" }}>
            {workout?'✓ Save Changes':'✓ Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkoutCard({ workout, isSelected, onSelect, onEdit, onDelete, onDuplicate, onAssign }) {
  const tc = WORKOUT_TYPES[workout.type]||WORKOUT_TYPES.strength;
  return (
    <div className={`workout-card${isSelected?' selected':''}`} onClick={()=>onSelect(workout)}>
      <div style={{ height:3,background:`linear-gradient(90deg,${tc.color},${tc.color}44)` }}/>
      <div style={{ padding:'13px 14px' }}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:9 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:34,height:34,borderRadius:9,background:tc.bg,border:`1px solid ${tc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0 }}>
              {tc.emoji}
            </div>
            <div>
              <div style={{ fontSize:12,fontWeight:900,color:'#f0f4f8',letterSpacing:'-0.01em',lineHeight:1.2,fontFamily:"'Space Grotesk',sans-serif" }}>{workout.name}</div>
              <Badge color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Badge>
            </div>
          </div>
          <DotMenu items={[
            {icon:Edit2, label:'Edit',      action:()=>onEdit(workout)},
            {icon:Copy,  label:'Duplicate', action:()=>onDuplicate(workout)},
            {icon:Trash2,label:'Delete',    action:()=>onDelete(workout.id),danger:true},
          ]}/>
        </div>
        <div style={{ display:'flex',gap:8,marginBottom:8,flexWrap:'wrap' }}>
          {workout.duration && <span style={{ fontSize:9,color:'#64748b' }}>⏱ {workout.duration}min</span>}
          {workout.difficulty && <span style={{ fontSize:9,color:'#64748b' }}>{workout.difficulty}</span>}
          <span style={{ fontSize:9,color:'#64748b' }}>{workout.main.length} exercises</span>
          {workout.main.some(e=>e.video) && (
            <span style={{ fontSize:9,color:tc.color,display:'flex',alignItems:'center',gap:3 }}>
              <Video style={{ width:8,height:8 }}/> Videos
            </span>
          )}
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:2,marginBottom:10 }}>
          {workout.main.slice(0,3).map((ex,i)=>(
            <div key={i} style={{ fontSize:10,color:'#94a3b8',display:'flex',alignItems:'center',gap:5 }}>
              <div style={{ width:3,height:3,borderRadius:'50%',background:tc.color,flexShrink:0 }}/>
              <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{ex.name}</span>
              {(ex.sets||ex.reps)&&<span style={{ fontSize:8,color:'#475569',flexShrink:0 }}>{ex.sets?`${ex.sets}×${ex.reps}`:ex.reps}</span>}
            </div>
          ))}
          {workout.main.length>3&&<div style={{ fontSize:9,color:'#3a5070',paddingLeft:8 }}>+{workout.main.length-3} more</div>}
        </div>
        <button onClick={e=>{ e.stopPropagation(); onAssign(workout); }}
          style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'6px',borderRadius:8,background:`${tc.color}10`,border:`1px solid ${tc.color}24`,color:tc.color,fontSize:10,fontWeight:800,cursor:'pointer',transition:'all 0.12s',fontFamily:"'DM Sans',sans-serif" }}
          onMouseEnter={e=>e.currentTarget.style.background=`${tc.color}1f`}
          onMouseLeave={e=>e.currentTarget.style.background=`${tc.color}10`}>
          <Play style={{ width:10,height:10 }}/> Assign Workout
        </button>
      </div>
    </div>
  );
}

/* ─── Enhanced Assign Modal ───────────────────────────────────────────────── */
function AssignModal({ workout, allMemberships, myClasses, avatarMap, onClose, openModal }) {
  const [tab,setTab]         = useState('class');
  const [search,setSearch]   = useState('');
  const [assigned,setAssigned] = useState([]);
  const [schedDate,setSchedDate] = useState('');
  const [note,setNote]       = useState('');
  const [sent,setSent]       = useState(false);
  const tc = WORKOUT_TYPES[workout.type]||WORKOUT_TYPES.strength;

  const filtered = useMemo(()=>{
    if (tab==='member') return allMemberships.filter(m=>!search||(m.user_name||'').toLowerCase().includes(search.toLowerCase())).slice(0,10);
    if (tab==='class')  return myClasses.filter(c=>!search||(c.name||'').toLowerCase().includes(search.toLowerCase()));
    return [];
  },[tab,search,allMemberships,myClasses]);

  const toggle = id => setAssigned(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  if (sent) return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onClose}>
      <div style={{ textAlign:'center',padding:40 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:56,height:56,borderRadius:'50%',background:tc.bg,border:`2px solid ${tc.color}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
          <Check style={{ width:24,height:24,color:tc.color }}/>
        </div>
        <div style={{ fontSize:18,fontWeight:900,color:'#f0f4f8',marginBottom:6,fontFamily:"'Space Grotesk',sans-serif" }}>Assigned!</div>
        <div style={{ fontSize:12,color:'#64748b',marginBottom:20 }}>
          {workout.name} sent to {assigned.length} {tab==='class'?'class(es)':'member(s)'}{schedDate?` · scheduled for ${schedDate}`:''}
        </div>
        <button onClick={onClose} style={{ padding:'10px 24px',borderRadius:10,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,fontSize:12,fontWeight:800,cursor:'pointer' }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:500,maxHeight:'84vh',overflowY:'auto',borderRadius:20,background:'#0d1b2e',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }} onClick={e=>e.stopPropagation()} className="scrollbar-hide">
        {/* Header */}
        <div style={{ padding:'16px 18px 12px',borderBottom:'1px solid rgba(255,255,255,0.07)',position:'sticky',top:0,background:'#0d1b2e',zIndex:1 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div>
              <div style={{ fontSize:14,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>Assign Workout</div>
              <div style={{ fontSize:10,color:'#64748b',marginTop:2 }}>{workout.name} · {workout.main.length} exercises · {workout.duration}min</div>
            </div>
            <button onClick={onClose}
              style={{ width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b',cursor:'pointer' }}>
              <X style={{ width:12,height:12 }}/>
            </button>
          </div>
          <div style={{ display:'flex',gap:5 }}>
            {[
              {id:'class',icon:Dumbbell,label:'Class',color:'#a78bfa'},
              {id:'member',icon:Users,label:'Member',color:'#38bdf8'},
              {id:'challenge',icon:Trophy,label:'Challenge',color:'#fbbf24'},
            ].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'7px',borderRadius:9,border:tab===t.id?`1px solid ${t.color}35`:'1px solid rgba(255,255,255,0.07)',background:tab===t.id?`${t.color}12`:'transparent',color:tab===t.id?t.color:'#3a5070',fontSize:10,fontWeight:tab===t.id?800:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                <t.icon style={{ width:10,height:10 }}/> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:'12px 18px 18px' }}>
          {(tab==='class'||tab==='member')&&(
            <>
              <div style={{ position:'relative',marginBottom:10 }}>
                <Search style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:11,height:11,color:'#3a5070' }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab==='class'?'classes':'members'}…`}
                  style={{ ...inputBase,width:'100%',paddingLeft:28 }}/>
              </div>

              {/* Bulk select all */}
              {filtered.length>0&&(
                <button onClick={()=>{ const all=filtered.map(i=>i.user_id||i.id); setAssigned(p=>p.length===all.length?[]:all); }}
                  style={{ fontSize:9,fontWeight:700,color:'#64748b',background:'none',border:'none',cursor:'pointer',marginBottom:8,display:'flex',alignItems:'center',gap:4,fontFamily:"'DM Sans',sans-serif" }}>
                  <CheckSquare style={{ width:10,height:10 }}/> {assigned.length===filtered.length?'Deselect all':'Select all'}
                </button>
              )}

              <div style={{ maxHeight:200,overflowY:'auto' }} className="scrollbar-hide">
                {filtered.length===0
                  ? <div style={{ textAlign:'center',padding:'16px 0',color:'#3a5070',fontSize:11 }}>No {tab==='class'?'classes':'members'} found</div>
                  : filtered.map((item,i)=>{
                    const id=item.user_id||item.id, name=item.user_name||item.name, chosen=assigned.includes(id);
                    return (
                      <div key={id||i} onClick={()=>toggle(id)}
                        style={{ display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:9,background:chosen?'rgba(167,139,250,0.07)':'rgba(255,255,255,0.02)',border:`1px solid ${chosen?'rgba(167,139,250,0.25)':'rgba(255,255,255,0.05)'}`,cursor:'pointer',marginBottom:5,transition:'all 0.1s' }}>
                        <div style={{ width:16,height:16,borderRadius:4,border:`1.5px solid ${chosen?'#a78bfa':'rgba(255,255,255,0.15)'}`,background:chosen?'#a78bfa':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                          {chosen&&<Check style={{ width:9,height:9,color:'#fff' }}/>}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:11,fontWeight:700,color:'#f0f4f8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{name}</div>
                          {tab==='class'&&item.schedule&&<div style={{ fontSize:9,color:'#64748b' }}>{item.schedule}</div>}
                          {tab==='member'&&item.membership_type&&<div style={{ fontSize:9,color:'#64748b' }}>{item.membership_type}</div>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Schedule + note */}
              <div style={{ marginTop:12,padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:10,fontWeight:700,color:'#64748b',marginBottom:8,display:'flex',alignItems:'center',gap:5 }}>
                  <Clock style={{ width:10,height:10 }}/> Schedule & Notes
                </div>
                <div style={{ display:'flex',gap:7,marginBottom:7 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9,color:'#3a5070',marginBottom:3 }}>Send date (optional)</div>
                    <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)}
                      style={{ ...inputBase,width:'100%',fontSize:10,colorScheme:'dark' }}/>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9,color:'#3a5070',marginBottom:3 }}>Client-specific note</div>
                  <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="E.g. Focus on form, use lighter weights this week…"
                    style={{ ...inputBase,width:'100%',minHeight:48,resize:'vertical',fontSize:10,lineHeight:1.5 }}/>
                </div>
              </div>

              {assigned.length>0&&(
                <button onClick={()=>setSent(true)}
                  style={{ width:'100%',marginTop:12,padding:'10px',borderRadius:10,background:`linear-gradient(135deg,${tc.color}28,${tc.color}14)`,border:`1px solid ${tc.color}38`,color:tc.color,fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                  {schedDate?`📅 Schedule for ${schedDate} →`:`Send to ${assigned.length} ${tab==='class'?(assigned.length===1?'Class':'Classes'):(assigned.length===1?'Member':'Members')} →`}
                </button>
              )}
            </>
          )}
          {tab==='challenge'&&(
            <div style={{ textAlign:'center',padding:'24px 0' }}>
              <Trophy style={{ width:30,height:30,color:'#fbbf24',margin:'0 auto 10px',opacity:0.6 }}/>
              <p style={{ fontSize:12,fontWeight:700,color:'#f0f4f8',margin:'0 0 6px',fontFamily:"'Space Grotesk',sans-serif" }}>Create a Challenge</p>
              <p style={{ fontSize:10,color:'#64748b',margin:'0 0 14px' }}>Include this workout as the challenge programme.</p>
              <button onClick={()=>{ openModal('challenge',{workoutId:workout.id}); onClose(); }}
                style={{ padding:'9px 18px',borderRadius:9,background:'rgba(251,191,36,0.12)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                Create Challenge with Workout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── WorkoutsTab ─────────────────────────────────────────────────────────── */
function WorkoutsTab({ workouts, saveWorkouts, openModal, allMemberships, myClasses, avatarMap }) {
  const [editorOpen,setEditorOpen] = useState(false);
  const [editingWO,setEditingWO]   = useState(null);
  const [selectedWO,setSelectedWO] = useState(null);
  const [assignWO,setAssignWO]     = useState(null);
  const [libSearch,setLibSearch]   = useState('');
  const [typeFilter,setTypeFilter] = useState('all');
  const [viewMode,setViewMode]     = useState('grid'); // grid | list

  const handleSave = draft => {
    const exists = workouts.find(w=>w.id===draft.id);
    saveWorkouts(exists?workouts.map(w=>w.id===draft.id?draft:w):[draft,...workouts]);
    setEditorOpen(false); setEditingWO(null);
  };
  const handleDelete    = id  => saveWorkouts(workouts.filter(w=>w.id!==id));
  const handleDuplicate = wo  => saveWorkouts([{...wo,id:uid(),name:`${wo.name} (copy)`},...workouts]);
  const handleEdit      = wo  => { setEditingWO(wo); setEditorOpen(true); };
  const handleNew       = ()  => { setEditingWO(null); setEditorOpen(true); };

  const filtered = useMemo(()=>workouts.filter(w=>
    (typeFilter==='all'||w.type===typeFilter)&&
    (!libSearch||(w.name||'').toLowerCase().includes(libSearch.toLowerCase()))
  ),[workouts,typeFilter,libSearch]);

  return (
    <>
      {assignWO&&<AssignModal workout={assignWO} allMemberships={allMemberships} myClasses={myClasses} avatarMap={avatarMap} openModal={openModal} onClose={()=>setAssignWO(null)}/>}

      {editorOpen
        ? <WorkoutEditor workout={editingWO} workouts={workouts} onSave={handleSave} onCancel={()=>{ setEditorOpen(false); setEditingWO(null); }}/>
        : (
          <>
            {/* Library header */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
              <SectionLabel accent="#a78bfa">Workout Library</SectionLabel>
              <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                <div style={{ display:'flex',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,overflow:'hidden' }}>
                  {[{id:'grid',icon:LayoutGrid},{id:'list',icon:List}].map(v=>(
                    <button key={v.id} onClick={()=>setViewMode(v.id)}
                      style={{ padding:'5px 8px',background:viewMode===v.id?'rgba(167,139,250,0.15)':'transparent',border:'none',cursor:'pointer',color:viewMode===v.id?'#a78bfa':'#3a5070',display:'flex',alignItems:'center' }}>
                      <v.icon style={{ width:11,height:11 }}/>
                    </button>
                  ))}
                </div>
                <NewBtn onClick={handleNew} label="New Workout"/>
              </div>
            </div>

            {/* Search + filter */}
            <div style={{ display:'flex',gap:7,flexWrap:'wrap',alignItems:'center' }}>
              <div style={{ position:'relative',flex:1,minWidth:130 }}>
                <Search style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:11,height:11,color:'#3a5070' }}/>
                <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Search workouts…"
                  style={{ ...inputBase,width:'100%',paddingLeft:27 }}/>
              </div>
              <div style={{ display:'flex',gap:3,flexWrap:'wrap' }}>
                {[{id:'all',label:'All'},...Object.entries(WORKOUT_TYPES).map(([k,v])=>({id:k,label:`${v.emoji} ${v.label}`}))].map(t=>(
                  <button key={t.id} onClick={()=>setTypeFilter(t.id)}
                    style={{ padding:'4px 9px',borderRadius:7,fontSize:9,fontWeight:typeFilter===t.id?700:500,background:typeFilter===t.id?'rgba(167,139,250,0.12)':'transparent',border:`1px solid ${typeFilter===t.id?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.05)'}`,color:typeFilter===t.id?'#a78bfa':'#3a5070',cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid or list */}
            {filtered.length===0
              ? (
                <div style={{ textAlign:'center',padding:'32px 0',borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(255,255,255,0.07)' }}>
                  <Dumbbell style={{ width:24,height:24,color:'#3a5070',margin:'0 auto 8px' }}/>
                  <p style={{ fontSize:11,color:'#3a5070',fontWeight:600,margin:'0 0 10px' }}>No workouts found</p>
                  <NewBtn onClick={handleNew} label="Create first workout"/>
                </div>
              )
              : viewMode==='grid'
                ? (
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:10 }}>
                    {filtered.map((wo,i)=>(
                      <WorkoutCard key={wo.id||i} workout={wo} isSelected={selectedWO?.id===wo.id}
                        onSelect={setSelectedWO} onEdit={handleEdit} onDelete={handleDelete}
                        onDuplicate={handleDuplicate} onAssign={setAssignWO}/>
                    ))}
                  </div>
                )
                : (
                  <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                    {filtered.map((wo,i)=>{
                      const tc=WORKOUT_TYPES[wo.type]||WORKOUT_TYPES.strength;
                      return (
                        <div key={wo.id||i} onClick={()=>setSelectedWO(wo)}
                          style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:11,background:'#0c1a2e',border:`1px solid ${selectedWO?.id===wo.id?`${tc.color}40`:'rgba(255,255,255,0.07)'}`,cursor:'pointer',transition:'all 0.14s' }}>
                          <div style={{ width:30,height:30,borderRadius:8,background:tc.bg,border:`1px solid ${tc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>{tc.emoji}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:12,fontWeight:800,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>{wo.name}</div>
                            <div style={{ fontSize:9,color:'#64748b' }}>{wo.main.length} exercises · {wo.duration}min · {wo.difficulty}</div>
                          </div>
                          <Badge color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Badge>
                          <button onClick={e=>{ e.stopPropagation(); setAssignWO(wo); }}
                            style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,background:`${tc.color}10`,border:`1px solid ${tc.color}24`,color:tc.color,fontSize:9,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>
                            <Play style={{ width:8,height:8 }}/> Assign
                          </button>
                          <DotMenu items={[
                            {icon:Edit2,label:'Edit',action:()=>handleEdit(wo)},
                            {icon:Copy,label:'Duplicate',action:()=>handleDuplicate(wo)},
                            {icon:Trash2,label:'Delete',action:()=>handleDelete(wo.id),danger:true},
                          ]}/>
                        </div>
                      );
                    })}
                  </div>
                )
            }

            {/* Selected detail */}
            {selectedWO&&(()=>{
              const tc=WORKOUT_TYPES[selectedWO.type]||WORKOUT_TYPES.strength;
              return (
                <div style={{ borderRadius:16,background:'#0c1a2e',border:`1px solid ${tc.color}28`,overflow:'hidden' }}>
                  <div style={{ padding:'14px 16px 12px',background:`${tc.color}05`,borderBottom:`1px solid ${tc.color}14`,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:34,height:34,borderRadius:9,background:tc.bg,border:`1px solid ${tc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>{tc.emoji}</div>
                      <div>
                        <div style={{ fontSize:14,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>{selectedWO.name}</div>
                        <div style={{ display:'flex',gap:7,marginTop:2 }}>
                          <Badge color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Badge>
                          {selectedWO.duration&&<span style={{ fontSize:9,color:'#64748b' }}>⏱ {selectedWO.duration}min</span>}
                          {selectedWO.difficulty&&<span style={{ fontSize:9,color:'#64748b' }}>{selectedWO.difficulty}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <button onClick={()=>handleEdit(selectedWO)}
                        style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:8,background:`${tc.color}0e`,border:`1px solid ${tc.color}22`,color:tc.color,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                        <Edit2 style={{ width:10,height:10 }}/> Edit
                      </button>
                      <button onClick={()=>setAssignWO(selectedWO)}
                        style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background:`${tc.color}20`,border:`1px solid ${tc.color}38`,color:tc.color,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                        <Play style={{ width:10,height:10 }}/> Assign
                      </button>
                      <button onClick={()=>setSelectedWO(null)}
                        style={{ width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',cursor:'pointer' }}>
                        <X style={{ width:11,height:11 }}/>
                      </button>
                    </div>
                  </div>
                  <div style={{ padding:'14px 16px',display:'grid',gridTemplateColumns:'1fr 2fr 1fr',gap:12 }}>
                    {[
                      {title:'Warmup',exercises:selectedWO.warmup,accent:'#38bdf8',emoji:'🔥'},
                      {title:'Main Workout',exercises:selectedWO.main,accent:tc.color,emoji:tc.emoji},
                      {title:'Cooldown',exercises:selectedWO.cooldown,accent:'#34d399',emoji:'❄️'},
                    ].map((sec,si)=>(
                      <div key={si} style={{ borderRadius:10,padding:'10px 11px',background:`${sec.accent}05`,border:`1px solid ${sec.accent}16` }}>
                        <div style={{ fontSize:9,fontWeight:800,color:sec.accent,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:7 }}>{sec.emoji} {sec.title}</div>
                        {sec.exercises.length===0
                          ? <p style={{ fontSize:9,color:'#3a5070',margin:0 }}>—</p>
                          : sec.exercises.map((ex,i)=>(
                            <div key={i} style={{ display:'flex',alignItems:'center',gap:5,marginBottom:4 }}>
                              <div style={{ width:3,height:3,borderRadius:'50%',background:sec.accent,flexShrink:0 }}/>
                              <span style={{ fontSize:10,color:'#94a3b8',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{ex.name}</span>
                              {ex.video&&<a href={ex.video} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ color:sec.accent,flexShrink:0 }}><Video style={{ width:9,height:9 }}/></a>}
                              {(ex.sets||ex.reps)&&<span style={{ fontSize:8,color:'#475569',flexShrink:0 }}>{ex.sets?`${ex.sets}×${ex.reps}`:ex.reps}</span>}
                            </div>
                          ))
                        }
                      </div>
                    ))}
                  </div>
                  {selectedWO.notes&&(
                    <div style={{ padding:'0 16px 14px' }}>
                      <div style={{ padding:'8px 11px',borderRadius:8,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',fontSize:10,color:'#64748b',lineHeight:1.5 }}>
                        📝 {selectedWO.notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )
      }
    </>
  );
}

/* ─── ProgramsTab ─────────────────────────────────────────────────────────── */
function ProgramsTab({ workouts }) {
  const [programs,setPrograms] = useState(()=>ls('coachPrograms',DEFAULT_PROGRAMS));
  const [selected,setSelected] = useState(null);
  const [editing,setEditing]   = useState(false);
  const [draft,setDraft]       = useState(null);
  const [activeWeek,setActiveWeek] = useState(1);
  const [dayModal,setDayModal] = useState(null); // {week, day}
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const save = p => { setPrograms(p); lsSet('coachPrograms',p); };
  const handleNew = () => {
    const p = {id:uid(),name:'',weeks:8,type:'strength',description:'',weeks_data:{}};
    setDraft(p); setEditing(true); setSelected(null);
  };

  const getCell = (prog,week,day) => prog.weeks_data?.[`${week}-${day}`];
  const setCell = (prog,week,day,val) => {
    const nd = {...prog, weeks_data:{...prog.weeks_data,[`${week}-${day}`]:val}};
    save(programs.map(p=>p.id===prog.id?nd:p));
    setSelected(nd);
  };

  if (editing && draft) return (
    <div style={{ borderRadius:16,background:'#0c1a2e',border:'1px solid rgba(167,139,250,0.28)',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 12px',background:'rgba(167,139,250,0.06)',borderBottom:'1px solid rgba(167,139,250,0.14)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <span style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>{draft.id&&programs.find(p=>p.id===draft.id)?'Edit Program':'New Program'}</span>
          <button onClick={()=>setEditing(false)} style={{ width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b',cursor:'pointer' }}><X style={{ width:11,height:11 }}/></button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 80px',gap:6,marginBottom:6 }}>
          <input value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} placeholder="Program name (e.g. 12-Week Strength Foundation)" style={{ ...inputBase }}/>
          <input value={draft.weeks} onChange={e=>setDraft(p=>({...p,weeks:parseInt(e.target.value)||8}))} type="number" placeholder="Weeks" style={{ ...inputBase }}/>
        </div>
        <textarea value={draft.description} onChange={e=>setDraft(p=>({...p,description:e.target.value}))} placeholder="Program description, goals, who it's for…"
          style={{ ...inputBase,width:'100%',minHeight:54,resize:'vertical',lineHeight:1.5,marginBottom:6 }}/>
        <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
          {Object.entries(WORKOUT_TYPES).map(([key,t])=>(
            <button key={key} onClick={()=>setDraft(p=>({...p,type:key}))} className="type-btn"
              style={{ background:draft.type===key?t.bg:'transparent',border:`1px solid ${draft.type===key?t.border:'rgba(255,255,255,0.07)'}`,color:draft.type===key?t.color:'#3a5070' }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'14px 16px',display:'flex',gap:7 }}>
        <button onClick={()=>setEditing(false)}
          style={{ flex:1,padding:'9px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
          Cancel
        </button>
        <button onClick={()=>{
          const exists=programs.find(p=>p.id===draft.id);
          save(exists?programs.map(p=>p.id===draft.id?draft:p):[draft,...programs]);
          setSelected(draft); setEditing(false);
        }} disabled={!draft.name.trim()}
          style={{ flex:2,padding:'9px',borderRadius:9,background:draft.name.trim()?'rgba(167,139,250,0.18)':'rgba(255,255,255,0.03)',border:`1px solid ${draft.name.trim()?'rgba(167,139,250,0.35)':'rgba(255,255,255,0.06)'}`,color:draft.name.trim()?'#a78bfa':'#3a5070',fontSize:11,fontWeight:800,cursor:draft.name.trim()?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif" }}>
          ✓ Save Program
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SectionLabel accent="#a78bfa" action={<NewBtn onClick={handleNew} label="New Program"/>}>
        Training Programs
      </SectionLabel>

      {/* Program list */}
      {programs.length===0
        ? <div style={{ textAlign:'center',padding:'32px 0',borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(255,255,255,0.07)' }}>
            <Layers style={{ width:24,height:24,color:'#3a5070',margin:'0 auto 8px' }}/>
            <p style={{ fontSize:11,color:'#3a5070',fontWeight:600,margin:'0 0 10px' }}>No programs yet</p>
            <NewBtn onClick={handleNew} label="Create first program"/>
          </div>
        : <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {programs.map(prog=>{
              const tc=WORKOUT_TYPES[prog.type]||WORKOUT_TYPES.strength;
              const totalCells=Object.keys(prog.weeks_data||{}).filter(k=>prog.weeks_data[k]).length;
              return (
                <div key={prog.id} onClick={()=>setSelected(selected?.id===prog.id?null:prog)}
                  style={{ borderRadius:12,background:'#0c1a2e',border:`1px solid ${selected?.id===prog.id?`${tc.color}35`:'rgba(255,255,255,0.07)'}`,overflow:'hidden',cursor:'pointer',transition:'all 0.14s' }}>
                  <div style={{ height:3,background:`linear-gradient(90deg,${tc.color},${tc.color}44)` }}/>
                  <div style={{ padding:'12px 14px',display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ width:38,height:38,borderRadius:10,background:tc.bg,border:`1px solid ${tc.border}`,display:'flex',alignItems:'center',flexDirection:'column',justifyContent:'center',flexShrink:0 }}>
                      <span style={{ fontSize:15 }}>{tc.emoji}</span>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>{prog.name}</div>
                      <div style={{ fontSize:9,color:'#64748b',marginTop:2 }}>
                        {prog.weeks} weeks · {totalCells} sessions planned
                      </div>
                      {prog.description&&<div style={{ fontSize:10,color:'#3a5070',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{prog.description}</div>}
                    </div>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <button onClick={e=>{ e.stopPropagation(); setDraft({...prog}); setEditing(true); }}
                        style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 9px',borderRadius:7,background:`${tc.color}0e`,border:`1px solid ${tc.color}22`,color:tc.color,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                        <Edit2 style={{ width:9,height:9 }}/> Edit
                      </button>
                      <button onClick={e=>{ e.stopPropagation(); save(programs.filter(p=>p.id!==prog.id)); if(selected?.id===prog.id)setSelected(null); }}
                        style={{ width:24,height:24,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.18)',cursor:'pointer',color:'#f87171' }}>
                        <Trash2 style={{ width:9,height:9 }}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {/* Program builder grid */}
      {selected&&(()=>{
        const tc=WORKOUT_TYPES[selected.type]||WORKOUT_TYPES.strength;
        const weeks=Math.min(selected.weeks,12);
        return (
          <div style={{ borderRadius:16,background:'#0c1a2e',border:`1px solid ${tc.color}28`,overflow:'hidden' }}>
            <div style={{ padding:'14px 16px 12px',background:`${tc.color}05`,borderBottom:`1px solid ${tc.color}14` }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                <span style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>📋 {selected.name}</span>
                <Badge color={tc.color} bg={tc.bg} border={tc.border}>{selected.weeks} weeks</Badge>
              </div>
              {/* Week selector */}
              <div style={{ display:'flex',gap:4,overflowX:'auto' }} className="scrollbar-hide">
                {Array.from({length:weeks},(_,i)=>i+1).map(w=>(
                  <button key={w} onClick={()=>setActiveWeek(w)}
                    style={{ padding:'4px 10px',borderRadius:7,background:activeWeek===w?tc.bg:'rgba(255,255,255,0.03)',border:`1px solid ${activeWeek===w?tc.border:'rgba(255,255,255,0.06)'}`,color:activeWeek===w?tc.color:'#3a5070',fontSize:9,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>
                    Wk {w}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6 }}>
                {DAYS.map(day=>{
                  const cell=getCell(selected,activeWeek,day);
                  const wo=cell?.workoutId?workouts.find(w=>w.id===cell.workoutId):null;
                  const wtc=wo?WORKOUT_TYPES[wo.type]||WORKOUT_TYPES.strength:null;
                  return (
                    <div key={day} className={`program-day${!cell?' rest':''}`}
                      onClick={()=>setDayModal({week:activeWeek,day})}>
                      <div style={{ fontSize:8,fontWeight:700,color:'#3a5070',marginBottom:5,textTransform:'uppercase' }}>{day}</div>
                      {wo
                        ? (
                          <>
                            <div style={{ fontSize:8,color:wtc.color,fontWeight:800,marginBottom:2 }}>{wtc.emoji}</div>
                            <div style={{ fontSize:9,color:'#94a3b8',fontWeight:700,lineHeight:1.2,wordBreak:'break-word' }}>{wo.name}</div>
                            {cell.note&&<div style={{ fontSize:8,color:'#3a5070',marginTop:3,fontStyle:'italic' }}>{cell.note}</div>}
                          </>
                        )
                        : <div style={{ fontSize:9,color:'#3a5070',fontStyle:'italic' }}>Rest</div>
                      }
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:9,color:'#3a5070',marginTop:8,textAlign:'center' }}>Click any day to assign a workout or set as rest</div>
            </div>
          </div>
        );
      })()}

      {/* Day assignment popup */}
      {dayModal&&selected&&(
        <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setDayModal(null)}>
          <div style={{ width:320,background:'#0d1b2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:18,boxShadow:'0 16px 48px rgba(0,0,0,0.5)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',marginBottom:4,fontFamily:"'Space Grotesk',sans-serif" }}>Week {dayModal.week} — {dayModal.day}</div>
            <div style={{ fontSize:10,color:'#64748b',marginBottom:12 }}>Assign a workout or mark as rest</div>
            <div style={{ maxHeight:200,overflowY:'auto' }} className="scrollbar-hide">
              <div onClick={()=>{ setCell(selected,dayModal.week,dayModal.day,null); setDayModal(null); }}
                style={{ padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer',marginBottom:5,fontSize:10,color:'#64748b',fontWeight:600 }}>
                😴 Rest / Recovery Day
              </div>
              {workouts.map(wo=>{
                const wtc=WORKOUT_TYPES[wo.type]||WORKOUT_TYPES.strength;
                return (
                  <div key={wo.id} onClick={()=>{
                    setCell(selected,dayModal.week,dayModal.day,{workoutId:wo.id,note:''});
                    setDayModal(null);
                  }} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer',marginBottom:5,transition:'all 0.12s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=`${wtc.color}35`}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}>
                    <span style={{ fontSize:13 }}>{wtc.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11,fontWeight:700,color:'#f0f4f8' }}>{wo.name}</div>
                      <div style={{ fontSize:9,color:'#64748b' }}>{wo.duration}min · {wo.difficulty}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={()=>setDayModal(null)}
              style={{ width:'100%',marginTop:10,padding:'8px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── NutritionTab ────────────────────────────────────────────────────────── */
function NutritionTab() {
  const [plans,setPlans] = useState(()=>ls('coachNutrition',DEFAULT_PLANS));
  const [selected,setSelected] = useState(plans[0]||null);
  const [editing,setEditing]   = useState(false);
  const [draft,setDraft]       = useState(null);
  const save = p => { setPlans(p); lsSet('coachNutrition',p); };

  const MacroBar = ({label,val,total,color}) => (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
        <span style={{ fontSize:10,color:'#94a3b8',fontWeight:600 }}>{label}</span>
        <span style={{ fontSize:10,color,fontWeight:800 }}>{val}g</span>
      </div>
      <div style={{ height:4,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
        <div style={{ height:'100%',borderRadius:99,background:color,width:`${Math.min(100,(val/total)*100)}%`,transition:'width 0.5s' }}/>
      </div>
    </div>
  );

  if (editing&&draft) return (
    <div style={{ borderRadius:16,background:'#0c1a2e',border:'1px solid rgba(52,211,153,0.28)',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 12px',background:'rgba(52,211,153,0.05)',borderBottom:'1px solid rgba(52,211,153,0.14)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <span style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>🥗 {draft.id&&plans.find(p=>p.id===draft.id)?'Edit Plan':'New Plan'}</span>
          <button onClick={()=>setEditing(false)} style={{ width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b',cursor:'pointer' }}><X style={{ width:11,height:11 }}/></button>
        </div>
        <input value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} placeholder="Plan name" style={{ ...inputBase,width:'100%',marginBottom:6 }}/>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:6 }}>
          {['calories','protein','carbs','fat'].map(k=>(
            <div key={k}>
              <div style={{ fontSize:9,color:'#3a5070',marginBottom:3,textTransform:'capitalize' }}>{k}{k==='calories'?' (kcal)':'g'}</div>
              <input type="number" value={draft[k]} onChange={e=>setDraft(p=>({...p,[k]:parseInt(e.target.value)||0}))} style={{ ...inputBase,width:'100%' }}/>
            </div>
          ))}
        </div>
        <textarea value={draft.notes} onChange={e=>setDraft(p=>({...p,notes:e.target.value}))} placeholder="Dietary notes, restrictions, meal timing…"
          style={{ ...inputBase,width:'100%',minHeight:48,resize:'vertical',lineHeight:1.5,marginBottom:6 }}/>
        <div style={{ fontSize:10,fontWeight:700,color:'#64748b',marginBottom:6 }}>Meal Structure</div>
        {(draft.meals||[]).map((m,i)=>(
          <div key={m.id} style={{ display:'flex',gap:6,marginBottom:5 }}>
            <input value={m.name} onChange={e=>{ const u=[...draft.meals]; u[i]={...m,name:e.target.value}; setDraft(p=>({...p,meals:u})); }} placeholder="Meal" style={{ ...inputBase,width:100 }}/>
            <input value={m.foods} onChange={e=>{ const u=[...draft.meals]; u[i]={...m,foods:e.target.value}; setDraft(p=>({...p,meals:u})); }} placeholder="Foods, portions…" style={{ ...inputBase,flex:1 }}/>
            <button onClick={()=>setDraft(p=>({...p,meals:p.meals.filter((_,j)=>j!==i)}))} style={{ color:'#f87171',background:'none',border:'none',cursor:'pointer' }}><X style={{ width:11,height:11 }}/></button>
          </div>
        ))}
        <button onClick={()=>setDraft(p=>({...p,meals:[...(p.meals||[]),{id:uid(),name:'',foods:''}]}))}
          style={{ fontSize:10,color:'#34d399',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:7,padding:'5px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
          + Add meal
        </button>
      </div>
      <div style={{ padding:'12px 16px',display:'flex',gap:7 }}>
        <button onClick={()=>setEditing(false)} style={{ flex:1,padding:'9px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
        <button onClick={()=>{
          const ex=plans.find(p=>p.id===draft.id);
          save(ex?plans.map(p=>p.id===draft.id?draft:p):[draft,...plans]);
          setSelected(draft); setEditing(false);
        }} style={{ flex:2,padding:'9px',borderRadius:9,background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
          ✓ Save Plan
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SectionLabel accent="#34d399" action={<NewBtn onClick={()=>{ setDraft({id:uid(),name:'',calories:2000,protein:150,carbs:200,fat:70,notes:'',meals:[]}); setEditing(true); }} label="New Plan" color="#34d399"/>}>
        Nutrition Plans
      </SectionLabel>
      <div style={{ display:'grid',gridTemplateColumns:'220px 1fr',gap:12,alignItems:'start' }}>
        {/* Plan list */}
        <div>
          {plans.map(plan=>(
            <div key={plan.id} onClick={()=>setSelected(plan)}
              style={{ padding:'10px 12px',borderRadius:11,background:'#0c1a2e',border:`1px solid ${selected?.id===plan.id?'rgba(52,211,153,0.35)':'rgba(255,255,255,0.07)'}`,cursor:'pointer',marginBottom:7,transition:'all 0.14s' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#f0f4f8',marginBottom:2,fontFamily:"'Space Grotesk',sans-serif" }}>{plan.name}</div>
              <div style={{ fontSize:9,color:'#64748b' }}>🔥 {plan.calories} kcal · 💪 {plan.protein}g protein</div>
              <div style={{ display:'flex',gap:6,marginTop:6 }}>
                <button onClick={e=>{ e.stopPropagation(); setDraft({...plan}); setEditing(true); }}
                  style={{ fontSize:9,color:'#34d399',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.18)',borderRadius:5,padding:'2px 7px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Edit</button>
                <button onClick={e=>{ e.stopPropagation(); save(plans.filter(p=>p.id!==plan.id)); if(selected?.id===plan.id)setSelected(null); }}
                  style={{ fontSize:9,color:'#f87171',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.18)',borderRadius:5,padding:'2px 7px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Delete</button>
              </div>
            </div>
          ))}
          {plans.length===0&&<div style={{ fontSize:10,color:'#3a5070',textAlign:'center',padding:'20px 0' }}>No plans yet</div>}
        </div>

        {/* Plan detail */}
        {selected ? (
          <div style={{ borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(52,211,153,0.2)',overflow:'hidden' }}>
            <div style={{ padding:'12px 14px 10px',background:'rgba(52,211,153,0.04)',borderBottom:'1px solid rgba(52,211,153,0.12)' }}>
              <div style={{ fontSize:14,fontWeight:900,color:'#f0f4f8',marginBottom:2,fontFamily:"'Space Grotesk',sans-serif" }}>🥗 {selected.name}</div>
              <div style={{ fontSize:10,color:'#64748b' }}>🔥 {selected.calories} kcal / day</div>
            </div>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ marginBottom:12 }}>
                <MacroBar label="Protein" val={selected.protein} total={400} color="#f87171"/>
                <MacroBar label="Carbohydrates" val={selected.carbs} total={400} color="#fbbf24"/>
                <MacroBar label="Fat" val={selected.fat} total={150} color="#34d399"/>
              </div>
              {selected.notes&&(
                <div style={{ padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',fontSize:10,color:'#64748b',lineHeight:1.5,marginBottom:10 }}>
                  📝 {selected.notes}
                </div>
              )}
              <div style={{ fontSize:10,fontWeight:800,color:'#f0f4f8',marginBottom:8,fontFamily:"'Space Grotesk',sans-serif" }}>Meal Structure</div>
              {(selected.meals||[]).map((m,i)=>(
                <div key={m.id||i} style={{ display:'flex',alignItems:'flex-start',gap:9,padding:'7px 10px',borderRadius:9,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',marginBottom:6 }}>
                  <div style={{ width:22,height:22,borderRadius:6,background:'rgba(52,211,153,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11 }}>
                    {i===0?'🌅':i===1?'☀️':i===2?'🌙':'🍎'}
                  </div>
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:'#f0f4f8' }}>{m.name}</div>
                    <div style={{ fontSize:10,color:'#64748b' }}>{m.foods}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center',padding:'32px 0',borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(255,255,255,0.07)' }}>
            <Apple style={{ width:22,height:22,color:'#3a5070',margin:'0 auto 8px' }}/>
            <p style={{ fontSize:11,color:'#3a5070',margin:0 }}>Select a plan to view details</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── HabitsTab ───────────────────────────────────────────────────────────── */
function HabitsTab({ allMemberships }) {
  const [habits,setHabits] = useState(()=>ls('coachHabits',DEFAULT_HABITS));
  const [adding,setAdding] = useState(false);
  const [draft,setDraft]   = useState({id:'',name:'',category:'hydration',target:'',color:'#38bdf8'});
  const [assignId,setAssignId] = useState(null);
  const save = h => { setHabits(h); lsSet('coachHabits',h); };

  return (
    <>
      <SectionLabel accent="#fbbf24" action={<NewBtn onClick={()=>{ setDraft({id:uid(),name:'',category:'hydration',target:'',color:'#38bdf8'}); setAdding(true); }} label="New Habit" color="#fbbf24"/>}>
        Habit Tracker
      </SectionLabel>

      {adding&&(
        <div style={{ borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(251,191,36,0.28)',padding:'14px 16px',marginBottom:2 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <span style={{ fontSize:12,fontWeight:800,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>New Habit</span>
            <button onClick={()=>setAdding(false)} style={{ width:24,height:24,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b',cursor:'pointer' }}><X style={{ width:10,height:10 }}/></button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8 }}>
            <input value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} placeholder="Habit name (e.g. Drink 2L water)" style={{ ...inputBase }}/>
            <input value={draft.target} onChange={e=>setDraft(p=>({...p,target:e.target.value}))} placeholder="Target / description" style={{ ...inputBase }}/>
          </div>
          <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:10 }}>
            {HABIT_CATS.map(cat=>(
              <button key={cat.id} onClick={()=>setDraft(p=>({...p,category:cat.id,color:cat.color}))}
                style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,background:draft.category===cat.id?`${cat.color}18`:'transparent',border:`1px solid ${draft.category===cat.id?`${cat.color}35`:'rgba(255,255,255,0.07)'}`,color:draft.category===cat.id?cat.color:'#3a5070',fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                <cat.icon style={{ width:9,height:9 }}/> {cat.label}
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:7 }}>
            <button onClick={()=>setAdding(false)} style={{ flex:1,padding:'8px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={()=>{ if(draft.name.trim()){ save([{...draft},...habits]); setAdding(false); } }}
              style={{ flex:2,padding:'8px',borderRadius:8,background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
              ✓ Add Habit
            </button>
          </div>
        </div>
      )}

      {habits.length===0
        ? <div style={{ textAlign:'center',padding:'32px 0',borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(255,255,255,0.07)' }}>
            <CheckSquare style={{ width:22,height:22,color:'#3a5070',margin:'0 auto 8px' }}/>
            <p style={{ fontSize:11,color:'#3a5070',margin:0 }}>No habits yet</p>
          </div>
        : habits.map(habit=>{
          const cat=HABIT_CATS.find(c=>c.id===habit.category)||HABIT_CATS[0];
          return (
            <div key={habit.id} className="habit-row">
              <div style={{ width:32,height:32,borderRadius:9,background:`${habit.color}18`,border:`1px solid ${habit.color}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <cat.icon style={{ width:13,height:13,color:habit.color }}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#f0f4f8' }}>{habit.name}</div>
                <div style={{ fontSize:9,color:'#64748b',display:'flex',alignItems:'center',gap:5 }}>
                  <span style={{ color:habit.color,fontWeight:700 }}>{cat.label}</span>
                  {habit.target&&<>·<span>{habit.target}</span></>}
                </div>
              </div>
              <button onClick={()=>setAssignId(assignId===habit.id?null:habit.id)}
                style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,background:`${habit.color}10`,border:`1px solid ${habit.color}24`,color:habit.color,fontSize:9,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>
                <Users style={{ width:9,height:9 }}/> Assign
              </button>
              <button onClick={()=>save(habits.filter(h=>h.id!==habit.id))}
                style={{ width:24,height:24,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.18)',cursor:'pointer',color:'#f87171',flexShrink:0 }}>
                <Trash2 style={{ width:9,height:9 }}/>
              </button>
            </div>
          );
        })
      }
      <div style={{ marginTop:4,padding:'10px 14px',borderRadius:11,background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.14)',fontSize:10,color:'#64748b',lineHeight:1.5 }}>
        💡 Habits are assigned to individual clients via their profile. Track completion streaks in the Member tab.
      </div>
    </>
  );
}

/* ─── ContentTab ──────────────────────────────────────────────────────────── */
function ContentTab({ openModal }) {
  const [events,setEvents] = useState(()=>ls('coachCalEvents',CAL_EVENTS_SEED));
  const [view,setView]     = useState('calendar'); // calendar | list
  const [showAdd,setShowAdd] = useState(false);
  const [draft,setDraft]   = useState({id:'',title:'',date:'',type:'post',color:'#a78bfa'});
  const save = e => { setEvents(e); lsSet('coachCalEvents',e); };

  const today = format(new Date(),'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(),{weekStartsOn:1});
  const calDays = Array.from({length:28},(_,i)=>addDays(weekStart,i));

  const EVENT_TYPES = [
    {id:'post',label:'Post',color:'#a78bfa'},
    {id:'form',label:'Check-in',color:'#34d399'},
    {id:'recap',label:'Recap',color:'#38bdf8'},
    {id:'photo',label:'Photos',color:'#fbbf24'},
    {id:'workout',label:'Workout',color:'#818cf8'},
  ];

  return (
    <>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:12 }}>
        <SectionLabel accent="#38bdf8">Content Calendar</SectionLabel>
        <div style={{ display:'flex',gap:6 }}>
          <div style={{ display:'flex',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,overflow:'hidden' }}>
            {[{id:'calendar',icon:Calendar},{id:'list',icon:List}].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id)}
                style={{ padding:'5px 8px',background:view===v.id?'rgba(56,189,248,0.15)':'transparent',border:'none',cursor:'pointer',color:view===v.id?'#38bdf8':'#3a5070',display:'flex',alignItems:'center' }}>
                <v.icon style={{ width:11,height:11 }}/>
              </button>
            ))}
          </div>
          <NewBtn onClick={()=>{ setDraft({id:uid(),title:'',date:today,type:'post',color:'#a78bfa'}); setShowAdd(true); }} label="Schedule" color="#38bdf8"/>
        </div>
      </div>

      {showAdd&&(
        <div style={{ borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(56,189,248,0.28)',padding:'14px 16px',marginBottom:4 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
            <span style={{ fontSize:12,fontWeight:800,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>Schedule Content</span>
            <button onClick={()=>setShowAdd(false)} style={{ width:24,height:24,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b',cursor:'pointer' }}><X style={{ width:10,height:10 }}/></button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 140px',gap:6,marginBottom:8 }}>
            <input value={draft.title} onChange={e=>setDraft(p=>({...p,title:e.target.value}))} placeholder="Content title or description" style={{ ...inputBase }}/>
            <input type="date" value={draft.date} onChange={e=>setDraft(p=>({...p,date:e.target.value}))} style={{ ...inputBase,colorScheme:'dark' }}/>
          </div>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:10 }}>
            {EVENT_TYPES.map(t=>(
              <button key={t.id} onClick={()=>setDraft(p=>({...p,type:t.id,color:t.color}))}
                style={{ padding:'4px 9px',borderRadius:7,background:draft.type===t.id?`${t.color}18`:'transparent',border:`1px solid ${draft.type===t.id?`${t.color}35`:'rgba(255,255,255,0.07)'}`,color:draft.type===t.id?t.color:'#3a5070',fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:7 }}>
            <button onClick={()=>setShowAdd(false)} style={{ flex:1,padding:'8px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={()=>{ if(draft.title&&draft.date){ save([...events,draft]); setShowAdd(false); } }}
              style={{ flex:2,padding:'8px',borderRadius:8,background:'rgba(56,189,248,0.15)',border:'1px solid rgba(56,189,248,0.3)',color:'#38bdf8',fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
              📅 Schedule
            </button>
          </div>
        </div>
      )}

      {view==='calendar' ? (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
              <div key={d} style={{ fontSize:8,fontWeight:700,color:'#3a5070',textAlign:'center',padding:'4px 0',textTransform:'uppercase' }}>{d}</div>
            ))}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
            {calDays.map((d,i)=>{
              const ds=format(d,'yyyy-MM-dd');
              const dayEvents=events.filter(e=>e.date===ds);
              return (
                <div key={i} className={`cal-day${ds===today?' today':''}`}>
                  <div style={{ fontSize:9,fontWeight:ds===today?900:600,color:ds===today?'#a78bfa':'#3a5070',marginBottom:3 }}>{format(d,'d')}</div>
                  {dayEvents.map((ev,j)=>(
                    <div key={j} className="cal-event" style={{ background:`${ev.color}18`,color:ev.color }}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          {[...events].sort((a,b)=>a.date.localeCompare(b.date)).map((ev,i)=>(
            <div key={ev.id||i} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,background:'#0c1a2e',border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width:36,height:36,borderRadius:9,background:`${ev.color}14`,border:`1px solid ${ev.color}25`,display:'flex',alignItems:'center',flexDirection:'column',justifyContent:'center',flexShrink:0 }}>
                <div style={{ fontSize:11,fontWeight:900,color:ev.color,lineHeight:1 }}>{ev.date.slice(8)}</div>
                <div style={{ fontSize:7,color:'#3a5070',textTransform:'uppercase' }}>{new Date(ev.date+'T00:00').toLocaleString('en',{month:'short'})}</div>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:11,fontWeight:700,color:'#f0f4f8' }}>{ev.title}</div>
                <Badge color={ev.color} bg={`${ev.color}14`} border={`${ev.color}28`}>
                  {EVENT_TYPES.find(t=>t.id===ev.type)?.label||ev.type}
                </Badge>
              </div>
              <button onClick={()=>save(events.filter(e=>e.id!==ev.id))}
                style={{ width:22,height:22,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.18)',cursor:'pointer',color:'#f87171' }}>
                <X style={{ width:9,height:9 }}/>
              </button>
            </div>
          ))}
          {events.length===0&&<div style={{ textAlign:'center',padding:'20px 0',color:'#3a5070',fontSize:11 }}>No scheduled content</div>}
        </div>
      )}
    </>
  );
}

/* ─── FormsTab ────────────────────────────────────────────────────────────── */
function FormsTab({ allMemberships, avatarMap }) {
  const [forms,setForms]     = useState(()=>ls('coachForms',DEFAULT_FORMS));
  const [selected,setSelected] = useState(forms[0]||null);
  const [editing,setEditing] = useState(false);
  const [draft,setDraft]     = useState(null);
  const [sendModal,setSendModal] = useState(null);
  const [sentTo,setSentTo]   = useState([]);
  const [sent,setSent]       = useState(false);
  const save = f => { setForms(f); lsSet('coachForms',f); };

  if (editing&&draft) return (
    <div style={{ borderRadius:16,background:'#0c1a2e',border:'1px solid rgba(52,211,153,0.28)',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 12px',background:'rgba(52,211,153,0.04)',borderBottom:'1px solid rgba(52,211,153,0.14)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <span style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>📋 Form Builder</span>
          <button onClick={()=>setEditing(false)} style={{ width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#64748b',cursor:'pointer' }}><X style={{ width:11,height:11 }}/></button>
        </div>
        <input value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} placeholder="Form name (e.g. Weekly Check-in)" style={{ ...inputBase,width:'100%',marginBottom:10 }}/>
        <div style={{ fontSize:10,fontWeight:700,color:'#64748b',marginBottom:8 }}>Questions</div>
        {(draft.questions||[]).map((q,i)=>(
          <div key={q.id} className="form-question">
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7 }}>
              <select value={q.type} onChange={e=>{ const u=[...draft.questions]; u[i]={...q,type:e.target.value}; setDraft(p=>({...p,questions:u})); }}
                style={{ ...inputBase,width:120,padding:'4px 7px',fontSize:10 }}>
                {Q_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <span style={{ fontSize:9,color:'#3a5070',flex:1 }}>Q{i+1}</span>
              <button onClick={()=>setDraft(p=>({...p,questions:p.questions.filter((_,j)=>j!==i)}))}
                style={{ color:'#f87171',background:'none',border:'none',cursor:'pointer' }}><X style={{ width:11,height:11 }}/></button>
            </div>
            <input value={q.prompt} onChange={e=>{ const u=[...draft.questions]; u[i]={...q,prompt:e.target.value}; setDraft(p=>({...p,questions:u})); }}
              placeholder="Question prompt…" style={{ ...inputBase,width:'100%' }}/>
          </div>
        ))}
        <button onClick={()=>setDraft(p=>({...p,questions:[...(p.questions||[]),{id:uid(),type:'scale',prompt:''}]}))}
          style={{ fontSize:10,color:'#34d399',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:7,padding:'5px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
          + Add question
        </button>
      </div>
      <div style={{ padding:'12px 16px',display:'flex',gap:7 }}>
        <button onClick={()=>setEditing(false)} style={{ flex:1,padding:'9px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
        <button onClick={()=>{
          const ex=forms.find(f=>f.id===draft.id);
          save(ex?forms.map(f=>f.id===draft.id?draft:f):[draft,...forms]);
          setSelected(draft); setEditing(false);
        }} style={{ flex:2,padding:'9px',borderRadius:9,background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
          ✓ Save Form
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SectionLabel accent="#34d399" action={<NewBtn onClick={()=>{ setDraft({id:uid(),name:'',questions:[]}); setEditing(true); }} label="New Form" color="#34d399"/>}>
        Forms & Check-ins
      </SectionLabel>

      <div style={{ display:'grid',gridTemplateColumns:'200px 1fr',gap:12,alignItems:'start' }}>
        {/* Form list */}
        <div>
          {forms.map(form=>(
            <div key={form.id} onClick={()=>setSelected(form)}
              style={{ padding:'10px 12px',borderRadius:11,background:'#0c1a2e',border:`1px solid ${selected?.id===form.id?'rgba(52,211,153,0.35)':'rgba(255,255,255,0.07)'}`,cursor:'pointer',marginBottom:7,transition:'all 0.14s' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#f0f4f8',marginBottom:2,fontFamily:"'Space Grotesk',sans-serif" }}>{form.name}</div>
              <div style={{ fontSize:9,color:'#64748b' }}>{form.questions.length} questions</div>
              <div style={{ display:'flex',gap:5,marginTop:6 }}>
                <button onClick={e=>{ e.stopPropagation(); setDraft({...form,questions:form.questions.map(q=>({...q}))}); setEditing(true); }}
                  style={{ fontSize:9,color:'#34d399',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.18)',borderRadius:5,padding:'2px 7px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Edit</button>
                <button onClick={e=>{ e.stopPropagation(); setSendModal(form); setSentTo([]); setSent(false); }}
                  style={{ fontSize:9,color:'#38bdf8',background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.18)',borderRadius:5,padding:'2px 7px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Send</button>
              </div>
            </div>
          ))}
          {forms.length===0&&<div style={{ fontSize:10,color:'#3a5070',textAlign:'center',padding:'20px 0' }}>No forms yet</div>}
        </div>

        {/* Form preview */}
        {selected ? (
          <div style={{ borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(52,211,153,0.2)',overflow:'hidden' }}>
            <div style={{ padding:'12px 14px',background:'rgba(52,211,153,0.04)',borderBottom:'1px solid rgba(52,211,153,0.12)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>📋 {selected.name}</div>
                <div style={{ fontSize:9,color:'#64748b',marginTop:1 }}>{selected.questions.length} questions · Client preview</div>
              </div>
              <button onClick={()=>{ setSendModal(selected); setSentTo([]); setSent(false); }}
                style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:9,background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399',fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                <Send style={{ width:10,height:10 }}/> Send to Members
              </button>
            </div>
            <div style={{ padding:'12px 14px' }}>
              {selected.questions.map((q,i)=>{
                const qt=Q_TYPES.find(t=>t.id===q.type);
                return (
                  <div key={q.id||i} style={{ padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',marginBottom:8 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}>
                      {qt&&<qt.icon style={{ width:11,height:11,color:'#34d399' }}/>}
                      <span style={{ fontSize:11,fontWeight:700,color:'#f0f4f8' }}>{q.prompt||`Question ${i+1}`}</span>
                    </div>
                    {q.type==='scale'&&(
                      <div style={{ display:'flex',gap:4 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                          <div key={n} style={{ width:26,height:26,borderRadius:6,border:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#3a5070' }}>{n}</div>
                        ))}
                      </div>
                    )}
                    {q.type==='text'&&<div style={{ height:40,borderRadius:7,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)' }}/>}
                    {q.type==='yesno'&&(
                      <div style={{ display:'flex',gap:8 }}>
                        {['Yes','No'].map(o=><div key={o} style={{ padding:'5px 16px',borderRadius:7,border:'1px solid rgba(255,255,255,0.1)',fontSize:11,color:'#3a5070' }}>{o}</div>)}
                      </div>
                    )}
                    {q.type==='number'&&<div style={{ width:80,height:30,borderRadius:7,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)' }}/>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center',padding:'32px 0',borderRadius:14,background:'#0c1a2e',border:'1px solid rgba(255,255,255,0.07)' }}>
            <FileText style={{ width:22,height:22,color:'#3a5070',margin:'0 auto 8px' }}/>
            <p style={{ fontSize:11,color:'#3a5070',margin:0 }}>Select a form to preview</p>
          </div>
        )}
      </div>

      {/* Send modal */}
      {sendModal&&(
        <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setSendModal(null)}>
          <div style={{ width:360,background:'#0d1b2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:18,boxShadow:'0 16px 48px rgba(0,0,0,0.5)' }} onClick={e=>e.stopPropagation()}>
            {sent ? (
              <div style={{ textAlign:'center',padding:'16px 0' }}>
                <Check style={{ width:32,height:32,color:'#34d399',margin:'0 auto 10px' }}/>
                <div style={{ fontSize:14,fontWeight:900,color:'#f0f4f8',marginBottom:4,fontFamily:"'Space Grotesk',sans-serif" }}>Form Sent!</div>
                <div style={{ fontSize:10,color:'#64748b',marginBottom:16 }}>Sent to {sentTo.length} member{sentTo.length!==1?'s':''}</div>
                <button onClick={()=>setSendModal(null)} style={{ padding:'8px 20px',borderRadius:9,background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize:13,fontWeight:900,color:'#f0f4f8',marginBottom:4,fontFamily:"'Space Grotesk',sans-serif" }}>Send: {sendModal.name}</div>
                <div style={{ fontSize:10,color:'#64748b',marginBottom:12 }}>Select members to send this form to</div>
                <div style={{ maxHeight:200,overflowY:'auto',marginBottom:12 }} className="scrollbar-hide">
                  {allMemberships.slice(0,10).map(m=>{
                    const id=m.user_id||m.id, chosen=sentTo.includes(id);
                    return (
                      <div key={id} onClick={()=>setSentTo(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])}
                        style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderRadius:8,background:chosen?'rgba(52,211,153,0.07)':'rgba(255,255,255,0.02)',border:`1px solid ${chosen?'rgba(52,211,153,0.25)':'rgba(255,255,255,0.05)'}`,cursor:'pointer',marginBottom:5 }}>
                        <div style={{ width:14,height:14,borderRadius:4,border:`1.5px solid ${chosen?'#34d399':'rgba(255,255,255,0.15)'}`,background:chosen?'#34d399':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                          {chosen&&<Check style={{ width:8,height:8,color:'#fff' }}/>}
                        </div>
                        <div style={{ fontSize:11,fontWeight:600,color:'#f0f4f8' }}>{m.user_name||m.name}</div>
                        {m.membership_type&&<div style={{ fontSize:9,color:'#64748b',marginLeft:'auto' }}>{m.membership_type}</div>}
                      </div>
                    );
                  })}
                  {allMemberships.length===0&&<div style={{ fontSize:10,color:'#3a5070',textAlign:'center',padding:'12px 0' }}>No members yet</div>}
                </div>
                <div style={{ display:'flex',gap:7 }}>
                  <button onClick={()=>setSendModal(null)} style={{ flex:1,padding:'8px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
                  <button onClick={()=>sentTo.length>0&&setSent(true)}
                    style={{ flex:2,padding:'8px',borderRadius:8,background:sentTo.length>0?'rgba(52,211,153,0.15)':'rgba(255,255,255,0.03)',border:`1px solid ${sentTo.length>0?'rgba(52,211,153,0.3)':'rgba(255,255,255,0.06)'}`,color:sentTo.length>0?'#34d399':'#3a5070',fontSize:10,fontWeight:800,cursor:sentTo.length>0?'pointer':'not-allowed',fontFamily:"'DM Sans',sans-serif" }}>
                    <Send style={{ width:9,height:9,display:'inline',marginRight:4 }}/>Send to {sentTo.length||''} Member{sentTo.length!==1?'s':''}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Right Sidebar ───────────────────────────────────────────────────────── */
function RightSidebar({ tab, workouts, openModal, shoutouts, polls, posts, recaps, events, now, allMemberships }) {
  const engScore = useMemo(()=>
    posts.reduce((s,p)=>s+(p.likes?.length||0)+(p.comments?.length||0),0)+
    shoutouts.reduce((s,sh)=>s+(sh.likes?.length||0),0)+
    polls.reduce((s,p)=>s+(p.voters?.length||0),0),
  [posts,shoutouts,polls]);

  const upcoming = useMemo(()=>events.filter(e=>new Date(e.event_date)>=now),[events,now]);

  const quickActions = [
    {icon:Dumbbell,     label:'New Workout',   sub:`${workouts.length} in library`,   color:'#a78bfa', action:()=>{}},
    {icon:Layers,       label:'New Program',   sub:'Multi-week plan',                  color:'#818cf8', action:()=>{}},
    {icon:MessageSquarePlus,label:'Post Update',sub:'Engage members',                  color:'#38bdf8', action:()=>openModal('post')},
    {icon:Award,        label:'Shoutout',      sub:`${shoutouts.length} sent`,          color:'#fbbf24', action:()=>openModal('shoutout')},
    {icon:ClipboardList,label:'Class Recap',   sub:`${recaps.length} recaps`,           color:'#a78bfa', action:()=>openModal('recap')},
    {icon:BarChart2,    label:'New Poll',      sub:`${polls.length} active`,            color:'#34d399', action:()=>openModal('poll')},
    {icon:Camera,       label:'Photo Request', sub:'Progress tracking',                color:'#f87171', action:()=>{}},
  ];

  return (
    <>
      {/* Quick Actions */}
      <div style={cardBase}>
        <div style={{ fontSize:12,fontWeight:900,color:'#f0f4f8',marginBottom:10,fontFamily:"'Space Grotesk',sans-serif" }}>Quick Actions</div>
        <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
          {quickActions.map(({icon:Ic,label,sub,color,action},i)=>(
            <button key={i} onClick={action} className="assign-btn"
              onMouseEnter={e=>{ e.currentTarget.style.background=`${color}0e`; e.currentTarget.style.borderColor=`${color}28`; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
              <div style={{ width:26,height:26,borderRadius:7,background:`${color}14`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Ic style={{ width:11,height:11,color }}/>
              </div>
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:'#f0f4f8' }}>{label}</div>
                <div style={{ fontSize:8,color:'#3a5070' }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Library stats */}
      <div style={cardBase}>
        <div style={{ fontSize:12,fontWeight:900,color:'#f0f4f8',marginBottom:10,fontFamily:"'Space Grotesk',sans-serif" }}>Library Stats</div>
        {Object.entries(WORKOUT_TYPES).map(([key,t])=>{
          const count=workouts.filter(w=>w.type===key).length;
          if(!count) return null;
          return (
            <div key={key} style={{ display:'flex',alignItems:'center',gap:7,padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:12 }}>{t.emoji}</span>
              <span style={{ flex:1,fontSize:10,color:'#8ba0b8',fontWeight:500 }}>{t.label}</span>
              <span style={{ fontSize:11,fontWeight:800,color:t.color,background:t.bg,border:`1px solid ${t.border}`,borderRadius:5,padding:'1px 7px',fontFamily:"'Space Grotesk',sans-serif" }}>{count}</span>
            </div>
          );
        })}
        <div style={{ display:'flex',alignItems:'center',gap:7,padding:'7px 0 0' }}>
          <span style={{ fontSize:12 }}>📚</span>
          <span style={{ flex:1,fontSize:10,color:'#8ba0b8',fontWeight:500 }}>Total workouts</span>
          <span style={{ fontSize:12,fontWeight:900,color:'#a78bfa',fontFamily:"'Space Grotesk',sans-serif" }}>{workouts.length}</span>
        </div>
      </div>

      {/* Engagement */}
      <div style={cardBase}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
          <div style={{ fontSize:12,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>Engagement</div>
          <TrendingUp style={{ width:12,height:12,color:'#a78bfa' }}/>
        </div>
        <div style={{ fontSize:26,fontWeight:900,color:'#f0f4f8',letterSpacing:'-0.04em',marginBottom:6,fontFamily:"'Space Grotesk',sans-serif" }}>{engScore}</div>
        <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
          {[
            {label:'Likes',    val:posts.reduce((s,p)=>s+(p.likes?.length||0),0),    color:'#f87171'},
            {label:'Comments', val:posts.reduce((s,p)=>s+(p.comments?.length||0),0), color:'#38bdf8'},
            {label:'Votes',    val:polls.reduce((s,p)=>s+(p.voters?.length||0),0),   color:'#a78bfa'},
          ].map((s,i)=>(
            <div key={i} style={{ fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:5,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:s.color }}>
              {s.val} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Members snapshot */}
      {allMemberships.length>0&&(
        <div style={cardBase}>
          <div style={{ fontSize:12,fontWeight:900,color:'#f0f4f8',marginBottom:10,fontFamily:"'Space Grotesk',sans-serif" }}>Members</div>
          {allMemberships.slice(0,5).map((m,i)=>(
            <div key={m.user_id||i} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none' }}>
              <div style={{ width:24,height:24,borderRadius:'50%',background:'rgba(167,139,250,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#a78bfa',flexShrink:0 }}>
                {(m.user_name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:10,fontWeight:700,color:'#f0f4f8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{m.user_name}</div>
                {m.membership_type&&<div style={{ fontSize:8,color:'#64748b' }}>{m.membership_type}</div>}
              </div>
            </div>
          ))}
          {allMemberships.length>5&&<div style={{ fontSize:9,color:'#3a5070',marginTop:6 }}>+{allMemberships.length-5} more members</div>}
        </div>
      )}

      {/* Upcoming events */}
      {upcoming.length>0&&(
        <div style={cardBase}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
            <div style={{ fontSize:12,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>Upcoming</div>
            <button onClick={()=>openModal('event')}
              style={{ fontSize:8,fontWeight:700,color:'#34d399',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.18)',borderRadius:5,padding:'2px 6px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>+ New</button>
          </div>
          {upcoming.slice(0,3).map((ev,i)=>{
            const d=new Date(ev.event_date);
            const diff=Math.floor((d-now)/86400000);
            return (
              <div key={ev.id||i} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:i<Math.min(upcoming.length,3)-1?'1px solid rgba(255,255,255,0.04)':'none' }}>
                <div style={{ flexShrink:0,background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.14)',borderRadius:7,padding:'4px 5px',textAlign:'center',minWidth:28 }}>
                  <div style={{ fontSize:12,fontWeight:900,color:'#34d399',lineHeight:1,fontFamily:"'Space Grotesk',sans-serif" }}>{format(d,'d')}</div>
                  <div style={{ fontSize:6,color:'#1a5a3a',textTransform:'uppercase' }}>{format(d,'MMM')}</div>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:10,fontWeight:700,color:'#f0f4f8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{ev.title}</div>
                  <div style={{ fontSize:8,color:diff<=2?'#f87171':'#64748b' }}>{diff===0?'Today':diff===1?'Tomorrow':`${diff}d away`}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent posts */}
      <div style={cardBase}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
          <div style={{ fontSize:12,fontWeight:900,color:'#f0f4f8',fontFamily:"'Space Grotesk',sans-serif" }}>Recent Posts</div>
          <button onClick={()=>openModal('post')}
            style={{ fontSize:8,fontWeight:700,color:'#a78bfa',background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.18)',borderRadius:5,padding:'2px 6px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>+ New</button>
        </div>
        {posts.length===0
          ? <div style={{ fontSize:10,color:'#3a5070',textAlign:'center',padding:'8px 0' }}>No posts yet</div>
          : posts.slice(0,3).map((p,i)=>(
            <div key={p.id||i} style={{ padding:'5px 7px',borderRadius:6,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)',marginBottom:i<2?4:0,fontSize:10,fontWeight:600,color:'#8ba0b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {p.content?.split('\n')[0]||p.title||'Post'}
            </div>
          ))
        }
      </div>
    </>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
const TABS = [
  { id:'workouts',  label:'Workouts',  icon:Dumbbell,     color:'#a78bfa' },
  { id:'programs',  label:'Programs',  icon:Layers,       color:'#818cf8' },
  { id:'nutrition', label:'Nutrition', icon:Apple,        color:'#34d399' },
  { id:'habits',    label:'Habits',    icon:CheckSquare,  color:'#fbbf24' },
  { id:'content',   label:'Content',   icon:Calendar,     color:'#38bdf8' },
  { id:'forms',     label:'Forms',     icon:FileText,     color:'#34d399' },
];

export default function TabCoachContent({
  events = [], polls = [], posts = [], classes: gymClasses = [], recaps = [], shoutouts = [],
  checkIns, ci30, avatarMap, allMemberships = [],
  openModal = ()=>{}, now = new Date(),
  onDeletePost=()=>{}, onDeleteEvent=()=>{}, onDeleteClass=()=>{},
  onDeletePoll=()=>{}, onDeleteRecap=()=>{}, onDeleteShoutout=()=>{},
}) {
  const [tab, setTab]         = useState('workouts');
  const [workouts, setWorkouts] = useState(()=>ls('coachWorkoutLibrary',DEFAULT_WORKOUTS));

  const saveWorkouts = u => { setWorkouts(u); lsSet('coachWorkoutLibrary',u); };

  const activeTab = TABS.find(t=>t.id===tab)||TABS[0];

  return (
    <>
      <style>{CSS}</style>
      <div className="coach-root">

        {/* ── Tab navigation ── */}
        <div className="tab-nav" style={{ marginBottom:4 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`tab-btn${tab===t.id?' active':''}`}
              style={{ color:tab===t.id?t.color:undefined }}>
              <t.icon style={{ width:12,height:12,flexShrink:0 }}/>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="coach-layout">

          {/* ── Left content ── */}
          <div className="coach-left">
            {tab==='workouts'&&(
              <WorkoutsTab
                workouts={workouts} saveWorkouts={saveWorkouts}
                openModal={openModal} allMemberships={allMemberships}
                myClasses={gymClasses} avatarMap={avatarMap}
              />
            )}
            {tab==='programs'&&<ProgramsTab workouts={workouts}/>}
            {tab==='nutrition'&&<NutritionTab/>}
            {tab==='habits'&&<HabitsTab allMemberships={allMemberships}/>}
            {tab==='content'&&<ContentTab openModal={openModal}/>}
            {tab==='forms'&&<FormsTab allMemberships={allMemberships} avatarMap={avatarMap}/>}
          </div>

          {/* ── Right sidebar ── */}
          <div className="coach-right">
            <RightSidebar
              tab={tab} workouts={workouts} openModal={openModal}
              shoutouts={shoutouts} polls={polls} posts={posts}
              recaps={recaps} events={events} now={now}
              allMemberships={allMemberships}
            />
          </div>

        </div>
      </div>
    </>
  );
}
