import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, X, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ─── How many exercises to show before expand chevron ───────────────────────
const PREVIEW_COUNT = 3;

// ─── Parse sets/reps/weight out of an exercise object ───────────────────────
function parseEx(ex) {
  let sets = '-', reps = '-';
  if (ex.sets) sets = ex.sets;
  else if (ex.set_count) sets = ex.set_count;
  else if (ex.setsReps || ex.sets_reps) {
    const p = String(ex.setsReps || ex.sets_reps).toLowerCase().split(/\s*x\s*/);
    sets = p[0] || '-';
  } else if (ex.logged_sets?.length) sets = ex.logged_sets.length;

  if (ex.reps) reps = ex.reps;
  else if (ex.rep_count) reps = ex.rep_count;
  else if (ex.setsReps || ex.sets_reps) {
    const p = String(ex.setsReps || ex.sets_reps).toLowerCase().split(/\s*x\s*/);
    reps = p[1] || '-';
  } else if (ex.logged_sets?.[0]?.reps) reps = ex.logged_sets[0].reps;

  const weight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight ?? ex.logged_sets?.[0]?.weight ?? '-';
  return { sets, reps, weight };
}

// ─── Animated number that counts up from `from` to `to` ─────────────────────
function AnimatedNumber({ from, to, duration = 600, delay = 0, suffix = '', className = '' }) {
  const [display, setDisplay] = useState(from);
  const [popped, setPopped] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const fromN = parseFloat(from) || 0;
    const toN = parseFloat(to) || 0;
    if (fromN === toN) return;

    const startDelay = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        // ease-out-cubic
        const eased = 1 - Math.pow(1 - t, 3);
        const val = fromN + (toN - fromN) * eased;
        // Keep one decimal if original had one, else integer
        const formatted = Number.isInteger(toN) ? Math.round(val) : val.toFixed(1);
        setDisplay(formatted);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(toN % 1 === 0 ? toN : toN.toFixed(1));
          setPopped(true);
          setTimeout(() => setPopped(false), 300);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(startDelay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration, delay]);

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        transition: 'transform 0.18s cubic-bezier(0.34,1.5,0.64,1), color 0.18s ease',
        transform: popped ? 'scale(1.22)' : 'scale(1)',
        color: popped ? '#4ade80' : undefined,
      }}>
      {display}{suffix}
    </span>
  );
}

// ─── Single exercise row (static) ───────────────────────────────────────────
function ExRow({ ex, prevEx, animating, animDelay }) {
  const { sets, reps, weight } = parseEx(ex);
  const prev = prevEx ? parseEx(prevEx) : null;

  const weightChanged = prev && parseFloat(weight) > parseFloat(prev.weight);
  const repsChanged = prev && parseFloat(reps) > parseFloat(prev.reps);
  const exName = ex.exercise || ex.name || ex.title || 'Exercise';

  return (
    <div className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
      <div className="text-sm font-bold text-white leading-tight ml-1 truncate">{exName}</div>

      {/* Sets */}
      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: 36 }}>
        {sets}
      </div>

      <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>

      {/* Reps */}
      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: 36 }}>
        {animating && repsChanged
          ? <AnimatedNumber from={prev.reps} to={reps} duration={550} delay={animDelay} className="text-sm font-semibold" />
          : reps}
      </div>

      {/* Weight */}
      <div className="ml-3 pr-3">
        <div
          className="text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md min-w-[55px] transition-all duration-300"
          style={{
            background: animating && weightChanged
              ? 'linear-gradient(to right, #16a34a, #15803d)'
              : 'linear-gradient(to right, rgba(29,78,216,0.9), rgba(30,58,138,0.9))',
            boxShadow: animating && weightChanged
              ? '0 4px 14px rgba(22,163,74,0.45)'
              : '0 2px 8px rgba(30,64,175,0.3)',
          }}>
          {animating && weightChanged
            ? <AnimatedNumber from={prev.weight} to={weight} duration={600} delay={animDelay} suffix="kg" className="text-sm font-black" />
            : <>{weight}<span className="text-[10px] font-bold">kg</span></>}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ShareWorkoutScreen({ workoutName, exercises, previousExercises = [], currentUser, onContinue }) {
  // Animation phases:
  //  'reveal'    — full-screen card shown with OLD values
  //  'animating' — numbers tick up to NEW values (1s after mount)
  //  'collapsing'— card shrinks upward (after animation finishes)
  //  'share'     — share UI fades in
  const [phase, setPhase] = useState('reveal');
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const hasMore = exercises && exercises.length > PREVIEW_COUNT;

  // ── Compute how many exercises actually have increases ───────────────────
  const hasAnyIncrease = exercises?.some((ex, i) => {
    const prev = previousExercises?.[i];
    if (!prev) return false;
    const { weight, reps } = parseEx(ex);
    const { weight: pw, reps: pr } = parseEx(prev);
    return parseFloat(weight) > parseFloat(pw) || parseFloat(reps) > parseFloat(pr);
  });

  // ── Phase sequencing ─────────────────────────────────────────────────────
  useEffect(() => {
    // Phase 1 → 2: start number animations after 1.1s
    const t1 = setTimeout(() => setPhase('animating'), 1100);

    // Phase 2 → 3: collapse card after animations (~1.1s + 1.4s = 2.5s)
    // If no increases, skip straight to collapse sooner
    const animDuration = hasAnyIncrease ? 1400 : 400;
    const t2 = setTimeout(() => setPhase('collapsing'), 1100 + animDuration);

    // Phase 3 → 4: show share UI after collapse animation (0.55s)
    const t3 = setTimeout(() => setPhase('share'), 1100 + animDuration + 550);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploading(false); }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const content = comment ? comment.trim() : '';

      // Total volume: sum of (sets × reps × weight) across all exercises
      const totalVolume = exercises?.reduce((acc, ex) => {
        const s = parseFloat(ex.sets) || 0;
        const r = parseFloat(ex.reps || ex.setsReps?.split('x')?.[1]) || 0;
        const w = parseFloat(ex.weight) || 0;
        return acc + s * r * w;
      }, 0);
      const volumeStr = totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()} kg` : null;

      await base44.entities.Post.create({
        member_id: currentUser.id,
        member_name: currentUser.full_name,
        member_avatar: currentUser.avatar_url || '',
        content,
        image_url: photoUrl || null,
        video_url: null,
        likes: 0, comments: [], reactions: {},
        is_system_generated: false,
        allow_gym_repost: false,
        // ── Fields consumed by GymPostCard / PostCard Strava layout ──
        workout_name: workoutName || null,
        workout_exercises: (exercises || []).map(ex => {
          const rawName = ex.name || ex.title || ex.exercise_name || ex.exercise || '';
          const displayName = rawName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          const { sets, reps, weight } = parseEx(ex);
          return { name: displayName || 'Exercise', sets, reps, weight };
        }),
        workout_volume: volumeStr,
      });

      toast.success('Workout shared with your friends! 🔥');
      onContinue();
    } catch { toast.error('Failed to share workout'); }
    finally { setSharing(false); }
  };

  // ── Which exercises to render in the card ────────────────────────────────
  const visibleExercises = exercises
    ? (exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT))
    : [];

  // ── Stagger delay per exercise for the number animations ────────────────
  const animDelayFor = (idx) => idx * 120;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-6">

      {/* ── PHASE reveal / animating: full-screen centred workout card ── */}
      <AnimatePresence>
        {(phase === 'reveal' || phase === 'animating') && (
          <motion.div
            key="intro-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -40 }}
            transition={
              phase === 'reveal'
                ? { duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }
                : { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
            }
            className="w-full max-w-sm bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 p-6">

            {/* Workout name */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-5">
              <h3 className="text-2xl font-black text-white mb-1">{workoutName}</h3>
              {hasAnyIncrease && phase === 'animating' && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 text-xs font-bold uppercase tracking-widest">
                  🔥 New personal bests!
                </motion.p>
              )}
            </motion.div>

            {/* Column headers */}
            {exercises && exercises.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Exercises</p>
                <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
                  <div />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
                </div>

                <div className="space-y-2 -mx-2">
                  <AnimatePresence initial={false}>
                    {visibleExercises.map((ex, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden">
                        <ExRow
                          ex={phase === 'reveal' ? (previousExercises?.[idx] || ex) : ex}
                          prevEx={previousExercises?.[idx]}
                          animating={phase === 'animating'}
                          animDelay={animDelayFor(idx)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Expand chevron */}
                {hasMore && !exercisesExpanded && (
                  <div className="flex flex-col items-center pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                      +{exercises.length - PREVIEW_COUNT} more
                    </span>
                    <motion.button
                      onClick={() => setExercisesExpanded(true)}
                      className="flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors p-1"
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
                      <ChevronDown className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
                {hasMore && exercisesExpanded && (
                  <div className="flex justify-center pt-1">
                    <motion.button
                      onClick={() => setExercisesExpanded(false)}
                      className="flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors p-1"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
                      <ChevronDown className="w-5 h-5 rotate-180" />
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE collapsing: card shrinks upward ── */}
      <AnimatePresence>
        {phase === 'collapsing' && (
          <motion.div
            key="collapsing-card"
            initial={{ opacity: 1, scaleY: 1, y: 0 }}
            animate={{ opacity: 0, scaleY: 0, y: -60 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.8, 0] }}
            style={{ transformOrigin: 'top center' }}
            className="w-full max-w-sm bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl p-6 overflow-hidden">
            <h3 className="text-2xl font-black text-white">{workoutName}</h3>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE share: full share UI fades in ── */}
      <AnimatePresence>
        {phase === 'share' && (
          <motion.div
            key="share-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center">

            {/* Scrollable area */}
            <div className="w-full flex flex-col items-center overflow-y-auto max-h-[85vh] pb-4">

              {/* Compact workout summary card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
                className="w-full max-w-sm bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 p-6 mb-5">

                <div className="mb-5">
                  <h3 className="text-2xl font-black text-white mb-1">{workoutName}</h3>
                </div>

                {/* Photo preview */}
                {photoUrl && (
                  <div className="relative mb-4 rounded-xl overflow-hidden">
                    <img src={photoUrl} alt="workout" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Exercises */}
                {exercises && exercises.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Exercises</p>
                    <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
                      <div />
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
                    </div>
                    <div className="space-y-2 -mx-2">
                      <AnimatePresence initial={false}>
                        {(exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT)).map((ex, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden">
                            <ExRow ex={ex} prevEx={null} animating={false} animDelay={0} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {hasMore && !exercisesExpanded && (
                      <div className="flex flex-col items-center pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                          +{exercises.length - PREVIEW_COUNT} more
                        </span>
                        <motion.button
                          onClick={() => setExercisesExpanded(true)}
                          className="flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors p-1"
                          animate={{ y: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
                          <ChevronDown className="w-5 h-5" />
                        </motion.button>
                      </div>
                    )}
                    {hasMore && exercisesExpanded && (
                      <div className="flex justify-center pt-1">
                        <motion.button
                          onClick={() => setExercisesExpanded(false)}
                          className="flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors p-1"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
                          <ChevronDown className="w-5 h-5 rotate-180" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Comment */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm mb-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment about your workout… (optional)"
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-blue-400 transition-colors" />
              </motion.div>

              {/* Photo upload */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full max-w-sm mb-4">
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/30 text-slate-300 hover:border-white/50 hover:text-white transition-all text-sm font-medium">
                  {uploading ? <span className="text-slate-400">Uploading...</span> : (
                    <><Camera className="w-4 h-4" />{photoUrl ? 'Change photo' : 'Add a photo (optional)'}</>
                  )}
                </button>
              </motion.div>
            </div>

            {/* Buttons — always at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-sm flex flex-col gap-3 pt-3">
              <Button
                onClick={handleShare}
                disabled={sharing}
                className="w-full h-13 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white font-black text-base rounded-2xl shadow-[0_4px_0_0_#c2410c,0_8px_20px_rgba(234,88,12,0.4)] active:shadow-none active:translate-y-[4px] active:scale-95 transition-all duration-100 border border-transparent flex items-center justify-center">
                {sharing ? 'Sharing...' : 'Share Workout'}
              </Button>
              <Button
                onClick={onContinue}
                variant="ghost"
                className="w-full h-12 text-slate-400 hover:text-white font-semibold text-base rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center">
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}