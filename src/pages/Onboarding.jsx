import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ChevronLeft, ChevronRight, Building2, User,
  Search, Camera, Loader2, CheckCircle2, MapPin
} from 'lucide-react';

const LOGO_URL =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — clean light theme
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: '#f8faff',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  sub: '#64748b',
  muted: '#94a3b8',
  blue: '#2563eb',
  blueMid: '#3b82f6',
  blueLight: '#dbeafe',
  blueDark: '#1d4ed8',
  green: '#16a34a',
  greenLight: '#dcfce7',
  greenBorder: '#86efac',
  greenDark: '#15803d',
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SPLITS
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  const pct = Math.min(((step - 1) / 5) * 100, 100);
  return (
    <div style={{ width: '100%', height: 16, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(to right, ${C.blueMid}, #38bdf8)`, width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
}

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

// Small 3D Duolingo-style action button (for Join / + Add)
function ActionButton({ onClick, disabled, children, color = 'blue' }) {
  const [pressed, setPressed] = useState(false);
  const isGreen = color === 'green';
  const bg = isGreen
    ? 'linear-gradient(to bottom, #4ade80, #22c55e 40%, #16a34a)'
    : `linear-gradient(to bottom, #60a5fa, ${C.blueMid} 40%, ${C.blue})`;
  const shadow = isGreen ? '#15803d' : C.blueDark;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: disabled ? '#cbd5e1' : shadow, transform: 'translateY(3px)' }} />
      <button
        onMouseDown={() => !disabled && setPressed(true)}
        onMouseUp={() => { setPressed(false); if (!disabled) onClick?.(); }}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => !disabled && setPressed(true)}
        onTouchEnd={() => { setPressed(false); if (!disabled) onClick?.(); }}
        onTouchCancel={() => setPressed(false)}
        disabled={disabled}
        style={{
          position: 'relative', zIndex: 1,
          padding: '7px 14px', borderRadius: 10, border: 'none',
          fontWeight: 800, fontSize: 12,
          background: disabled ? '#e2e8f0' : bg,
          color: disabled ? '#94a3b8' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transform: pressed ? 'translateY(3px)' : 'translateY(0)',
          boxShadow: pressed || disabled ? 'none' : `0 3px 0 0 ${shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
          transition: 'transform 0.07s ease, box-shadow 0.07s ease',
          WebkitTapHighlightColor: 'transparent', userSelect: 'none', outline: 'none', whiteSpace: 'nowrap',
        }}
      >{children}</button>
    </div>
  );
}

// White fixed-screen shell
function PageShell({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </div>
  );
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
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: '2px 4px 2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
      <ChevronLeft size={28} color={C.sub} strokeWidth={2.5} />
    </button>
  );
}

// Spinner that actually animates (CSS keyframe injected once)
function Spinner({ size = 16, color = C.blueMid }) {
  useEffect(() => {
    if (document.getElementById('ob-spin-style')) return;
    const s = document.createElement('style');
    s.id = 'ob-spin-style';
    s.textContent = '@keyframes ob-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }, []);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}30`,
      borderTopColor: color,
      animation: 'ob-spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLIT DETAIL BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────────
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
            {split.days.map(d => (
              <span key={d} className={`bg-gradient-to-r ${split.color}`} style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8, color: '#fff' }}>{DAY_NAMES[d - 1]}</span>
            ))}
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
                  {(wt.exercises || []).map((ex, idx) => (
                    <p key={idx} style={{ color: C.text, fontSize: 13, margin: 0, padding: '3px 0' }}>{ex.exercise}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ACCOUNT_TYPES = [
  { id: 'personal', title: "I'm a Member", description: 'Track workouts, join challenges, connect with gyms', icon: User, gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', shadow: 'rgba(59,130,246,0.3)' },
  { id: 'gym_owner', title: 'I own a Gym', description: 'Register your gym, manage members, create rewards', icon: Building2, gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', shadow: 'rgba(168,85,247,0.3)' },
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
      await base44.entities.GymMembership.create({ user_id: me.id, user_name: me.full_name, user_email: me.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'monthly' });
      if (!me.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
      return gym;
    },
    onSuccess: (gym) => { setJoinedGym(gym); queryClient.invalidateQueries({ queryKey: ['gymMemberships'] }); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
  });

  const createAndJoinGymMutation = useMutation({
    mutationFn: async (place) => {
      const addressParts = place.address.split(',');
      const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : place.address;
      const gym = await base44.entities.Gym.create({ name: place.name, address: place.address, city, google_place_id: place.place_id, latitude: place.latitude, longitude: place.longitude, type: gymType, status: 'approved', claim_status: 'unclaimed', members_count: 0, image_url: place.photo_url || null });
      const me = await base44.auth.me();
      await base44.entities.GymMembership.create({ user_id: me.id, user_name: me.full_name, user_email: me.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'monthly' });
      if (!me.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
      return gym;
    },
    onSuccess: (gym) => { setJoinedGym(gym); queryClient.invalidateQueries({ queryKey: ['gyms'] }); queryClient.invalidateQueries({ queryKey: ['gymMemberships'] }); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
  });

  useEffect(() => {
    if (step === 0) { const t = setTimeout(() => goTo(1, 'forward'), 2000); return () => clearTimeout(t); }
  }, [step]);

  function goTo(next, dir = 'forward') { setAnimDir(dir); setVisible(false); setTimeout(() => { setStep(next); setVisible(true); }, 210); }

  function handleAccountTypeContinue() {
    if (!selectedAccountType) return;
    if (selectedAccountType === 'gym_owner') { updateMeMutation.mutate({ account_type: 'gym_owner', onboarding_completed: false }); navigate(createPageUrl('GymSignup')); return; }
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
        {/* Logo centred, no glow */}
        <img src={LOGO_URL} alt="CoStride" style={{ width: 96, height: 96, borderRadius: 28, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
        <div style={{ flex: 1 }} />
        {/* CoStride at bottom — "Co" in blue gradient matching home badge, "Stride" in white */}
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 32, letterSpacing: '-0.03em', margin: 0 }}>
          <span style={{ background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Co</span>
          <span style={{ color: '#ffffff' }}>Stride</span>
        </h1>
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
            {/* No logo — title shifted up */}
            <div style={{ paddingTop: 60, flexShrink: 0 }} />
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 28px', flexShrink: 0 }}>Choose your account type</h1>

            {/* Account type cards — professional, app-consistent style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20, flexShrink: 0 }}>
              {ACCOUNT_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = selectedAccountType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedAccountType(type.id)}
                    style={{
                      position: 'relative', padding: '22px 16px 18px', borderRadius: 20,
                      background: isSelected ? C.blueLight : C.card,
                      border: isSelected ? `2px solid ${C.blueMid}` : `1.5px solid ${C.border}`,
                      boxShadow: isSelected
                        ? `0 4px 0 0 ${C.blueDark}, 0 8px 20px rgba(37,99,235,0.15)`
                        : '0 3px 0 0 #cbd5e1, 0 2px 8px rgba(0,0,0,0.06)',
                      cursor: 'pointer', textAlign: 'center',
                      transform: isSelected ? 'translateY(0)' : 'translateY(0)',
                      transition: 'all 0.18s ease',
                      WebkitTapHighlightColor: 'transparent',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    }}
                  >
                    {/* Icon circle */}
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
    const canContinue = gymJoinMode === 'code' ? gymCode.trim().length >= 3 : !!joinedGym;
    const isSearching = joinGymMutation.isPending || createAndJoinGymMutation.isPending;

    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 24, flexShrink: 0 }}>
              <BackButton onClick={() => goTo(1, 'back')} />
              <ProgressBar step={2} />
            </div>
            <h1 style={{ color: C.text, fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 16px', flexShrink: 0 }}>Let's Join Your Community</h1>

            {/* Mode switcher */}
            <div style={{ display: 'flex', background: '#e8eef6', borderRadius: 14, padding: 4, border: `1px solid ${C.border}`, marginBottom: 16, flexShrink: 0 }}>
              {[['code', 'Enter Code'], ['search', 'Find Gym']].map(([mode, label]) => (
                <button key={mode} onClick={() => { setGymJoinMode(mode); setJoinedGym(null); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: gymJoinMode === mode ? C.card : 'transparent', color: gymJoinMode === mode ? C.blue : C.sub, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: gymJoinMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.18s ease', WebkitTapHighlightColor: 'transparent' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Input area — only show when not yet joined */}
            {!joinedGym && (
              <div style={{ flexShrink: 0 }}>
                {gymJoinMode === 'code' ? (
                  <div>
                    <input
                      type="text"
                      value={gymCode}
                      onChange={e => setGymCode(e.target.value.toUpperCase())}
                      placeholder="e.g. GYM-ABCD"
                      maxLength={12}
                      // prevent scroll-into-view on iOS
                      onFocus={e => { e.target.scrollIntoView = () => {}; }}
                      style={{ fontSize: 20, width: '100%', padding: '14px 16px', borderRadius: 14, background: C.card, border: `1.5px solid ${gymCode.length > 0 ? C.blueMid : C.border}`, color: C.text, outline: 'none', textAlign: 'center', fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.2s' }} />
                    <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', margin: '8px 0 0' }}>Ask your gym for their unique join code</p>
                  </div>
                ) : (
                  <div>
                    {/* Search bar — no label above */}
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, zIndex: 1, pointerEvents: 'none' }} />
                      <input
                        type="text"
                        value={gymSearch}
                        onChange={e => { setGymSearch(e.target.value); }}
                        placeholder="Search gyms near you…"
                        // prevent iOS scroll-jump on focus
                        onFocus={e => { e.target.scrollIntoView = () => {}; }}
                        style={{ fontSize: 16, width: '100%', padding: '14px 16px 14px 40px', borderRadius: 14, background: C.card, border: `1.5px solid ${gymSearch.length > 0 ? C.blueMid : C.border}`, color: C.text, outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.2s' }}
                      />
                      {isGymSearching && (
                        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                          <Spinner size={16} color={C.blueMid} />
                        </div>
                      )}
                    </div>

                    {/* DB results */}
                    {gymSearchResults.length > 0 && (
                      <div style={{ marginTop: 8, borderRadius: 14, border: `1px solid ${C.border}`, background: C.card, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        {gymSearchResults.map((gym, i) => (
                          <div key={gym.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: i < gymSearchResults.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                            {gym.image_url
                              ? <img src={gym.image_url} alt={gym.name} style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: 38, height: 38, borderRadius: 9, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={16} color={C.blue} /></div>}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: C.text, fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gym.name}</p>
                              <p style={{ color: C.sub, fontSize: 11, margin: '1px 0 0' }}>{gym.city}</p>
                            </div>
                            <ActionButton onClick={() => joinGymMutation.mutate(gym)} disabled={isSearching} color="blue">
                              {joinGymMutation.isPending ? <Spinner size={12} color="#fff" /> : 'Join'}
                            </ActionButton>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Google Places results */}
                    {gymPlacesResults.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Add from Google Maps</p>
                        <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.card, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          {gymPlacesResults.map((place, i) => (
                            <div key={place.place_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: i < gymPlacesResults.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                              {place.photo_url
                                ? <img src={place.photo_url} alt={place.name} style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                                : <div style={{ width: 38, height: 38, borderRadius: 9, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={16} color={C.green} /></div>}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: C.text, fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</p>
                                <p style={{ color: C.sub, fontSize: 11, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</p>
                              </div>
                              <ActionButton onClick={() => createAndJoinGymMutation.mutate(place)} disabled={isSearching} color="green">
                                {createAndJoinGymMutation.isPending ? <Spinner size={12} color="#fff" /> : '+ Add'}
                              </ActionButton>
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

            {/* Joined gym card — shown once gym is joined, replaces all search UI */}
            {joinedGym && (
              <div style={{ flexShrink: 0, borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${C.greenBorder}`, boxShadow: '0 3px 0 0 #15803d, 0 6px 20px rgba(22,163,74,0.15)', background: C.card }}>
                {/* Gym image */}
                {joinedGym.image_url && (
                  <div style={{ width: '100%', height: 130, overflow: 'hidden', position: 'relative' }}>
                    <img src={joinedGym.image_url} alt={joinedGym.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                    {/* Green joined badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, background: C.green, borderRadius: 20, padding: '4px 10px' }}>
                      <CheckCircle2 size={12} color="#fff" />
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>Joined!</span>
                    </div>
                  </div>
                )}
                {!joinedGym.image_url && (
                  <div style={{ width: '100%', height: 80, background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Building2 size={32} color={C.blueMid} />
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, background: C.green, borderRadius: 20, padding: '4px 10px' }}>
                      <CheckCircle2 size={12} color="#fff" />
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>Joined!</span>
                    </div>
                  </div>
                )}
                <div style={{ padding: '12px 16px 14px' }}>
                  <p style={{ color: C.text, fontWeight: 800, fontSize: 15, margin: '0 0 4px' }}>{joinedGym.name}</p>
                  {(joinedGym.address || joinedGym.city) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={12} color={C.muted} />
                      <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>{joinedGym.address || joinedGym.city}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ flex: 1 }} />

            <div style={{ flexShrink: 0 }}>
              <PrimaryButton onClick={() => goTo(3, 'forward')} disabled={!canContinue}>Continue</PrimaryButton>
              <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', margin: '10px 0 0' }}>
                You can add more gyms later from the Gyms page
              </p>
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
            <p style={{ color: C.sub, fontSize: 13, margin: '0 0 10px', flexShrink: 0 }}>Choose a training split, press to preview.</p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {DEFAULT_SPLITS.map(split => {
                const isSelected = selectedSplit?.id === split.id;
                return (
                  <div key={split.id}
                    style={{ position: 'relative', borderRadius: 16, cursor: 'pointer', background: isSelected ? C.greenLight : C.card, border: isSelected ? `2px solid ${C.greenBorder}` : `1.5px solid ${C.border}`, boxShadow: isSelected ? '0 2px 12px rgba(22,163,74,0.1)' : '0 1px 4px rgba(0,0,0,0.05)', flexShrink: 0, transition: 'all 0.18s ease' }}
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relX = e.clientX - rect.left;
                      if (relX >= rect.width * (2 / 3)) {
                        setPreviewSplit(split);
                      } else {
                        setSelectedSplit(isSelected ? null : { id: split.id, name: split.name, days: split.days, workouts: split.workouts });
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: C.text, fontWeight: 800, fontSize: 15, margin: 0 }}>{split.name}</p>
                        <p style={{ color: C.sub, fontSize: 11, margin: '2px 0 5px' }}>{split.description}</p>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {split.days.map(d => (
                            <span key={d} className={`bg-gradient-to-r ${split.color}`} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: '#fff' }}>{DAY_NAMES[d - 1]}</span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={18} color={C.muted} style={{ flexShrink: 0, marginLeft: 8 }} />
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
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value.slice(0, 30))}
                placeholder="Name"
                maxLength={30}
                // stop page jumping on focus
                onFocus={e => { e.target.scrollIntoView = () => {}; }}
                style={{ fontSize: 18, width: '100%', padding: '15px 16px', borderRadius: 14, background: C.card, border: `1.5px solid ${displayName.length > 0 ? C.blueMid : C.border}`, color: C.text, outline: 'none', boxSizing: 'border-box', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.2s' }}
              />
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
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
              <button onClick={() => fileInputRef.current?.click()}
                style={{ position: 'relative', width: 180, height: 180, borderRadius: '50%', overflow: 'hidden', border: avatarPreview ? `3px solid ${C.blueMid}` : `2px dashed ${C.muted}`, background: avatarPreview ? 'transparent' : '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent', boxShadow: avatarPreview ? '0 4px 20px rgba(59,130,246,0.15)' : 'none', transition: 'all 0.2s ease' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Camera size={40} color={C.muted} />
                      <span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>Tap to upload</span>
                    </div>
                }
              </button>
              <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', maxWidth: 240, lineHeight: 1.55, margin: 0 }}>
                A photo helps gym members and friends recognise you in the community.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <PrimaryButton onClick={() => goTo(6, 'forward')} disabled={!avatarPreview}>Continue</PrimaryButton>
              <button onClick={() => goTo(6, 'forward')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', padding: '8px 0', WebkitTapHighlightColor: 'transparent', fontWeight: 600 }}>
                Skip for now
              </button>
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
  // STEP 7 — WELCOME
  // ══════════════════════════════════════════════════════════════════════
  if (step === 7) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            <div style={{ paddingTop: 52, marginBottom: 24, flexShrink: 0 }}>
              <ProgressBar step={7} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
              <img src={LOGO_URL} alt="CoStride" style={{ width: 88, height: 88, borderRadius: 24, objectFit: 'cover', boxShadow: '0 8px 32px rgba(37,99,235,0.18)', border: `3px solid ${C.blueLight}` }} />
              <div>
                <h1 style={{ color: C.text, fontWeight: 900, fontSize: 34, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.1 }}>
                  Welcome to{' '}
                  <span style={{ background: `linear-gradient(to right, ${C.blueMid}, #06b6d4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CoStride</span>
                </h1>
                {displayName && (
                  <p style={{ color: C.sub, fontSize: 16, margin: '0 0 4px' }}>
                    You're all set, <strong style={{ color: C.text }}>{displayName}</strong> 👋
                  </p>
                )}
                <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Your journey starts now. Let's build those streaks.</p>
              </div>
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