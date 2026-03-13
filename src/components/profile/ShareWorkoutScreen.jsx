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
        const eased = 1 - Math.pow(1 - t, 3);
        const val = fromN + (toN - fromN) * eased;
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

      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: 36 }}>
        {sets}
      </div>

      <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>

      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: 36 }}>
        {animating && repsChanged
          ? <AnimatedNumber from={prev.reps} to={reps} duration={550} delay={animDelay} className="text-sm font-semibold" />
          : reps}
      </div>

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

// ─── Swipeable photo/summary panels (mirrors PostCard layout) ───────────────
function SwipeablePanels({ photoUrl, uploading, onPhotoClick, onRemovePhoto, exercises, PANEL_HEIGHT, PREVIEW_COUNT_POST, exercisesExpanded, setExercisesExpanded, hasMore }) {
  const [panel, setPanel] = useState('photo'); // 'photo' | 'summary'
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);

  const PHOTO_STYLE = { left: '3%', width: '87%', borderRadius: '8px' };
  const SUMMARY_WIDTH = '85%';

  const photoOffset = panel === 'photo'
    ? dragOffset
    : dragOffset - (isDragging ? 0 : 0);
  const summaryOffset = panel === 'summary' ? dragOffset : 0;

  const slideX = panel === 'photo' ? dragOffset : `calc(-100% + ${dragOffset}px)`;
  const summarySlideX = panel === 'summary' ? dragOffset : `calc(100% + ${dragOffset}px)`;

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };
  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    touchCurrentX.current = e.touches[0].clientX;
    setDragOffset(dx);
  };
  const onTouchEnd = () => {
    const dx = touchCurrentX.current - touchStartX.current;
    setIsDragging(false);
    setDragOffset(0);
    touchStartX.current = null;
    if (Math.abs(dx) > 40) {
      if (dx < 0 && panel === 'photo') setPanel('summary');
      if (dx > 0 && panel === 'summary') setPanel('photo');
    }
  };

  const exRows = exercises ? (exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT_POST)) : [];

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: PANEL_HEIGHT }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}>

      {/* ── PHOTO PANEL ── */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          ...PHOTO_STYLE,
          overflow: 'hidden',
          transform: `translateX(${panel === 'photo' ? dragOffset : `calc(-110% + ${dragOffset}px)`})`,
          transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}>
        {photoUrl ? (
          <>
            <img src={photoUrl} alt="workout"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={onRemovePhoto}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white z-10">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Add photo slot */
          <button
            onClick={onPhotoClick}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}>
            {uploading
              ? <span className="text-slate-400 text-sm font-medium">Uploading...</span>
              : <>
                  <Camera className="w-7 h-7 text-slate-500" />
                  <span className="text-[12px] font-semibold text-slate-500">Add a photo</span>
                </>}
          </button>
        )}
      </div>

      {/* ── SUMMARY PANEL ── */}
      <div
        className="absolute top-0 bottom-0 overflow-y-auto"
        style={{
          left: '10%',
          width: SUMMARY_WIDTH,
          transform: `translateX(${panel === 'summary' ? dragOffset : `calc(110% + ${dragOffset}px)`})`,
          transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
          paddingTop: 4,
          paddingBottom: 4,
        }}>
        <div className="space-y-1 pr-1">
          {exRows.map((ex, idx) => {
            const exName = (ex.name || ex.exercise_name || ex.exercise || ex.title || '')
              .replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || `Exercise ${idx + 1}`;
            const { sets, reps, weight } = parseEx(ex);
            return (
              <div key={idx} className="bg-white/5 py-1 pl-1.5 rounded-lg border border-white/10 grid gap-0.5 items-center"
                style={{ gridTemplateColumns: '1fr 28px 10px 28px auto' }}>
                <div className="text-[11px] font-bold text-white leading-tight ml-0.5 truncate">{exName}</div>
                <div className="bg-white/10 text-slate-300 text-[11px] font-semibold text-center rounded-md py-0.5">{sets}</div>
                <div className="text-slate-500 text-[10px] font-bold text-center">×</div>
                <div className="bg-white/10 text-slate-300 text-[11px] font-semibold text-center rounded-md py-0.5">{reps}</div>
                <div className="ml-1 mr-1">
                  <div className="text-white text-[11px] font-black text-center rounded-lg py-0.5 px-1 min-w-[40px]"
                    style={{ background: 'linear-gradient(to right, rgba(29,78,216,0.9), rgba(30,58,138,0.9))' }}>
                    {weight}<span className="text-[8px]">kg</span>
                  </div>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button onClick={() => setExercisesExpanded(v => !v)}
              className="mt-1 w-full flex items-center justify-center py-0.5 text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronDown className={`w-4 h-4 transition-transform ${exercisesExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
// ── ADDED: gymName prop so it can be saved to the post ──
export default function ShareWorkoutScreen({ workoutName, exercises, previousExercises = [], currentUser, gymName, onContinue }) {
  const [phase, setPhase] = useState('reveal');
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const hasMore = exercises && exercises.length > PREVIEW_COUNT;

  const hasAnyIncrease = exercises?.some((ex, i) => {
    const prev = previousExercises?.[i];
    if (!prev) return false;
    const { weight, reps } = parseEx(ex);
    const { weight: pw, reps: pr } = parseEx(prev);
    return parseFloat(weight) > parseFloat(pw) || parseFloat(reps) > parseFloat(pr);
  });

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('animating'), 1100);
    const animDuration = hasAnyIncrease ? 1400 : 400;
    const t2 = setTimeout(() => setPhase('collapsing'), 1100 + animDuration);
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
      const content = comment ? comment.trim() : null;

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
        // ── ADDED: save the gym name so PostCard can display it ──
        gym_name: gymName || null,
      });

      toast.success('Workout shared with your friends! 🔥');
      onContinue();
    } catch { toast.error('Failed to share workout'); }
    finally { setSharing(false); }
  };

  const visibleExercises = exercises
    ? (exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT))
    : [];

  const animDelayFor = (idx) => idx * 120;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-6">

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

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-5">
              <h3 className="text-2xl font-black text-white mb-1">{workoutName}</h3>
              {gymName && (
                <p className="text-[12px] text-blue-400 font-medium">{gymName}</p>
              )}
              {hasAnyIncrease && phase === 'animating' && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 text-xs font-bold uppercase tracking-widest mt-1">
                  🔥 New personal bests!
                </motion.p>
              )}
            </motion.div>

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

      <AnimatePresence>
        {phase === 'share' && (() => {
          const PANEL_HEIGHT = 'min(71vw, 315px)';
          const PREVIEW_COUNT_POST = 8;
          const totalSets = exercises?.reduce((acc, ex) => acc + (parseFloat(parseEx(ex).sets) || 0), 0) || 0;
          const totalVol = exercises?.reduce((acc, ex) => {
            const { sets: s, reps: r, weight: w } = parseEx(ex);
            return acc + (parseFloat(s)||0) * (parseFloat(r)||0) * (parseFloat(w)||0);
          }, 0) || 0;
          const volumeStr = totalVol > 0 ? `${Math.round(totalVol).toLocaleString()} kg` : '—';

          return (
            <motion.div
              key="share-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center">

              <div className="w-full flex flex-col items-center overflow-y-auto max-h-[85vh] pb-4">

                {/* ── POST CARD PREVIEW ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
                  className="w-full max-w-sm mb-5 overflow-hidden shadow-2xl shadow-black/40 rounded-xl relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}>

                  {/* Top shine */}
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
                    style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
                  {/* Glow blob */}
                  <div className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.18) 0%, transparent 60%)' }} />

                  {/* ── TOP BAR: workout name + stat row ── */}
                  <div className="relative z-10 px-4 pt-3.5 pb-3">
                    <p className="text-[15px] font-black text-white leading-tight mb-3" style={{ letterSpacing: '-0.01em' }}>{workoutName}</p>

                    {/* Stat row — 3 columns */}
                    <div className="flex" style={{ borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {[
                        { label: 'Exercises', value: exercises?.length > 0 ? exercises.length : '—' },
                        { label: 'Sets', value: totalSets > 0 ? totalSets : '—' },
                        { label: 'Volume', value: volumeStr },
                      ].map((stat, i, arr) => (
                        <div key={stat.label} className="flex-1 flex flex-col items-center py-2" style={{
                          borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.10)' : 'none'
                        }}>
                          <span className="text-[13px] font-black text-white leading-none">{stat.value}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SWIPEABLE PANEL AREA ── */}
                  <SwipeablePanels
                    photoUrl={photoUrl}
                    uploading={uploading}
                    onPhotoClick={() => fileInputRef.current?.click()}
                    onRemovePhoto={() => setPhotoUrl(null)}
                    exercises={exercises}
                    PANEL_HEIGHT={PANEL_HEIGHT}
                    PREVIEW_COUNT_POST={PREVIEW_COUNT_POST}
                    exercisesExpanded={exercisesExpanded}
                    setExercisesExpanded={setExercisesExpanded}
                    hasMore={hasMore}
                  />

                  {/* ── COMMENT INPUT ── */}
                  <div className="relative z-10 px-4 pt-3 pb-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a caption… (optional)"
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-blue-400/50 transition-colors"
                    />
                  </div>
                </motion.div>

                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
              </div>

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
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}