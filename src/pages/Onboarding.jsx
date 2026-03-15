import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ChevronLeft, ChevronRight, Building2, User, CheckCircle2,
  Search, Camera, X, Loader2
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────────────────────────
const LOGO_URL =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SPLITS (used on the workout-picker step)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SPLITS = [
  {
    id: 'bro',
    name: 'Bro Split',
    description: '5 days · one muscle group per day',
    blurb:
      'Train one muscle group per day — chest Monday, back Tuesday — giving each muscle a full week to recover. Great for focused sessions but missing a day means that muscle only trains once.',
    icon: '💪',
    color: 'from-purple-500 to-indigo-600',
    glowColor: 'rgba(168,85,247,0.35)',
    days: [1, 2, 3, 4, 5],
    workouts: {
      1: { name: 'Chest', color: 'blue', exercises: [
        { exercise: 'Barbell Bench Press', sets: '4', reps: '6' },
        { exercise: 'Incline Dumbbell Press', sets: '4', reps: '10' },
        { exercise: 'Cable Fly', sets: '3', reps: '12' },
        { exercise: 'Dips', sets: '3', reps: '10' },
        { exercise: 'Push-Ups', sets: '3', reps: '15' },
        { exercise: 'Pec Deck', sets: '3', reps: '12' }] },
      2: { name: 'Back', color: 'purple', exercises: [
        { exercise: 'Deadlift', sets: '4', reps: '5' },
        { exercise: 'Pull-Ups', sets: '4', reps: '8' },
        { exercise: 'Barbell Row', sets: '4', reps: '8' },
        { exercise: 'Lat Pulldown', sets: '3', reps: '12' },
        { exercise: 'Cable Row', sets: '3', reps: '12' },
        { exercise: 'Dumbbell Row', sets: '3', reps: '10' }] },
      3: { name: 'Shoulders', color: 'cyan', exercises: [
        { exercise: 'Overhead Press', sets: '4', reps: '8' },
        { exercise: 'Lateral Raise', sets: '4', reps: '15' },
        { exercise: 'Front Raises', sets: '3', reps: '12' },
        { exercise: 'Face Pulls', sets: '3', reps: '15' },
        { exercise: 'Arnold Press', sets: '3', reps: '10' },
        { exercise: 'Shrugs', sets: '3', reps: '15' }] },
      4: { name: 'Arms', color: 'pink', exercises: [
        { exercise: 'Barbell Curl', sets: '4', reps: '10' },
        { exercise: 'Hammer Curls', sets: '3', reps: '12' },
        { exercise: 'Incline Curl', sets: '3', reps: '12' },
        { exercise: 'Skull Crushers', sets: '4', reps: '10' },
        { exercise: 'Tricep Pushdown', sets: '3', reps: '12' },
        { exercise: 'Overhead Tricep', sets: '3', reps: '12' }] },
      5: { name: 'Legs', color: 'green', exercises: [
        { exercise: 'Barbell Squat', sets: '4', reps: '6' },
        { exercise: 'Romanian Deadlift', sets: '4', reps: '8' },
        { exercise: 'Leg Press', sets: '3', reps: '12' },
        { exercise: 'Leg Curl', sets: '3', reps: '12' },
        { exercise: 'Leg Extension', sets: '3', reps: '15' },
        { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
    },
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: '4 days · upper & lower alternating',
    blurb:
      'Split into upper (chest, back, shoulders, arms) and lower (legs, glutes), training each twice a week. Great for strength and size — upper days can feel long.',
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59,130,246,0.35)',
    days: [1, 2, 4, 5],
    workouts: {
      1: { name: 'Upper A', color: 'blue', exercises: [
        { exercise: 'Barbell Bench Press', sets: '4', reps: '6' },
        { exercise: 'Barbell Row', sets: '4', reps: '6' },
        { exercise: 'Overhead Press', sets: '3', reps: '8' },
        { exercise: 'Pull-Ups', sets: '3', reps: '8' },
        { exercise: 'Lateral Raises', sets: '3', reps: '15' },
        { exercise: 'Tricep Pushdown', sets: '3', reps: '12' }] },
      2: { name: 'Lower A', color: 'green', exercises: [
        { exercise: 'Barbell Squat', sets: '4', reps: '6' },
        { exercise: 'Romanian Deadlift', sets: '4', reps: '8' },
        { exercise: 'Leg Press', sets: '3', reps: '10' },
        { exercise: 'Leg Curl', sets: '3', reps: '12' },
        { exercise: 'Leg Extension', sets: '3', reps: '12' },
        { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
      4: { name: 'Upper B', color: 'cyan', exercises: [
        { exercise: 'Incline Dumbbell Press', sets: '4', reps: '10' },
        { exercise: 'Cable Row', sets: '4', reps: '10' },
        { exercise: 'Dumbbell Shoulder Press', sets: '3', reps: '10' },
        { exercise: 'Lat Pulldown', sets: '3', reps: '12' },
        { exercise: 'Barbell Curl', sets: '3', reps: '12' },
        { exercise: 'Skull Crushers', sets: '3', reps: '12' }] },
      5: { name: 'Lower B', color: 'purple', exercises: [
        { exercise: 'Deadlift', sets: '4', reps: '5' },
        { exercise: 'Bulgarian Split Squat', sets: '3', reps: '10' },
        { exercise: 'Hack Squat', sets: '3', reps: '10' },
        { exercise: 'Leg Curl', sets: '3', reps: '12' },
        { exercise: 'Leg Extension', sets: '3', reps: '12' },
        { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
    },
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: '6 days · PPL ×2',
    blurb:
      'Push days: chest, shoulders & triceps. Pull days: back & biceps. Legs: everything below. Running twice a week means each muscle trains twice. Requires a 6-day commitment.',
    icon: '🔄',
    color: 'from-cyan-500 to-teal-500',
    glowColor: 'rgba(20,184,166,0.35)',
    days: [1, 2, 3, 5, 6, 7],
    workouts: {
      1: { name: 'Push A', color: 'orange', exercises: [
        { exercise: 'Barbell Bench Press', sets: '4', reps: '6' },
        { exercise: 'Overhead Press', sets: '4', reps: '8' },
        { exercise: 'Incline Dumbbell Press', sets: '3', reps: '10' },
        { exercise: 'Cable Fly', sets: '3', reps: '12' },
        { exercise: 'Lateral Raises', sets: '3', reps: '15' },
        { exercise: 'Tricep Pushdown', sets: '3', reps: '12' }] },
      2: { name: 'Pull A', color: 'blue', exercises: [
        { exercise: 'Deadlift', sets: '4', reps: '5' },
        { exercise: 'Pull-Ups', sets: '4', reps: '8' },
        { exercise: 'Barbell Row', sets: '4', reps: '8' },
        { exercise: 'Face Pulls', sets: '3', reps: '15' },
        { exercise: 'Barbell Curl', sets: '3', reps: '12' },
        { exercise: 'Hammer Curls', sets: '3', reps: '12' }] },
      3: { name: 'Legs A', color: 'green', exercises: [
        { exercise: 'Barbell Squat', sets: '4', reps: '6' },
        { exercise: 'Romanian Deadlift', sets: '4', reps: '8' },
        { exercise: 'Leg Press', sets: '3', reps: '12' },
        { exercise: 'Leg Curl', sets: '3', reps: '12' },
        { exercise: 'Leg Extension', sets: '3', reps: '12' },
        { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
      5: { name: 'Push B', color: 'orange', exercises: [
        { exercise: 'Incline Barbell Press', sets: '4', reps: '8' },
        { exercise: 'Dumbbell Shoulder Press', sets: '4', reps: '10' },
        { exercise: 'Cable Fly', sets: '3', reps: '12' },
        { exercise: 'Lateral Raises', sets: '4', reps: '15' },
        { exercise: 'Skull Crushers', sets: '3', reps: '12' },
        { exercise: 'Overhead Tricep', sets: '3', reps: '12' }] },
      6: { name: 'Pull B', color: 'blue', exercises: [
        { exercise: 'Lat Pulldown', sets: '4', reps: '10' },
        { exercise: 'Cable Row', sets: '4', reps: '10' },
        { exercise: 'Dumbbell Row', sets: '3', reps: '10' },
        { exercise: 'Rear Delt Fly', sets: '3', reps: '15' },
        { exercise: 'Incline Curl', sets: '3', reps: '12' },
        { exercise: 'Hammer Curls', sets: '3', reps: '12' }] },
      7: { name: 'Legs B', color: 'green', exercises: [
        { exercise: 'Front Squat', sets: '4', reps: '8' },
        { exercise: 'Bulgarian Split Squat', sets: '3', reps: '10' },
        { exercise: 'Hack Squat', sets: '3', reps: '10' },
        { exercise: 'Leg Curl', sets: '3', reps: '12' },
        { exercise: 'Leg Extension', sets: '3', reps: '12' },
        { exercise: 'Calf Raises', sets: '4', reps: '20' }] },
    },
  },
  {
    id: 'full_body',
    name: 'Full Body',
    description: '3 days · total body each session',
    blurb:
      'Every session trains your whole body — squats, pressing, pulling — three times a week. Best for beginners: frequent practice speeds up strength gains.',
    icon: '🏋️',
    color: 'from-emerald-500 to-green-600',
    glowColor: 'rgba(16,185,129,0.35)',
    days: [1, 3, 5],
    workouts: {
      1: { name: 'Full Body A', color: 'green', exercises: [
        { exercise: 'Barbell Squat', sets: '4', reps: '6' },
        { exercise: 'Barbell Bench Press', sets: '4', reps: '8' },
        { exercise: 'Barbell Row', sets: '4', reps: '8' },
        { exercise: 'Overhead Press', sets: '3', reps: '10' },
        { exercise: 'Barbell Curl', sets: '3', reps: '12' },
        { exercise: 'Calf Raises', sets: '3', reps: '15' }] },
      3: { name: 'Full Body B', color: 'cyan', exercises: [
        { exercise: 'Deadlift', sets: '4', reps: '5' },
        { exercise: 'Incline Dumbbell Press', sets: '4', reps: '10' },
        { exercise: 'Pull-Ups', sets: '4', reps: '8' },
        { exercise: 'Dumbbell Shoulder Press', sets: '3', reps: '10' },
        { exercise: 'Tricep Pushdown', sets: '3', reps: '12' },
        { exercise: 'Leg Curl', sets: '3', reps: '12' }] },
      5: { name: 'Full Body C', color: 'blue', exercises: [
        { exercise: 'Front Squat', sets: '4', reps: '8' },
        { exercise: 'Dumbbell Bench Press', sets: '4', reps: '10' },
        { exercise: 'Cable Row', sets: '4', reps: '10' },
        { exercise: 'Lateral Raises', sets: '3', reps: '15' },
        { exercise: 'Hammer Curls', sets: '3', reps: '12' },
        { exercise: 'Calf Raises', sets: '3', reps: '20' }] },
    },
  },
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLOR_GRADIENT_MAP = {
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  cyan: 'from-cyan-500 to-cyan-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  pink: 'from-pink-500 to-pink-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

// Progress bar — steps 2-6 each fill one segment (5 total), step 7 = full
function ProgressBar({ step }) {
  const pct = Math.min(((step - 1) / 5) * 100, 100);
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Duolingo-style chunky button
function PrimaryButton({ onClick, disabled, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16,
        background: disabled ? '#1e293b' : '#1a3fa8',
        transform: 'translateY(4px)',
      }} />
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
          padding: '15px 24px', borderRadius: 16, border: 'none',
          fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em',
          background: disabled
            ? 'linear-gradient(to bottom, #334155, #1e293b)'
            : 'linear-gradient(to bottom, #60a5fa, #3b82f6 40%, #2563eb)',
          color: disabled ? '#64748b' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transform: pressed ? 'translateY(4px)' : 'translateY(0)',
          boxShadow: pressed || disabled
            ? 'none'
            : '0 4px 0 0 #1a3fa8, 0 6px 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          transition: 'transform 0.07s ease, box-shadow 0.07s ease, background 0.2s ease',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          outline: 'none',
        }}
      >
        {children}
      </button>
    </div>
  );
}

// Shared page shell — fixed full screen, no overflow
function PageShell({ children, style = {} }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* bg orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 400, height: 400, background: 'rgba(37,99,235,0.08)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'rgba(88,28,135,0.08)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

// Slide transition wrapper
function SlidePane({ visible, dir, children }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : dir === 'forward' ? 'translateX(28px)' : 'translateX(-28px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLIT DETAIL BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────────
function SplitDetailSheet({ split, onClose }) {
  if (!split) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          borderRadius: '24px 24px 0 0', overflow: 'hidden',
          background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)',
          maxHeight: '82vh', display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — no X button, no emoji */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: '0 0 2px' }}>{split.name}</p>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 10px' }}>{split.description}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {split.days.map(d => (
              <span key={d} className={`bg-gradient-to-r ${split.color}`} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, color: '#fff' }}>
                {DAY_NAMES[d - 1]}
              </span>
            ))}
          </div>
          <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5, margin: '10px 0 0' }}>{split.blurb}</p>
        </div>

        {/* Day cards — scrollable inside sheet */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 24px' }}>
          {split.days.map(day => {
            const wt = split.workouts[day];
            if (!wt) return null;
            const grad = COLOR_GRADIENT_MAP[wt.color] || 'from-blue-500 to-blue-600';
            return (
              <div key={day} style={{ marginBottom: 10, borderRadius: 16, overflow: 'hidden', background: 'rgba(12,16,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 8px' }}>
                  <div className={`bg-gradient-to-br ${grad}`} style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{DAY_NAMES[day - 1]}</span>
                  </div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>{wt.name}</p>
                </div>

                {/* Column headers */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6px 14px 4px', display: 'grid', gridTemplateColumns: '1fr 44px 44px', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Exercise</span>
                  <span style={{ color: '#475569', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>Sets</span>
                  <span style={{ color: '#475569', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>Reps</span>
                </div>

                {/* Exercise rows */}
                <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(wt.exercises || []).map((ex, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 44px 44px', gap: 6, alignItems: 'center' }}>
                      <div style={{ padding: '7px 10px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.3)', borderRadius: 8 }}>
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>{ex.exercise}</span>
                      </div>
                      <div style={{ padding: '7px 4px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.3)', borderRadius: 8, textAlign: 'center' }}>
                        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>{ex.sets}</span>
                      </div>
                      <div style={{ padding: '7px 4px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.3)', borderRadius: 8, textAlign: 'center' }}>
                        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>{ex.reps}</span>
                      </div>
                    </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT TYPE CARDS (step 1)
// ─────────────────────────────────────────────────────────────────────────────
const ACCOUNT_TYPES = [
  {
    id: 'personal',
    title: "I'm a Member",
    description: 'Track workouts, join challenges, connect with gyms',
    icon: User,
    color: 'from-blue-400 to-cyan-500',
    shadow: 'rgba(59,130,246,0.25)',
  },
  {
    id: 'gym_owner',
    title: 'I own a Gym',
    description: 'Register your gym, manage members, create rewards',
    icon: Building2,
    color: 'from-purple-400 to-pink-500',
    shadow: 'rgba(168,85,247,0.25)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // step 0 = splash, 1 = account type
  // member path: 2=community, 3=workout, 4=name, 5=photo, 6=days, 7=welcome
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState('forward');
  const [visible, setVisible] = useState(true);

  // ── form state ──────────────────────────────────────────────────────────
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [gymJoinMode, setGymJoinMode] = useState('code');
  const [gymCode, setGymCode] = useState('');
  const [gymSearch, setGymSearch] = useState('');
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [previewSplit, setPreviewSplit] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [trainingDays, setTrainingDays] = useState([]);
  const fileInputRef = useRef(null);

  // gym search state
  const [gymSearchResults, setGymSearchResults] = useState([]);
  const [gymPlacesResults, setGymPlacesResults] = useState([]);
  const [isGymSearching, setIsGymSearching] = useState(false);
  const [joinedGym, setJoinedGym] = useState(null);
  const [gymType, setGymType] = useState('general');

  const updateMeMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
  });

  // Debounced gym search (DB + Google Places)
  useEffect(() => {
    if (gymJoinMode !== 'search' || gymSearch.trim().length < 2) {
      setGymSearchResults([]);
      setGymPlacesResults([]);
      return;
    }
    setIsGymSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [dbRes, placesRes] = await Promise.allSettled([
          base44.entities.Gym.filter({ status: 'approved' }, 'name', 50),
          base44.functions.invoke('searchGymsPlaces', { input: gymSearch }),
        ]);
        const q = gymSearch.toLowerCase();
        const dbGyms = dbRes.status === 'fulfilled'
          ? dbRes.value.filter(g => g.name?.toLowerCase().includes(q) || g.city?.toLowerCase().includes(q))
          : [];
        const places = placesRes.status === 'fulfilled' ? (placesRes.value?.data?.results || []) : [];
        const existingIds = dbGyms.map(g => g.google_place_id).filter(Boolean);
        setGymSearchResults(dbGyms.slice(0, 5));
        setGymPlacesResults(places.filter(p => !existingIds.includes(p.place_id)).slice(0, 3));
      } catch (e) {
        console.error('Gym search error', e);
      } finally {
        setIsGymSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [gymSearch, gymJoinMode]);

  const joinGymMutation = useMutation({
    mutationFn: async (gym) => {
      const me = await base44.auth.me();
      await base44.entities.GymMembership.create({
        user_id: me.id, user_name: me.full_name, user_email: me.email,
        gym_id: gym.id, gym_name: gym.name, status: 'active',
        join_date: new Date().toISOString().split('T')[0], membership_type: 'monthly',
      });
      if (!me.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
      return gym;
    },
    onSuccess: (gym) => {
      setJoinedGym(gym);
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const createAndJoinGymMutation = useMutation({
    mutationFn: async (place) => {
      const addressParts = place.address.split(',');
      const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : place.address;
      const gym = await base44.entities.Gym.create({
        name: place.name, address: place.address, city,
        google_place_id: place.place_id, latitude: place.latitude, longitude: place.longitude,
        type: gymType, status: 'approved', claim_status: 'unclaimed', members_count: 0,
        image_url: place.photo_url || null,
      });
      const me = await base44.auth.me();
      await base44.entities.GymMembership.create({
        user_id: me.id, user_name: me.full_name, user_email: me.email,
        gym_id: gym.id, gym_name: gym.name, status: 'active',
        join_date: new Date().toISOString().split('T')[0], membership_type: 'monthly',
      });
      if (!me.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
      return gym;
    },
    onSuccess: (gym) => {
      setJoinedGym(gym);
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // ── Splash auto-advance ─────────────────────────────────────────────────
  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(() => goTo(1, 'forward'), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  function goTo(next, dir = 'forward') {
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => { setStep(next); setVisible(true); }, 210);
  }

  function handleAccountTypeContinue() {
    if (!selectedAccountType) return;
    if (selectedAccountType === 'gym_owner') {
      // ── GYM OWNER: unchanged original behaviour ──────────────────────
      updateMeMutation.mutate({ account_type: 'gym_owner', onboarding_completed: false });
      navigate(createPageUrl('GymSignup'));
      return;
    }
    // ── MEMBER: start multi-step flow ────────────────────────────────────
    updateMeMutation.mutate({ account_type: 'personal', onboarding_completed: false });
    goTo(2, 'forward');
  }

  function handleToggleDay(d) {
    setTrainingDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  }

  async function handleFinish() {
    const payload = { onboarding_completed: true, training_days: trainingDays };
    if (displayName.trim()) payload.full_name = displayName.trim();
    if (selectedSplit) {
      payload.workout_split = selectedSplit.id;
      payload.custom_split_name = selectedSplit.name;
      payload.training_days = selectedSplit.days;
      payload.custom_workout_types = selectedSplit.workouts;
    }
    if (avatarFile) {
      try {
        const uploaded = await base44.storage.uploadFile(avatarFile);
        payload.avatar_url = uploaded.url;
      } catch (e) {
        console.error('Avatar upload failed', e);
      }
    }
    await updateMeMutation.mutateAsync(payload);
    navigate(createPageUrl('Home'));
  }

  // inner content padding — keeps everything off edges
  const inner = {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '0 20px 28px', overflow: 'hidden',
    maxWidth: 480, width: '100%', margin: '0 auto',
  };

  // ══════════════════════════════════════════════════════════════════════
  // STEP 0 — SPLASH
  // ══════════════════════════════════════════════════════════════════════
  if (step === 0) {
    return (
      <PageShell>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          <img src={LOGO_URL} alt="CoStride" style={{ width: 88, height: 88, borderRadius: 24, objectFit: 'cover', boxShadow: '0 0 40px rgba(59,130,246,0.4)', border: '1px solid rgba(255,255,255,0.15)' }} />
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 32, letterSpacing: '-0.03em', margin: 0 }}>
            Co<span style={{ background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Stride</span>
          </h1>
        </div>
      </PageShell>
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
            {/* Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 52, paddingBottom: 20, flexShrink: 0 }}>
              <img src={LOGO_URL} alt="CoStride" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', boxShadow: '0 0 24px rgba(59,130,246,0.35)', border: '1px solid rgba(255,255,255,0.15)' }} />
            </div>

            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 24px', flexShrink: 0 }}>
              Choose your account type
            </h1>

            {/* Type cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, flexShrink: 0 }}>
              {ACCOUNT_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = selectedAccountType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedAccountType(type.id)}
                    style={{
                      position: 'relative', padding: 18, borderRadius: 20,
                      background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1.5px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isSelected ? `0 8px 24px ${type.shadow}` : 'none',
                      cursor: 'pointer', textAlign: 'left',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.25s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <CheckCircle2 size={15} color="#60a5fa" />
                      </div>
                    )}
                    <div className={`bg-gradient-to-br ${type.color}`} style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: `0 4px 12px ${type.shadow}`, flexShrink: 0 }}>
                      <Icon size={22} color="#fff" strokeWidth={2} />
                    </div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{type.title}</p>
                    <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, lineHeight: 1.4 }}>{type.description}</p>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1 }} />

            <PrimaryButton onClick={handleAccountTypeContinue} disabled={!selectedAccountType}>
              Continue
            </PrimaryButton>

            <p style={{ color: '#475569', fontSize: 11, textAlign: 'center', margin: '12px 0 0' }}>
              By continuing you agree to CoStride's Terms &amp; Privacy Policy
            </p>
          </div>
        </SlidePane>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP 2 — JOIN YOUR COMMUNITY (member only)
  // ══════════════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <PageShell>
        <SlidePane visible={visible} dir={animDir}>
          <div style={inner}>
            {/* Back + progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 28, flexShrink: 0 }}>
              <button onClick={() => goTo(1, 'back')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, flexShrink: 0, display: 'flex' }}>
                <ChevronLeft size={24} />
              </button>
              <ProgressBar step={2} />
            </div>

            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 6px', flexShrink: 0 }}>
              Let's Join Your Community
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px', flexShrink: 0 }}>
              Find your gym to connect with members and track check-ins.
            </p>

            {/* Mode switcher */}
            <div style={{ display: 'flex', background: 'rgba(30,41,59,0.7)', borderRadius: 16, padding: 4, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16, flexShrink: 0 }}>
              {[['code', 'Enter Code'], ['search', 'Find Gym']].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setGymJoinMode(mode)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                    background: gymJoinMode === mode ? 'linear-gradient(to bottom, #3b82f6, #2563eb)' : 'transparent',
                    color: gymJoinMode === mode ? '#fff' : '#64748b',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    boxShadow: gymJoinMode === mode ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                    transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0 }}>
              {gymJoinMode === 'code' ? (
                <div>
                  <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Gym Code</p>
                  <input
                    type="text"
                    value={gymCode}
                    onChange={e => setGymCode(e.target.value.toUpperCase())}
                    placeholder="e.g. GYM-ABCD"
                    maxLength={12}
                    style={{ fontSize: 20, width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(71,85,105,0.5)', color: '#fff', outline: 'none', textAlign: 'center', fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                  <p style={{ color: '#475569', fontSize: 12, textAlign: 'center', margin: '8px 0 0' }}>Ask your gym for their unique code</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Search by name</p>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 1 }} />
                    <input
                      type="text"
                      value={gymSearch}
                      onChange={e => { setGymSearch(e.target.value); setJoinedGym(null); }}
                      placeholder="Search gyms near you…"
                      style={{ fontSize: 16, width: '100%', padding: '14px 16px 14px 40px', borderRadius: 14, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(71,85,105,0.5)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {isGymSearching && <Loader2 size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#60a5fa', animation: 'spin 1s linear infinite' }} />}
                  </div>

                  {/* Joined confirmation */}
                  {joinedGym && (
                    <div style={{ marginTop: 10, borderRadius: 14, border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(16,185,129,0.1)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ color: '#34d399', fontWeight: 700, fontSize: 13, margin: 0 }}>Joined {joinedGym.name}!</p>
                        <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>You can add more gyms later from the Gyms page.</p>
                      </div>
                    </div>
                  )}

                  {/* DB results */}
                  {!joinedGym && gymSearchResults.length > 0 && (
                    <div style={{ marginTop: 8, borderRadius: 14, border: '1px solid rgba(71,85,105,0.3)', background: 'rgba(12,16,32,0.95)', overflow: 'hidden' }}>
                      {gymSearchResults.map((gym, i) => (
                        <button key={gym.id} onClick={() => joinGymMutation.mutate(gym)} disabled={joinGymMutation.isPending}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', borderBottom: i < gymSearchResults.length - 1 ? '1px solid rgba(71,85,105,0.2)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                          {gym.image_url
                            ? <img src={gym.image_url} alt={gym.name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Building2 size={18} color="#60a5fa" />
                              </div>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gym.name}</p>
                            <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>{gym.city}</p>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                            {joinGymMutation.isPending ? '…' : 'Join'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Google Places results (new gyms to add) */}
                  {!joinedGym && gymPlacesResults.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Add from Google Maps</p>
                      <div style={{ borderRadius: 14, border: '1px solid rgba(71,85,105,0.3)', background: 'rgba(12,16,32,0.95)', overflow: 'hidden' }}>
                        {gymPlacesResults.map((place, i) => (
                          <button key={place.place_id} onClick={() => createAndJoinGymMutation.mutate(place)} disabled={createAndJoinGymMutation.isPending}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'none', border: 'none', borderBottom: i < gymPlacesResults.length - 1 ? '1px solid rgba(71,85,105,0.2)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                            {place.photo_url
                              ? <img src={place.photo_url} alt={place.name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Building2 size={18} color="#34d399" />
                                </div>
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</p>
                              <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</p>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                              {createAndJoinGymMutation.isPending ? '…' : '+ Add'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {!joinedGym && !isGymSearching && gymSearch.length >= 2 && gymSearchResults.length === 0 && gymPlacesResults.length === 0 && (
                    <div style={{ marginTop: 8, borderRadius: 14, border: '1px solid rgba(71,85,105,0.3)', background: 'rgba(12,16,32,0.9)', padding: '16px', textAlign: 'center' }}>
                      <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>No gyms found — try a different search</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <PrimaryButton
                onClick={() => goTo(3, 'forward')}
                disabled={gymJoinMode === 'code' ? gymCode.trim().length < 3 : false}
              >
                {joinedGym ? 'Continue' : gymJoinMode === 'search' ? 'Continue' : 'Continue'}
              </PrimaryButton>
              {gymJoinMode === 'search' && !joinedGym && (
                <button
                  onClick={() => goTo(3, 'forward')}
                  style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', padding: '6px 0', WebkitTapHighlightColor: 'transparent' }}
                >
                  Skip — I'll find my gym later
                </button>
              )}
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
            {/* Back + progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 16, flexShrink: 0 }}>
              <button onClick={() => goTo(2, 'back')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, flexShrink: 0, display: 'flex' }}>
                <ChevronLeft size={24} />
              </button>
              <ProgressBar step={3} />
            </div>

            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 4px', flexShrink: 0 }}>
              Pick Your Workout
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 14px', flexShrink: 0 }}>
              Choose a training split, press to preview.
            </p>

            {/* Split cards — this section takes remaining space */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEFAULT_SPLITS.map(split => {
                const isSelected = selectedSplit?.id === split.id;
                return (
                  <div
                    key={split.id}
                    onClick={() => {
                      setSelectedSplit(isSelected ? null : { id: split.id, name: split.name, days: split.days, workouts: split.workouts });
                      setPreviewSplit(split);
                    }}
                    style={{
                      position: 'relative', borderRadius: 18, cursor: 'pointer',
                      background: 'linear-gradient(135deg, rgba(20,25,50,0.85) 0%, rgba(8,10,20,0.96) 100%)',
                      border: isSelected ? '1.5px solid rgba(34,197,94,0.6)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: isSelected ? '0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(34,197,94,0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
                      overflow: 'hidden', flexShrink: 0,
                      transition: 'border 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* glow */}
                    <div style={{ position: 'absolute', inset: 0, background: isSelected ? 'radial-gradient(ellipse at 20% 40%, rgba(34,197,94,0.2) 0%, transparent 55%)' : `radial-gradient(ellipse at 20% 40%, ${split.glowColor} 0%, transparent 55%)`, opacity: isSelected ? 1 : 0.07, pointerEvents: 'none', borderRadius: 18 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 14px', position: 'relative' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#fff', fontWeight: 900, fontSize: 15, margin: 0 }}>{split.name}</p>
                        <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 6px' }}>{split.description}</p>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {split.days.map(d => (
                            <span key={d} className={`bg-gradient-to-r ${split.color}`} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, color: '#fff', opacity: 0.85 }}>
                              {DAY_NAMES[d - 1]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={18} color="#475569" style={{ flexShrink: 0 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, flexShrink: 0 }}>
              <PrimaryButton onClick={() => goTo(4, 'forward')} disabled={!selectedSplit}>
                Continue
              </PrimaryButton>
              <button
                onClick={() => goTo(4, 'forward')}
                style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', padding: '6px 0', WebkitTapHighlightColor: 'transparent' }}
              >
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
              <button onClick={() => goTo(3, 'back')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, flexShrink: 0, display: 'flex' }}>
                <ChevronLeft size={24} />
              </button>
              <ProgressBar step={4} />
            </div>

            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 6px', flexShrink: 0 }}>
              What's your name?
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 28px', flexShrink: 0 }}>
              This is how you'll appear to other members.
            </p>

            <div style={{ flexShrink: 0 }}>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Display Name</p>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value.slice(0, 30))}
                placeholder="e.g. Alex Johnson"
                maxLength={30}
                autoFocus
                style={{ fontSize: 18, width: '100%', padding: '15px 16px', borderRadius: 14, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(71,85,105,0.5)', color: '#fff', outline: 'none', boxSizing: 'border-box', fontWeight: 600 }}
              />
            </div>

            <div style={{ flex: 1 }} />

            <PrimaryButton onClick={() => goTo(5, 'forward')} disabled={displayName.trim().length < 2}>
              Continue
            </PrimaryButton>
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
              <button onClick={() => goTo(4, 'back')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, flexShrink: 0, display: 'flex' }}>
                <ChevronLeft size={24} />
              </button>
              <ProgressBar step={5} />
            </div>

            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 6px', flexShrink: 0 }}>
              Add a Profile Picture
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 0', flexShrink: 0 }}>
              Let your friends identify you.
            </p>

            {/* Avatar picker — centred */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'relative', width: 180, height: 180, borderRadius: '50%', overflow: 'hidden',
                  border: avatarPreview ? '3px solid rgba(96,165,250,0.6)' : '2px dashed rgba(71,85,105,0.6)',
                  background: avatarPreview ? 'transparent' : 'rgba(15,23,42,0.7)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {avatarPreview
                  ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Camera size={40} color="#475569" />
                      <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>Tap to upload</span>
                    </div>
                }
              </button>

              <p style={{ color: '#475569', fontSize: 12, textAlign: 'center', maxWidth: 240, lineHeight: 1.5, margin: 0 }}>
                A photo helps gym members and friends recognise you in the community.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <PrimaryButton onClick={() => goTo(6, 'forward')}>Continue</PrimaryButton>
              <button
                onClick={() => goTo(6, 'forward')}
                style={{ background: 'none', border: 'none', color: '#475569', fontSize: 14, cursor: 'pointer', padding: '8px 0', WebkitTapHighlightColor: 'transparent' }}
              >
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
              <button onClick={() => goTo(5, 'back')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, flexShrink: 0, display: 'flex' }}>
                <ChevronLeft size={24} />
              </button>
              <ProgressBar step={6} />
            </div>

            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 6px', flexShrink: 0 }}>
              How often do you train?
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px', flexShrink: 0 }}>
              Pick the days you plan to go to the gym each week.
            </p>

            {/* Day buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, flexShrink: 0 }}>
              {DAY_NAMES.map((name, i) => {
                const d = i + 1;
                const on = trainingDays.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => handleToggleDay(d)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, paddingTop: 12, paddingBottom: 12, borderRadius: 14,
                      border: on ? '2px solid rgba(96,165,250,0.5)' : '2px solid rgba(71,85,105,0.4)',
                      background: on
                        ? 'linear-gradient(to bottom, #3b82f6, #1d4ed8)'
                        : 'rgba(15,23,42,0.6)',
                      color: on ? '#fff' : '#64748b',
                      fontWeight: 700, fontSize: 11, cursor: 'pointer',
                      boxShadow: on ? '0 3px 0 0 #1a3fa8' : 'none',
                      transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {name}
                    {on && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(186,230,253,0.8)' }} />}
                  </button>
                );
              })}
            </div>

            <p style={{ color: '#475569', fontSize: 12, textAlign: 'center', margin: '10px 0 0', flexShrink: 0 }}>
              {trainingDays.length > 0
                ? `${trainingDays.length} training day${trainingDays.length !== 1 ? 's' : ''} · ${7 - trainingDays.length} rest`
                : 'Select at least one day'}
            </p>

            <div style={{ flex: 1 }} />

            <PrimaryButton onClick={() => goTo(7, 'forward')} disabled={trainingDays.length === 0}>
              Continue
            </PrimaryButton>
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
            {/* Full progress bar */}
            <div style={{ paddingTop: 52, marginBottom: 24, flexShrink: 0 }}>
              <ProgressBar step={7} />
            </div>

            {/* Centred content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
              <img src={LOGO_URL} alt="CoStride" style={{ width: 80, height: 80, borderRadius: 22, objectFit: 'cover', boxShadow: '0 0 40px rgba(59,130,246,0.45)', border: '1px solid rgba(255,255,255,0.15)', animation: 'pulse 2s ease-in-out infinite' }} />

              <div>
                <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 34, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.1 }}>
                  Welcome to{' '}
                  <span style={{ background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    CoStride
                  </span>
                </h1>
                {displayName && (
                  <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 0 4px' }}>
                    You're all set, <strong style={{ color: '#fff' }}>{displayName}</strong> 👋
                  </p>
                )}
                <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
                  Your journey starts now. Let's build those streaks.
                </p>
              </div>

              {/* no summary chips */}
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