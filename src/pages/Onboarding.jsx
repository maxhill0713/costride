import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ChevronLeft, ChevronRight, Building2, User,
  Search, Camera, MapPin
} from 'lucide-react';

const LOGO_URL =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

const C = {
  bg: '#f8faff', card: '#ffffff', border: '#e2e8f0', text: '#0f172a', sub: '#64748b', muted: '#94a3b8',
  blue: '#2563eb', blueMid: '#3b82f6', blueLight: '#dbeafe', blueDark: '#1d4ed8',
  green: '#16a34a', greenLight: '#dcfce7', greenBorder: '#86efac', greenDark: '#15803d',
};

const DEFAULT_SPLITS = [
  {
    id: 'bro', name: 'Bro Split', description: '5 days · one muscle group per day',
    blurb: 'Train one muscle group per day — chest Monday, back Tuesday — giving each muscle a full week to recover. Great for focused sessions but missing a day means that muscle only trains once.',
    color: 'from-purple-500 to-indigo-600', days: [1, 2, 3, 4, 5],
    workouts: {
      1: { name: 'Chest', color: 'blue', exercises: [{ exercise: 'Barbell Bench Press', sets: '4', reps: '6' }, { exercise: 'Incline Dumbbell Press', sets: '4', reps: '10' }, { exercise: 'Cable Fly', sets: '3', reps: '12' }, { exercise: 'Dips', sets: '3', reps: '10' }, { exercise: 'Push-Ups', sets: '3', reps: '15' }, { exercise: 'Pec Deck', sets: '3', reps: '12' }] },
      2: { name: 'Back', color: 'purple', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5' }, { exercise: 'Pull-Ups', sets: '4', reps: '8' }, { exercise: 'Barbell Row', sets: '4', reps: '8' }, { exercise: 'Lat Pulldown', sets: '3', reps: '12' }, { exercise: 'Cable Row', sets: '3', reps: '12' }, { exercise: 'Dumbbell Row', sets: '3', reps: '10' }] },
      3: { name: 'Shoulders', color: 'cyan', exercises: [{ exercise: 'Overhead Press', sets: '4', reps: '8' }, { exercise: 'Lateral Raise', sets: '4', reps: '15' }, { exercise: 'Front Raises', sets: '3', reps: '12' }, { exercise: 'Face Pulls', sets: '3', reps: '15' }, { exercise: 'Arnold Press', sets: '3', reps: '10' }, { exercise: 'Shrugs', sets: '3', reps: '15' }] },
      4: { name: 'Arms', color: 'pink', exercises: [{ exercise: 'Barbell Curl', sets: '4', reps: '10' }, { exercise: 'Hammer Curls', sets: '3', reps: '12' }, { exercise: 'Incline Curl', sets: '3', reps: '12' }, { exercise: 'Skull Crushers', sets: '4', reps: '10' }, { exercise: 'Tricep Pushdown', sets: '3', reps: '12' }, { exercise: 'Overhead Tricep', sets: '3', reps: '12' }] },
      5: { name: 'Legs', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6' }, { exercise: 'Romanian Deadlift', sets: '4', reps: '8' }, { exercise: 'Leg Press', sets: '3', reps: '12' }, { exercise: 'Leg Curl', sets: '3', reps: '12' }, { exercise: 'Leg Extension', sets: '3', reps: '15' }, { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
    },
  },
  {
    id: 'upper_lower', name: 'Upper / Lower', description: '4 days · upper & lower alternating',
    blurb: 'Split into upper (chest, back, shoulders, arms) and lower (legs, glutes), training each twice a week. Great for strength and size — upper days can feel long.',
    color: 'from-blue-500 to-cyan-500', days: [1, 2, 4, 5],
    workouts: {
      1: { name: 'Upper A', color: 'blue', exercises: [{ exercise: 'Barbell Bench Press', sets: '4', reps: '6' }, { exercise: 'Barbell Row', sets: '4', reps: '6' }, { exercise: 'Overhead Press', sets: '3', reps: '8' }, { exercise: 'Pull-Ups', sets: '3', reps: '8' }, { exercise: 'Lateral Raises', sets: '3', reps: '15' }, { exercise: 'Tricep Pushdown', sets: '3', reps: '12' }] },
      2: { name: 'Lower A', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6' }, { exercise: 'Romanian Deadlift', sets: '4', reps: '8' }, { exercise: 'Leg Press', sets: '3', reps: '10' }, { exercise: 'Leg Curl', sets: '3', reps: '12' }, { exercise: 'Leg Extension', sets: '3', reps: '12' }, { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
      4: { name: 'Upper B', color: 'cyan', exercises: [{ exercise: 'Incline Dumbbell Press', sets: '4', reps: '10' }, { exercise: 'Cable Row', sets: '4', reps: '10' }, { exercise: 'Dumbbell Shoulder Press', sets: '3', reps: '10' }, { exercise: 'Lat Pulldown', sets: '3', reps: '12' }, { exercise: 'Barbell Curl', sets: '3', reps: '12' }, { exercise: 'Skull Crushers', sets: '3', reps: '12' }] },
      5: { name: 'Lower B', color: 'purple', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5' }, { exercise: 'Bulgarian Split Squat', sets: '3', reps: '10' }, { exercise: 'Hack Squat', sets: '3', reps: '10' }, { exercise: 'Leg Curl', sets: '3', reps: '12' }, { exercise: 'Leg Extension', sets: '3', reps: '12' }, { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
    },
  },
  {
    id: 'ppl', name: 'Push / Pull / Legs', description: '6 days · PPL ×2',
    blurb: 'Push days: chest, shoulders & triceps. Pull days: back & biceps. Legs: everything below. Running twice a week means each muscle trains twice. Requires a 6-day commitment.',
    color: 'from-cyan-500 to-teal-500', days: [1, 2, 3, 5, 6, 7],
    workouts: {
      1: { name: 'Push A', color: 'orange', exercises: [{ exercise: 'Barbell Bench Press', sets: '4', reps: '6' }, { exercise: 'Overhead Press', sets: '4', reps: '8' }, { exercise: 'Incline Dumbbell Press', sets: '3', reps: '10' }, { exercise: 'Cable Fly', sets: '3', reps: '12' }, { exercise: 'Lateral Raises', sets: '3', reps: '15' }, { exercise: 'Tricep Pushdown', sets: '3', reps: '12' }] },
      2: { name: 'Pull A', color: 'blue', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5' }, { exercise: 'Pull-Ups', sets: '4', reps: '8' }, { exercise: 'Barbell Row', sets: '4', reps: '8' }, { exercise: 'Face Pulls', sets: '3', reps: '15' }, { exercise: 'Barbell Curl', sets: '3', reps: '12' }, { exercise: 'Hammer Curls', sets: '3', reps: '12' }] },
      3: { name: 'Legs A', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6' }, { exercise: 'Romanian Deadlift', sets: '4', reps: '8' }, { exercise: 'Leg Press', sets: '3', reps: '12' }, { exercise: 'Leg Curl', sets: '3', reps: '12' }, { exercise: 'Leg Extension', sets: '3', reps: '12' }, { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
      5: { name: 'Push B', color: 'orange', exercises: [{ exercise: 'Incline Barbell Press', sets: '4', reps: '8' }, { exercise: 'Dumbbell Shoulder Press', sets: '4', reps: '10' }, { exercise: 'Cable Fly', sets: '3', reps: '12' }, { exercise: 'Lateral Raises', sets: '4', reps: '15' }, { exercise: 'Skull Crushers', sets: '3', reps: '12' }, { exercise: 'Overhead Tricep', sets: '3', reps: '12' }] },
      6: { name: 'Pull B', color: 'blue', exercises: [{ exercise: 'Lat Pulldown', sets: '4', reps: '10' }, { exercise: 'Cable Row', sets: '4', reps: '10' }, { exercise: 'Dumbbell Row', sets: '3', reps: '10' }, { exercise: 'Rear Delt Fly', sets: '3', reps: '15' }, { exercise: 'Incline Curl', sets: '3', reps: '12' }, { exercise: 'Hammer Curls', sets: '3', reps: '12' }] },
      7: { name: 'Legs B', color: 'green', exercises: [{ exercise: 'Front Squat', sets: '4', reps: '8' }, { exercise: 'Bulgarian Split Squat', sets: '3', reps: '10' }, { exercise: 'Hack Squat', sets: '3', reps: '10' }, { exercise: 'Leg Curl', sets: '3', reps: '12' }, { exercise: 'Leg Extension', sets: '3', reps: '12' }, { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
    },
  },
  {
    id: 'full_body', name: 'Full Body', description: '3 days · total body each session',
    blurb: 'Every session trains your whole body — squats, pressing, pulling — three times a week. Best for beginners: frequent practice speeds up strength gains.',
    color: 'from-emerald-500 to-green-600', days: [1, 3, 5],
    workouts: {
      1: { name: 'Full Body A', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6' }, { exercise: 'Barbell Bench Press', sets: '4', reps: '8' }, { exercise: 'Barbell Row', sets: '4', reps: '8' }, { exercise: 'Overhead Press', sets: '3', reps: '10' }, { exercise: 'Barbell Curl', sets: '3', reps: '12' }, { exercise: 'Calf Raises', sets: '3', reps: '15' }] },
      3: { name: 'Full Body B', color: 'cyan', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5' }, { exercise: 'Incline Dumbbell Press', sets: '4', reps: '10' }, { exercise: 'Pull-Ups', sets: '4', reps: '8' }, { exercise: 'Dumbbell Shoulder Press', sets: '3', reps: '10' }, { exercise: 'Tricep Pushdown', sets: '3', reps: '12' }, { exercise: 'Leg Curl', sets: '3', reps: '12' }] },
      5: { name: 'Full Body C', color: 'blue', exercises: [{ exercise: 'Front Squat', sets: '4', reps: '8' }, { exercise: 'Dumbbell Bench Press', sets: '4', reps: '10' }, { exercise: 'Cable Row', sets: '4', reps: '10' }, { exercise: 'Lateral Raises', sets: '3', reps: '15' }, { exercise: 'Hammer Curls', sets: '3', reps: '12' }, { exercise: 'Calf Raises', sets: '3', reps: '20' }] },
    },
  },
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLOR_GRADIENT_MAP = { blue: 'from-blue-500 to-blue-600', purple: 'from-purple-500 to-purple-600', cyan: 'from-cyan-500 to-cyan-600', green: 'from-green-500 to-green-600', orange: 'from-orange-500 to-orange-600', pink: 'from-pink-500 to-pink-600' };

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }) {
  const pct = Math.min(((step - 1) / 7) * 100, 100);
  return (
    <div style={{ width: '100%', height: 16, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(to right, ${C.blueMid}, #38bdf8)`, width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
}

// ─── Primary Duolingo button ──────────────────────────────────────────────────
function PrimaryButton({ onClick, disabled, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: disabled ? '#cbd5e1' : C.blueDark, transform: 'translateY(4px)' }} />
      <button
        onMouseDown={() => !disabled && setPressed(true)}
        onMouseUp={() => { setPressed(false); if (!disabled) onClick?.(); }}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => !disabled && setPressed(true)}
        onTouchEnd={() => { setPressed(false); if (!disabled) onClick?.(); }}
        onTouchCancel={() => setPressed(false)}
        disabled={disabled}
        style={{
          position: 'relative', zIndex: 1, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 24px', borderRadius: 16, border: 'none',
          fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em',
          background: disabled ? '#e2e8f0' : `linear-gradient(to bottom, #60a5fa, ${C.blueMid} 40%, ${C.blue})`,
          color: disabled ? '#94a3b8' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transform: pressed ? 'translateY(4px)' : 'translateY(0)',
          boxShadow: pressed || disabled ? 'none' : `0 4px 0 0 ${C.blueDark}, inset 0 1px 0 rgba(255,255,255,0.25)`,
          transition: 'transform 0.07s ease, box-shadow 0.07s ease',
          WebkitTapHighlightColor: 'transparent', userSelect: 'none', outline: 'none',
        }}
      >{children}</button>
    </div>
  );
}

// ─── Small inline action button ───────────────────────────────────────────────
function ActionButton({ onClick, disabled, loading, children, color = 'blue' }) {
  const [pressed, setPressed] = useState(false);
  const isGreen = color === 'green';
  const activeBg = isGreen ? 'linear-gradient(to bottom, #22c55e, #16a34a)' : `linear-gradient(to bottom, ${C.blueMid}, ${C.blue})`;
  const activeBorder = isGreen ? '#15803d' : C.blueDark;
  return (
    <button
      onMouseDown={() => !disabled && !loading && setPressed(true)}
      onMouseUp={() => { setPressed(false); if (!disabled && !loading) onClick?.(); }}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !disabled && !loading && setPressed(true)}
      onTouchEnd={() => { setPressed(false); if (!disabled && !loading) onClick?.(); }}
      onTouchCancel={() => setPressed(false)}
      disabled={disabled || loading}
      style={{
        flexShrink: 0, padding: '9px 16px', borderRadius: 10,
        border: `1.5px solid ${disabled || loading ? C.border : activeBorder}`,
        background: disabled || loading ? '#f1f5f9' : activeBg,
        color: disabled || loading ? C.muted : '#fff',
        fontWeight: 800, fontSize: 13, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: pressed ? 0.82 : 1, transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.08s ease, transform 0.08s ease',
        WebkitTapHighlightColor: 'transparent', userSelect: 'none', outline: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        whiteSpace: 'nowrap', minWidth: 64,
      }}
    >
      {loading ? <Spinner size={13} color={C.blueMid} /> : children}
    </button>
  );
}

function PageShell({ children }) {
  return <div style={{ position: 'fixed', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</div>;
}

function SlidePane({ visible, dir, children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : dir === 'forward' ? 'translateX(24px)' : 'translateX(-24px)', transition: 'opacity 0.2s ease, transform 0.2s ease', overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: '2px 4px 2px 0', display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
      <ChevronLeft size={28} color={C.sub} strokeWidth={2.5} />
    </button>
  );
}

function Spinner({ size = 16, color = C.blueMid }) {
  useEffect(() => {
    if (document.getElementById('ob-spin-style')) return;
    const s = document.createElement('style');
    s.id = 'ob-spin-style';
    s.textContent = '@keyframes ob-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }, []);
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}30`, borderTopColor: color, animation: 'ob-spin 0.7s linear infinite', flexShrink: 0 }} />;
}

function JoinedGymCard({ gym, onSwitch, switching }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${C.greenBorder}`, boxShadow: '0 3px 0 0 #15803d, 0 6px 20px rgba(22,163,74,0.15)', background: C.card }}>
        {gym.image_url ? (
          <div style={{ width: '100%', height: 130, overflow: 'hidden', position: 'relative' }}>
            <img src={gym.image_url} alt={gym.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }} />
          </div>
        ) : (
          <div style={{ width: '100%', height: 80, background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={32} color={C.blueMid} />
          </div>
        )}
        <div style={{ padding: '12px 16px 14px' }}>
          <p style={{ color: C.text, fontWeight: 800, fontSize: 15, margin: '0 0 4px' }}>{gym.name}</p>
          {(gym.address || gym.city) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={12} color={C.muted} />
              <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>{gym.address || gym.city}</p>
            </div>
          )}
        </div>
      </div>
      <button onClick={onSwitch} disabled={switching} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', padding: '14px 0 0', WebkitTapHighlightColor: 'transparent', fontWeight: 600, width: '100%', textAlign: 'center', opacity: switching ? 0.5 : 1 }}>
        {switching ? 'Switching…' : 'Switch gym'}
      </button>
    </div>
  );
}

function SplitDetailSheet({ split, onClose }) {
  if (!split) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', borderRadius: '24px 24px 0 0', overflow: 'hidden', background: C.card, maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e2e8f0' }} />
        </div>
        <div style={{ padding: '0 20px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <p style={{ color: C.text, fontWeight: 900, fontSize: 20, margin: '0 0 2px' }}>{split.name}</p>
          <p style={{ color: C.sub, fontSize: 13, margin: '0 0 10px' }}>{split.description}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {split.days.map(d => <span key={d} className={`bg-gradient-to-r ${split.color}`} style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8, color: '#fff' }}>{DAY_NAMES[d - 1]}</span>)}
          </div>
          <p style={{ color: C.sub, fontSize: 13, lineHeight: 1.55, margin: 0 }}>{split.blurb}</p>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 32px' }}>
          {split.days.map(day => {
            const wt = split.workouts[day];
            if (!wt) return null;
            const grad = COLOR_GRADIENT_MAP[wt.color] || 'from-blue-500 to-blue-600';
            return (
              <div key={day} style={{ marginBottom: 10, borderRadius: 14, overflow: 'hidden', background: '#f8faff', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 8px' }}>
                  <div className={`bg-gradient-to-br ${grad}`} style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{DAY_NAMES[day - 1]}</span>
                  </div>
                  <p style={{ color: C.text, fontWeight: 700, fontSize: 13, margin: 0 }}>{wt.name}</p>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '6px 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(wt.exercises || []).map((ex, idx) => <p key={idx} style={{ color: C.text, fontSize: 13, margin: 0, padding: '3px 0' }}>{ex.exercise}</p>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Demo button helpers (How To Use pages) ───────────────────────────────────
function CheckInDemo() {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: '#15803d', transform: 'translateY(5px)' }} />
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onTouchCancel={() => setPressed(false)}
        style={{
          position: 'relative', zIndex: 1, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 24px', borderRadius: 18, border: 'none',
          background: 'linear-gradient(to bottom, #4ade80, #22c55e 40%, #16a34a)',
          color: '#fff', fontSize: 17, fontWeight: 900, letterSpacing: '-0.01em',
          cursor: 'pointer', userSelect: 'none', outline: 'none',
          transform: pressed ? 'translateY(5px)' : 'translateY(0)',
          boxShadow: pressed ? 'none' : '0 5px 0 0 #15803d, 0 8px 24px rgba(22,163,74,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          transition: 'transform 0.07s ease, box-shadow 0.07s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
      >Check In</button>
    </div>
  );
}

function LogWorkoutDemo() {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 9, background: '#1a3fa8', transform: 'translateY(3px)' }} />
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onTouchCancel={() => setPressed(false)}
        style={{
          position: 'relative', zIndex: 1, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px 24px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(to bottom, #3b82f6, #2563eb 40%, #1d4ed8)',
          color: '#fff', fontSize: 14, fontWeight: 800,
          cursor: 'pointer', userSelect: 'none', outline: 'none',
          transform: pressed ? 'translateY(3px)' : 'translateY(0)',
          boxShadow: pressed ? 'none' : '0 3px 0 0 #1a3fa8, 0 6px 20px rgba(0,0,100,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          transition: 'transform 0.07s ease, box-shadow 0.07s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
      >Log Workout</button>
    </div>
  );
}

// ─── Weekly dots card (used inside carousel) ─────────────────────────────────
function WeeklyDotsCard({ demoBubbleDay, setDemoBubbleDay, demoBubblePos, setDemoBubblePos }) {
  const DEMO_DAYS = [
    { day: 1, type: 'logged' }, { day: 2, type: 'missed' }, { day: 3, type: 'restDone' }, { day: 4, type: 'logged' },
    { day: 5, type: 'future' }, { day: 6, type: 'future' }, { day: 7, type: 'futureRest' },
  ];
  const getDotStyle = (d) => {
    if (d.type === 'logged')     return { bg: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)', border: 'rgba(147,197,253,0.5)', shadow: '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55)', icon: 'check' };
    if (d.type === 'missed')     return { bg: 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)', border: 'rgba(248,113,113,0.5)', shadow: '0 4px 0 0 #991b1b', icon: 'x' };
    if (d.type === 'restDone')   return { bg: 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)', border: 'rgba(74,222,128,0.5)', shadow: '0 3px 0 0 #15803d', icon: 'leaf' };
    if (d.type === 'future')     return { bg: 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)', border: 'rgba(71,85,105,0.7)', shadow: '0 4px 0 0 #111827', icon: 'empty' };
    if (d.type === 'futureRest') return { bg: 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)', border: 'rgba(71,85,105,0.7)', shadow: '0 4px 0 0 #111827', icon: 'leafOutline' };
    return { bg: '#1e293b', border: '#334155', shadow: 'none', icon: 'empty' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%' }}>
      {/* Single horizontal row — all 7 dots */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
        {DEMO_DAYS.map((d) => {
          const s = getDotStyle(d);
          const SIZE = 40;
          return (
            <button
              key={d.day}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
                const rect = e.currentTarget.getBoundingClientRect();
                if (demoBubbleDay === d.day) { setDemoBubbleDay(null); setDemoBubblePos(null); }
                else { setDemoBubbleDay(d.day); setDemoBubblePos({ cx: rect.left + rect.width / 2, bottom: rect.bottom }); }
              }}
              onPointerUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = s.shadow; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = s.shadow; }}
              style={{ width: SIZE, height: SIZE, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, border: `1px solid ${s.border}`, boxShadow: s.shadow, cursor: 'pointer', padding: 0, outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none', transition: 'transform 0.08s ease, box-shadow 0.08s ease' }}
            >
              {s.icon === 'check' && <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4.5 4.5 7.5-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              {s.icon === 'x' && <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" /></svg>}
              {s.icon === 'leaf' && (
                <svg width="15" height="15" viewBox="0 0 100 100" fill="none">
                  <line x1="50" y1="90" x2="50" y2="32" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                  <path d="M50 10 C45 20 41 28 43 35 C46 39 54 39 57 35 C59 27 55 20 50 10Z" fill="#4ade80" />
                  <path d="M50 32 C43 24 33 20 23 24 C21 29 25 37 33 39 C41 41 49 37 50 32Z" fill="#4ade80" />
                  <path d="M50 32 C57 24 67 20 77 24 C79 29 75 37 67 39 C59 41 51 37 50 32Z" fill="#4ade80" />
                </svg>
              )}
              {s.icon === 'empty' && <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(100,116,139,0.35)' }} />}
              {s.icon === 'leafOutline' && (
                <svg width="14" height="14" viewBox="0 0 100 100" fill="none">
                  <line x1="50" y1="90" x2="50" y2="32" stroke="rgba(148,163,184,0.35)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M50 10 C45 20 41 28 43 35 C46 39 54 39 57 35 C59 27 55 20 50 10Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                  <path d="M50 32 C43 24 33 20 23 24 C21 29 25 37 33 39 C41 41 49 37 50 32Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                  <path d="M50 32 C57 24 67 20 77 24 C79 29 75 37 67 39 C59 41 51 37 50 32Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.65, textAlign: 'center', margin: 0, maxWidth: 320 }}>
        This is your weekly tracker, they represent your workout plan for the week, featuring rest days, workout days and missed days. Press on the buttons to see what each colour means, the grey circles are future days and as you progress through the week they will fill in.
      </p>
    </div>
  );
}


const ACCOUNT_TYPES = [
  { id: 'personal', title: "I'm a Member", description: 'Track workouts, join challenges, connect with gyms', icon: User, gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', shadow: 'rgba(59,130,246,0.3)' },
  { id: 'gym_owner', title: 'I own a Gym', description: 'Register your gym, manage members, create rewards', icon: Building2, gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', shadow: 'rgba(168,85,247,0.3)' },
  { id: 'coach', title: "I'm a Coach", description: 'Manage classes, clients and connect with gyms', icon: User, gradient: 'linear-gradient(135deg, #16a34a, #22c55e)', shadow: 'rgba(34,197,94,0.3)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState('forward');
  const [visible, setVisible] = useState(true);
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [gymJoinMode, setGymJoinMode] = useState('code');
  const [gymCode, setGymCode] = useState('');
  const [gymCodeError, setGymCodeError] = useState('');
  const [gymSearch, setGymSearch] = useState('');
  const [gymSearchResults, setGymSearchResults] = useState([]);
  const [gymPlacesResults, setGymPlacesResults] = useState([]);
  const [isGymSearching, setIsGymSearching] = useState(false);
  const [joinedGym, setJoinedGym] = useState(null);
  const [gymType] = useState('general');
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [previewSplit, setPreviewSplit] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [trainingDays, setTrainingDays] = useState([]);
  const [demoBubbleDay, setDemoBubbleDay] = useState(null);
  const [demoBubblePos, setDemoBubblePos] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const fileInputRef = useRef(null);

  const updateMeMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
  });

  useEffect(() => {
    if (gymJoinMode !== 'search' || gymSearch.trim().length < 2) { setGymSearchResults([]); setGymPlacesResults([]); return; }
    setIsGymSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [dbRes, placesRes] = await Promise.allSettled([
          base44.entities.Gym.filter({ status: 'approved' }, 'name', 50),
          base44.functions.invoke('searchGymsPlaces', { input: gymSearch }),
        ]);
        const q = gymSearch.toLowerCase();
        const dbGyms = dbRes.status === 'fulfilled' ? dbRes.value.filter(g => g.name?.toLowerCase().includes(q) || g.city?.toLowerCase().includes(q)) : [];
        const places = placesRes.status === 'fulfilled' ? (placesRes.value?.data?.results || []) : [];
        const existingIds = dbGyms.map(g => g.google_place_id).filter(Boolean);
        setGymSearchResults(dbGyms.slice(0, 5));
        setGymPlacesResults(places.filter(p => !existingIds.includes(p.place_id)).slice(0, 3));
      } catch (e) { console.error(e); } finally { setIsGymSearching(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [gymSearch, gymJoinMode]);

  const joinGymMutation = useMutation({
    mutationFn: async (gym) => {
      const me = await base44.auth.me();
      const existing = await base44.entities.GymMembership.filter({ user_id: me.id, gym_id: gym.id, status: 'active' });
      if (existing.length === 0) {
        await base44.entities.GymMembership.create({ user_id: me.id, user_name: me.full_name, user_email: me.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'monthly' });
      }
      if (!me.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
      return gym;
    },
    onSuccess: (gym) => { setJoinedGym(gym); queryClient.invalidateQueries({ queryKey: ['gymMemberships'] }); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
  });

  const createAndJoinGymMutation = useMutation({
    mutationFn: async (place) => {
      const addressParts = place.address.split(',');
      const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : place.address;
      const gymData = { name: place.name, address: place.address, city, google_place_id: place.place_id, latitude: place.latitude, longitude: place.longitude, type: gymType, claim_status: 'unclaimed', image_url: place.photo_url || null };
      const res = await base44.functions.invoke('addGym', { gymData });
      const gym = res.data.gym;
      const me = await base44.auth.me();
      if (!me.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
      return gym;
    },
    onSuccess: (gym) => { setJoinedGym(gym); queryClient.invalidateQueries({ queryKey: ['gyms'] }); queryClient.invalidateQueries({ queryKey: ['gymMemberships'] }); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
  });

  const joinByCodeMutation = useMutation({
    mutationFn: async (code) => {
      const gyms = await base44.entities.Gym.filter({ join_code: code.toUpperCase() });
      if (!gyms || gyms.length === 0) throw new Error('Invalid code — no gym found');
      const gym = gyms[0];
      const me = await base44.auth.me();
      const existing = await base44.entities.GymMembership.filter({ user_id: me.id, gym_id: gym.id, status: 'active' });
      if (existing.length === 0) {
        await base44.entities.GymMembership.create({ user_id: me.id, user_name: me.full_name, user_email: me.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'monthly' });
      }
      if (!me.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
      return gym;
    },
    onSuccess: (gym) => { setGymCodeError(''); setJoinedGym(gym); queryClient.invalidateQueries({ queryKey: ['gymMemberships'] }); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
    onError: (err) => { setGymCodeError(err.message || 'Invalid code — please try again'); },
  });

  const leaveGymForSwitchMutation = useMutation({
    mutationFn: async (gymId) => {
      const me = await base44.auth.me();
      const memberships = await base44.entities.GymMembership.filter({ gym_id: gymId, user_id: me.id });
      if (memberships.length > 0) await base44.entities.GymMembership.delete(memberships[0].id);
      if (me.primary_gym_id === gymId) await base44.auth.updateMe({ primary_gym_id: null });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gymMemberships'] }); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
  });

  function goTo(next, dir = 'forward') { setAnimDir(dir); setVisible(false); setDemoBubbleDay(null); setDemoBubblePos(null); setCarouselIndex(0); setTimeout(() => { setStep(next); setVisible(true); }, 210); }

  useEffect(() => {
    if (step === 0) { const t = setTimeout(() => goTo(1, 'forward'), 2000); return () => clearTimeout(t); }
  }, [step]);

  function handleSwitchGym() {
    const gymId = joinedGym?.id;
    setJoinedGym(null); setGymSearch(''); setGymCode(''); setGymCodeError(''); setGymSearchResults([]); setGymPlacesResults([]);
    if (gymId) leaveGymForSwitchMutation.mutate(gymId);
  }

  function handleAccountTypeContinue() {
    if (!selectedAccountType) return;
    if (selectedAccountType === 'gym_owner') { updateMeMutation.mutate({ account_type: 'gym_owner', onboarding_completed: false }); navigate(createPageUrl('GymSignup')); return; }
    if (selectedAccountType === 'coach') { updateMeMutation.mutate({ account_type: 'coach', onboarding_completed: true }); navigate(createPageUrl('CoachDashboard')); return; }
    updateMeMutation.mutate({ account_type: 'personal', onboarding_completed: false });
    goTo(2, 'forward');
  }

  function handleToggleDay(d) { setTrainingDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b)); }

  async function handleFinish() {
    const payload = { onboarding_completed: true, training_days: trainingDays };
    if (displayName.trim()) payload.full_name = displayName.trim();
    if (selectedSplit) { payload.workout_split = selectedSplit.id; payload.custom_split_name = selectedSplit.name; payload.training_days = selectedSplit.days; payload.custom_workout_types = selectedSplit.workouts; }
    if (avatarFile) { try { const u = await base44.storage.uploadFile(avatarFile); payload.avatar_url = u.url; } catch (e) { console.error(e); } }
    await updateMeMutation.mutateAsync(payload);
    navigate(createPageUrl('Home'));
  }

  const inner = { flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 28px', overflow: 'hidden', maxWidth: 480, width: '100%', margin: '0 auto' };

  // ══════════════════════════════════════════════════════════════════════
  // STEP 0 — SPLASH
  // ══════════════════════════════════════════════════════════════════════
  if (step === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', paddingBottom: 72 }}>
        <div style={{ flex: 1 }} />
        <img src={LOGO_URL} alt="CoStride" style={{ width: 115, height: 115, borderRadius: 32, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
        <div style={{ flex: 1 }} />
        <h1 style={{ color: '#ffffff', fontWeight: 900, fontSize: 32, letterSpacing: '-0.03em', margin: 0 }}>CoStride</h1>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 1 — ACCOUNT TYPE
  // ══════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ paddingTop: 60, flexShrink: 0 }} />
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 28px', flexShrink: 0 }}>Choose your account type</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20, flexShrink: 0 }}>
              {ACCOUNT_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = selectedAccountType === type.id;
                return (
                  <button key={type.id} onClick={() => setSelectedAccountType(type.id)} style={{ position: 'relative', padding: '22px 16px 18px', borderRadius: 20, background: isSelected ? C.blueLight : C.card, border: isSelected ? `2px solid ${C.blueMid}` : `1.5px solid ${C.border}`, boxShadow: isSelected ? `0 4px 0 0 ${C.blueDark}, 0 8px 20px rgba(37,99,235,0.15)` : '0 3px 0 0 #cbd5e1, 0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s ease', WebkitTapHighlightColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: type.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${type.shadow}` }}>
                      <Icon size={24} color="#fff" strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ color: C.text, fontWeight: 800, fontSize: 13, margin: '0 0 3px' }}>{type.title}</p>
                      <p style={{ color: C.sub, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1 }} />
            <PrimaryButton onClick={handleAccountTypeContinue} disabled={!selectedAccountType}>Continue</PrimaryButton>
            <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', margin: '12px 0 0' }}>By continuing you agree to CoStride's Terms &amp; Privacy Policy</p>
          </div>
        </SlidePane>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 2 — JOIN YOUR COMMUNITY
  // ══════════════════════════════════════════════════════════════════════
  if (step === 2) {
    const isJoining = joinGymMutation.isPending || createAndJoinGymMutation.isPending || joinByCodeMutation.isPending;

    // Prevent iOS viewport resize when keyboard opens
    const handleInputFocus = () => {
      if (window.visualViewport) {
        document.body.style.height = `${window.visualViewport.height}px`;
      }
    };
    const handleInputBlur = () => {
      document.body.style.height = '';
    };
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 24, flexShrink: 0 }}>
              <BackButton onClick={() => goTo(1, 'back')} />
              <ProgressBar step={2} />
            </div>
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 16px', flexShrink: 0 }}>Let's Join Your Community</h1>
            {!joinedGym && (
              <div style={{ position: 'relative', display: 'flex', background: '#e2eaf4', borderRadius: 16, padding: 5, marginBottom: 16, flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ position: 'absolute', top: 5, bottom: 5, width: 'calc(50% - 5px)', borderRadius: 11, background: C.card, boxShadow: '0 2px 0 0 #cbd5e1, 0 1px 4px rgba(0,0,0,0.08)', transition: 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1)', transform: gymJoinMode === 'code' ? 'translateX(0)' : 'translateX(calc(100% + 10px))', pointerEvents: 'none' }} />
                {[['code', 'Enter Code'], ['search', 'Find Gym']].map(([mode, label]) => (
                  <button key={mode} onClick={() => { setGymJoinMode(mode); setGymCodeError(''); }} style={{ flex: 1, padding: '11px 0', borderRadius: 11, border: 'none', background: 'transparent', color: gymJoinMode === mode ? C.blue : C.sub, fontWeight: 800, fontSize: 14, cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'color 0.18s ease', WebkitTapHighlightColor: 'transparent', letterSpacing: '-0.01em' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {!joinedGym && (
              <div style={{ flexShrink: 0 }}>
                {gymJoinMode === 'code' ? (
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                      <input type="text" value={gymCode} onChange={e => { setGymCode(e.target.value.toUpperCase()); setGymCodeError(''); }} placeholder="e.g. GYM-ABCD" maxLength={12} onFocus={handleInputFocus} onBlur={handleInputBlur} style={{ flex: 1, fontSize: 18, padding: '13px 14px', borderRadius: 14, background: C.card, border: `1.5px solid ${gymCodeError ? '#ef4444' : gymCode.length > 0 ? C.blueMid : C.border}`, color: C.text, outline: 'none', textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'monospace', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.2s' }} />
                      <ActionButton onClick={() => joinByCodeMutation.mutate(gymCode.trim())} disabled={gymCode.trim().length < 3} loading={joinByCodeMutation.isPending} color="blue">Join</ActionButton>
                    </div>
                    {gymCodeError && <p style={{ color: '#ef4444', fontSize: 12, margin: '6px 0 0', textAlign: 'center', fontWeight: 600 }}>{gymCodeError}</p>}
                    <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', margin: '8px 0 0' }}>Ask your gym for their unique join code</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, zIndex: 1, pointerEvents: 'none' }} />
                      <input type="text" value={gymSearch} onChange={e => setGymSearch(e.target.value)} placeholder="Search gyms near you…" onFocus={handleInputFocus} onBlur={handleInputBlur} style={{ fontSize: 16, width: '100%', padding: '14px 16px 14px 40px', borderRadius: 14, background: C.card, border: `1.5px solid ${gymSearch.length > 0 ? C.blueMid : C.border}`, color: C.text, outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.2s', transform: 'translateZ(0)' }} />
                      {isGymSearching && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}><Spinner size={16} color={C.blueMid} /></div>}
                    </div>
                    {gymSearchResults.length > 0 && (
                      <div style={{ marginTop: 8, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        {gymSearchResults.map((gym, i) => (
                          <div key={gym.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: i < gymSearchResults.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                            {gym.image_url ? <img src={gym.image_url} alt={gym.name} style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: 9, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={16} color={C.blue} /></div>}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: C.text, fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gym.name}</p>
                              <p style={{ color: C.sub, fontSize: 11, margin: '1px 0 0' }}>{gym.city}</p>
                            </div>
                            <ActionButton onClick={() => joinGymMutation.mutate(gym)} disabled={isJoining} loading={joinGymMutation.isPending} color="blue">Join</ActionButton>
                          </div>
                        ))}
                      </div>
                    )}
                    {gymPlacesResults.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Add from Google Maps</p>
                        <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.card, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          {gymPlacesResults.map((place, i) => (
                            <div key={place.place_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: i < gymPlacesResults.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                              {place.photo_url ? <img src={place.photo_url} alt={place.name} style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: 9, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={16} color={C.green} /></div>}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: C.text, fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</p>
                                <p style={{ color: C.sub, fontSize: 11, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</p>
                              </div>
                              <ActionButton onClick={() => createAndJoinGymMutation.mutate(place)} disabled={isJoining} loading={createAndJoinGymMutation.isPending} color="green">+ Add</ActionButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isGymSearching && gymSearch.length >= 2 && gymSearchResults.length === 0 && gymPlacesResults.length === 0 && (
                      <div style={{ marginTop: 8, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card, padding: 16, textAlign: 'center' }}>
                        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No gyms found — try a different search</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {joinedGym && <JoinedGymCard gym={joinedGym} onSwitch={handleSwitchGym} switching={leaveGymForSwitchMutation.isPending} />}
            <div style={{ flex: 1 }} />
            <div style={{ flexShrink: 0 }}>
              <PrimaryButton onClick={() => goTo(3, 'forward')} disabled={!joinedGym}>Continue</PrimaryButton>
              <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', margin: '10px 0 0' }}>You can add more gyms later from the Gyms page</p>
            </div>
          </div>
        </SlidePane>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 3 — PICK YOUR WORKOUT
  // ══════════════════════════════════════════════════════════════════════
  if (step === 3) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 12, flexShrink: 0 }}>
              <BackButton onClick={() => goTo(2, 'back')} />
              <ProgressBar step={3} />
            </div>
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 3px', flexShrink: 0 }}>Pick Your Workout</h1>
            <p style={{ color: C.sub, fontSize: 13, margin: '0 0 10px', flexShrink: 0 }}>Choose a training split. Tap the arrow to preview.</p>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEFAULT_SPLITS.map(split => {
                const isSelected = selectedSplit?.id === split.id;
                return (
                  <div key={split.id}
                    style={{ position: 'relative', borderRadius: 18, cursor: 'pointer', flexShrink: 0, background: C.card, border: isSelected ? `2px solid ${C.greenDark}` : `1.5px solid ${C.border}`, boxShadow: isSelected ? `0 4px 0 0 ${C.greenDark}, 0 6px 16px rgba(22,163,74,0.15)` : '0 4px 0 0 #cbd5e1, 0 2px 8px rgba(0,0,0,0.06)', transition: 'border 0.15s ease, box-shadow 0.15s ease', WebkitTapHighlightColor: 'transparent' }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isSelected ? `0 4px 0 0 ${C.greenDark}, 0 6px 16px rgba(22,163,74,0.15)` : '0 4px 0 0 #cbd5e1, 0 2px 8px rgba(0,0,0,0.06)'; }}
                    onTouchStart={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                    onTouchEnd={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isSelected ? `0 4px 0 0 ${C.greenDark}, 0 6px 16px rgba(22,163,74,0.15)` : '0 4px 0 0 #cbd5e1, 0 2px 8px rgba(0,0,0,0.06)'; }}
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (e.clientX - rect.left >= rect.width * (2 / 3)) { setPreviewSplit(split); }
                      else { setSelectedSplit(isSelected ? null : { id: split.id, name: split.name, days: split.days, workouts: split.workouts }); }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: C.text, fontWeight: 900, fontSize: 15, margin: '0 0 1px', letterSpacing: '-0.01em' }}>{split.name}</p>
                        <p style={{ color: C.sub, fontSize: 11, margin: '0 0 5px' }}>{split.description}</p>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {split.days.map(d => <span key={d} className={`bg-gradient-to-r ${split.color}`} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 7, color: '#fff' }}>{DAY_NAMES[d - 1]}</span>)}
                        </div>
                      </div>
                      <div style={{ paddingLeft: 12, flexShrink: 0 }}>
                        <ChevronRight size={20} color={isSelected ? C.green : C.muted} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, flexShrink: 0 }}>
              <PrimaryButton onClick={() => goTo(4, 'forward')} disabled={!selectedSplit}>Continue</PrimaryButton>
              <button onClick={() => goTo(4, 'forward')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', padding: '6px 0', WebkitTapHighlightColor: 'transparent', fontWeight: 600 }}>
                Skip — I'll create a custom workout later
              </button>
            </div>
          </div>
        </SlidePane>
        {previewSplit && <SplitDetailSheet split={previewSplit} onClose={() => setPreviewSplit(null)} />}
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 4 — ENTER YOUR NAME
  // ══════════════════════════════════════════════════════════════════════
  if (step === 4) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 28, flexShrink: 0 }}>
              <BackButton onClick={() => goTo(3, 'back')} />
              <ProgressBar step={4} />
            </div>
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 28px', flexShrink: 0 }}>What's your name?</h1>
            <div style={{ flexShrink: 0 }}>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value.slice(0, 30))} placeholder="Name" maxLength={30} onFocus={e => { e.target.scrollIntoView = () => {}; }} style={{ fontSize: 18, width: '100%', padding: '15px 16px', borderRadius: 14, background: C.card, border: `1.5px solid ${displayName.length > 0 ? C.blueMid : C.border}`, color: C.text, outline: 'none', boxSizing: 'border-box', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.2s' }} />
            </div>
            <div style={{ flex: 1 }} />
            <PrimaryButton onClick={() => goTo(5, 'forward')} disabled={displayName.trim().length < 2}>Continue</PrimaryButton>
          </div>
        </SlidePane>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 5 — PROFILE PICTURE
  // ══════════════════════════════════════════════════════════════════════
  if (step === 5) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 24, flexShrink: 0 }}>
              <BackButton onClick={() => goTo(4, 'back')} />
              <ProgressBar step={5} />
            </div>
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 4px', flexShrink: 0 }}>Add a Profile Picture</h1>
            <p style={{ color: C.sub, fontSize: 14, margin: 0, flexShrink: 0 }}>Let your friends identify you.</p>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ width: 180, height: 180, borderRadius: '50%', overflow: 'hidden', border: avatarPreview ? `3px solid ${C.blueMid}` : `2px dashed ${C.muted}`, background: avatarPreview ? 'transparent' : '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent', boxShadow: avatarPreview ? '0 4px 20px rgba(59,130,246,0.15)' : 'none', transition: 'all 0.2s ease' }}>
                {avatarPreview ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><Camera size={40} color={C.muted} /><span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>Tap to upload</span></div>}
              </button>
              <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', maxWidth: 240, lineHeight: 1.55, margin: 0 }}>A photo helps gym members and friends recognise you in the community.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <PrimaryButton onClick={() => goTo(6, 'forward')} disabled={!avatarPreview}>Continue</PrimaryButton>
              <button onClick={() => goTo(6, 'forward')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', padding: '8px 0', WebkitTapHighlightColor: 'transparent', fontWeight: 600 }}>Skip for now</button>
            </div>
          </div>
        </SlidePane>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 6 — TRAINING DAYS
  // ══════════════════════════════════════════════════════════════════════
  if (step === 6) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 24, flexShrink: 0 }}>
              <BackButton onClick={() => goTo(5, 'back')} />
              <ProgressBar step={6} />
            </div>
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 4px', flexShrink: 0 }}>How often do you train?</h1>
            <p style={{ color: C.sub, fontSize: 14, margin: '0 0 20px', flexShrink: 0 }}>Pick the days you plan to go to the gym each week.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 7, flexShrink: 0 }}>
              {DAY_NAMES.map((name, i) => {
                const d = i + 1; const on = trainingDays.includes(d);
                return (
                  <button key={d} onClick={() => handleToggleDay(d)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 13, paddingBottom: 13, borderRadius: 14, border: on ? `2px solid ${C.blueMid}` : `2px solid ${C.border}`, background: on ? `linear-gradient(to bottom, ${C.blueMid}, ${C.blue})` : C.card, color: on ? '#fff' : C.sub, fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: on ? `0 3px 0 0 ${C.blueDark}, 0 4px 10px rgba(59,130,246,0.15)` : '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent' }}>
                    {name}
                    {on && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.7)' }} />}
                  </button>
                );
              })}
            </div>
            <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', margin: '10px 0 0', flexShrink: 0 }}>
              {trainingDays.length > 0 ? `${trainingDays.length} training day${trainingDays.length !== 1 ? 's' : ''} · ${7 - trainingDays.length} rest` : 'Select at least one day'}
            </p>
            <div style={{ flex: 1 }} />
            <PrimaryButton onClick={() => goTo(7, 'forward')} disabled={trainingDays.length === 0}>Continue</PrimaryButton>
          </div>
        </SlidePane>
      </PageShell>
    );
  }


  // ══════════════════════════════════════════════════════════════════════
  // STEP 7 — HOW TO USE THE APP (carousel)
  // ══════════════════════════════════════════════════════════════════════
  if (step === 7) {
    const CARDS = [
      {
        key: 'checkin',
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%' }}>
            <CheckInDemo />
            <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.65, textAlign: 'center', margin: 0, maxWidth: 300 }}>
              This is your check in button. You have to be near your gym to use this and you should check in just before you start your workout.
            </p>
          </div>
        ),
      },
      {
        key: 'logworkout',
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%', paddingTop: 48 }}>
            <LogWorkoutDemo />
            <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.65, textAlign: 'center', margin: 0, maxWidth: 300 }}>
              Press this after you have finished your workout. It will log your exercises and any changes you have made to your routine, increase your streak, and if you want it will share your workout with your friends and community.
            </p>
          </div>
        ),
      },
      {
        key: 'dots',
        render: () => <WeeklyDotsCard demoBubbleDay={demoBubbleDay} setDemoBubbleDay={setDemoBubbleDay} demoBubblePos={demoBubblePos} setDemoBubblePos={setDemoBubblePos} />,
      },
    ];

    const total = CARDS.length;
    // ── CHANGED: button is only enabled once user reaches the last card ──
    const isOnLastCard = carouselIndex >= total - 1;

    const handleCarouselScroll = () => {
      if (!carouselRef.current) return;
      const idx = Math.round(carouselRef.current.scrollLeft / carouselRef.current.offsetWidth);
      if (idx !== carouselIndex) {
        setCarouselIndex(idx);
        setDemoBubbleDay(null);
        setDemoBubblePos(null);
      }
    };

    const scrollToCard = (idx) => {
      if (!carouselRef.current) return;
      carouselRef.current.scrollTo({ left: idx * carouselRef.current.offsetWidth, behavior: 'smooth' });
    };

    // Dot bubble overlay (rendered over the carousel)
    const renderDotBubble = () => {
      if (demoBubbleDay === null || !demoBubblePos) return null;
      const DEMO_DAYS = [
        { day: 1, type: 'logged' }, { day: 2, type: 'missed' }, { day: 3, type: 'restDone' },
        { day: 4, type: 'logged' }, { day: 5, type: 'future' }, { day: 6, type: 'future' }, { day: 7, type: 'futureRest' },
      ];
      const d = DEMO_DAYS[demoBubbleDay - 1];
      if (!d) return null;
      const getDemoLabel = (d) => ({ logged: d.day === 1 ? 'Chest' : 'Upper A', missed: 'No Workout', restDone: 'Rest Day', future: d.day === 5 ? 'Push A' : 'Pull A', futureRest: 'Rest Day' }[d.type] || '');
      const getDemoDate = (d) => ['Monday 17 Mar','Tuesday 18 Mar','Wednesday 19 Mar','Thursday 20 Mar','Friday 21 Mar','Saturday 22 Mar','Sunday 23 Mar'][d.day - 1];
      const getBubbleColor = (d) => ({ logged: '#3b82f6', missed: '#dc2626', restDone: '#16a34a', future: '#263244', futureRest: '#1e2535' }[d.type] || '#263244');
      const hasViewSummary = d.type === 'logged';
      const hasViewWorkout = d.type === 'future';
      const BUBBLE_W = 260, ARROW_H = 7, ARROW_W = 13, RADIUS = 13;
      const BUBBLE_H = (hasViewSummary || hasViewWorkout) ? 116 : 74;
      const SVG_H = BUBBLE_H + ARROW_H;
      const screenW = window.innerWidth;
      const rawLeft = demoBubblePos.cx - BUBBLE_W / 2;
      const clampedLeft = Math.max(8, Math.min(rawLeft, screenW - BUBBLE_W - 8));
      const arrowTip = Math.max(RADIUS + ARROW_W / 2 + 2, Math.min(demoBubblePos.cx - clampedLeft, BUBBLE_W - RADIUS - ARROW_W / 2 - 2));
      const arrowL = arrowTip - ARROW_W / 2, arrowR = arrowTip + ARROW_W / 2;
      const color = getBubbleColor(d);
      const path = [`M ${RADIUS} ${ARROW_H}`,`L ${arrowL} ${ARROW_H}`,`L ${arrowTip} 0`,`L ${arrowR} ${ARROW_H}`,`L ${BUBBLE_W-RADIUS} ${ARROW_H}`,`Q ${BUBBLE_W} ${ARROW_H} ${BUBBLE_W} ${ARROW_H+RADIUS}`,`L ${BUBBLE_W} ${SVG_H-RADIUS}`,`Q ${BUBBLE_W} ${SVG_H} ${BUBBLE_W-RADIUS} ${SVG_H}`,`L ${RADIUS} ${SVG_H}`,`Q 0 ${SVG_H} 0 ${SVG_H-RADIUS}`,`L 0 ${ARROW_H+RADIUS}`,`Q 0 ${ARROW_H} ${RADIUS} ${ARROW_H}`,`Z`].join(' ');
      return (
        <>
          <div onPointerDown={() => { setDemoBubbleDay(null); setDemoBubblePos(null); }} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{ position: 'fixed', top: demoBubblePos.bottom + 4, left: clampedLeft, width: BUBBLE_W, height: SVG_H, zIndex: 9999 }} onClick={e => e.stopPropagation()}>
            <svg width={BUBBLE_W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}><path d={path} fill={color} /></svg>
            <div style={{ position: 'absolute', top: ARROW_H + 8, left: 12, right: 12, bottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2, textAlign: 'center', display: 'block' }}>{getDemoLabel(d)}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>{getDemoDate(d)}</span>
              {hasViewSummary && <div style={{ marginTop: 8, width: '100%', padding: '7px 0', borderRadius: 8, background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)', borderBottom: '3px solid #1e40af', color: '#fff', fontSize: 11, fontWeight: 800, textAlign: 'center', cursor: 'default', opacity: 0.55 }}>View Summary</div>}
              {hasViewWorkout && <div style={{ marginTop: 8, width: '100%', padding: '7px 0', borderRadius: 8, background: 'linear-gradient(to bottom, #1e2430 0%, #141820 60%, #0d1017 100%)', border: '1px solid rgba(255,255,255,0.10)', borderBottom: '3px solid rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800, textAlign: 'center', cursor: 'default', opacity: 0.55 }}>View Workout</div>}
            </div>
          </div>
        </>
      );
    };

    return (
      <>
        <PageShell>
          <SlidePane visible={visible} dir={animDir}>
            <div style={inner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 16, flexShrink: 0 }}>
                <BackButton onClick={() => goTo(6, 'back')} />
                <ProgressBar step={7} />
              </div>
              <h1 style={{ color: C.text, fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 20px', flexShrink: 0 }}>How to use the app</h1>

              {/* Carousel position dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 24, flexShrink: 0 }}>
                {CARDS.map((_, i) => (
                  <button key={i} onClick={() => scrollToCard(i)} style={{ width: i === carouselIndex ? 22 : 8, height: 8, borderRadius: 99, border: 'none', padding: 0, background: i === carouselIndex ? C.blue : '#cbd5e1', transition: 'width 0.25s ease, background 0.25s ease', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }} />
                ))}
              </div>

              {/* Carousel */}
              <style>{`.ob-carousel::-webkit-scrollbar{display:none}`}</style>
              <div
                ref={carouselRef}
                className="ob-carousel"
                onScroll={handleCarouselScroll}
                style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', border: 'none', outline: 'none' }}
              >
                {CARDS.map((card) => (
                  <div key={card.key} style={{ minWidth: '100%', width: '100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', border: 'none', flexShrink: 0 }}>
                    {card.render()}
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: 18, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <PrimaryButton onClick={() => goTo(8, 'forward')} disabled={!isOnLastCard}>Continue</PrimaryButton>
                <button onClick={() => goTo(8, 'forward')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', padding: '6px 0', WebkitTapHighlightColor: 'transparent', fontWeight: 600, textAlign: 'center' }}>
                  Skip — I don't need the tutorial
                </button>
              </div>
            </div>
          </SlidePane>
        </PageShell>
        {renderDotBubble()}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 8 — WELCOME
  // ══════════════════════════════════════════════════════════════════════
  if (step === 8) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            {/* ── CHANGED: fully-complete progress bar at top ── */}
            <div style={{ paddingTop: 52, flexShrink: 0 }}>
              <div style={{ marginBottom: 28 }}>
                <ProgressBar step={9} />
              </div>
              <h1 style={{ color: C.text, fontWeight: 900, fontSize: 34, letterSpacing: '-0.03em', margin: '0 0 6px', lineHeight: 1.1 }}>
                Welcome to{' '}
                <span style={{ background: `linear-gradient(to right, ${C.blueMid}, #06b6d4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CoStride</span>
              </h1>
            </div>
            {/* ── CHANGED: more exciting, natural paragraph ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ color: C.sub, fontSize: 17, margin: 0, lineHeight: 1.65, fontWeight: 500 }}>
                {displayName
                  ? <>You're all set, {displayName.trim().split(' ')[0]}! Time to check in, crush your workouts, and climb the leaderboard with your gym. Your streak starts today — don't break it.</>
                  : <>You're all set! Time to check in, crush your workouts, and climb the leaderboard with your gym. Your streak starts today — don't break it.</>
                }
              </p>
            </div>
            <PrimaryButton onClick={handleFinish} disabled={updateMeMutation.isPending}>
              {updateMeMutation.isPending ? 'Setting up…' : 'Get Started'}
            </PrimaryButton>
          </div>
        </SlidePane>
      </PageShell>
    );
  }

  return null;
}