import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, X, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
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

// ─── Swipeable photo/summary panels ─────────────────────────────────────────
function SwipeablePanels({ photoUrl, uploading, onPhotoClick, onRemovePhoto, exercises, PANEL_HEIGHT, PREVIEW_COUNT_POST, exercisesExpanded, setExercisesExpanded }) {
  const [slide, setSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const SUMMARY_WIDTH = '85%';

  const exRows = exercises ? (exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT_POST)) : [];
  const hasMore = exercises && exercises.length > PREVIEW_COUNT_POST;

  const exerciseSummaryJSX = (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="px-2 pt-2 pb-1 flex-1 min-h-0 flex flex-col">
        <div className="grid gap-0.5 mb-1 items-end px-1 flex-shrink-0"
          style={{ gridTemplateColumns: '1fr 28px 10px 28px auto' }}>
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center" style={{ marginLeft: -20 }}>Sets</div>
          <div />
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center" style={{ marginLeft: -22 }}>Reps</div>
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest" style={{ paddingLeft: 6 }}>Weight</div>
        </div>
        <div className="space-y-1 flex-1 overflow-hidden">
          {exRows.map((ex, idx) => {
            const exName = (ex.name || ex.exercise_name || ex.exercise || ex.title || ex.label || ex.movement || '')
              .replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || `Exercise ${idx + 1}`;
            const sets = ex.sets || ex.set_count || ex.setsReps?.split('x')?.[0] || '-';
            const reps = ex.reps || ex.rep_count || ex.setsReps?.split('x')?.[1] || '-';
            const weight = ex.weight ?? ex.weight_kg ?? ex.weight_lbs ?? '-';
            return (
              <div key={idx} className="bg-white/5 py-1 pl-1.5 rounded-lg border border-white/10 grid gap-0.5 items-center"
                style={{ gridTemplateColumns: '1fr 28px 10px 28px auto' }}>
                <div className="text-[11px] font-bold text-white leading-tight ml-0.5 truncate">{exName}</div>
                <div className="bg-white/10 text-slate-300 text-[11px] font-semibold text-center rounded-md flex items-center justify-center ml-0.5 py-0.5" style={{ width: 28 }}>{sets}</div>
                <div className="text-slate-400 text-[10px] font-bold flex items-center justify-center">×</div>
                <div className="bg-white/10 text-slate-300 text-[11px] font-semibold text-center rounded-md flex items-center justify-center py-0.5" style={{ width: 28 }}>{reps}</div>
                <div className="ml-1.5 pr-2">
                  <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white py-0.5 px-1 text-[11px] font-black text-center rounded-xl shadow-sm shadow-blue-900/20 min-w-[42px]">
                    {weight}<span className="text-[9px] font-bold">kg</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {hasMore && (
          <button onClick={() => setExercisesExpanded(v => !v)}
            className="mt-1 w-full flex items-center justify-center gap-1 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
            {exercisesExpanded
              ? <><ChevronUp className="w-3 h-3" /> Show less</>
              : <><ChevronDown className="w-3 h-3" /> +{exercises.length - PREVIEW_COUNT_POST} more</>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: PANEL_HEIGHT }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(false);
        setDragOffset(0);
      }}
      onTouchMove={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.touches[0].clientY - (touchStartY.current || 0));
        if (Math.abs(dx) > dy) {
          setIsDragging(true);
          const maxDrag = slide === 0 ? 0 : window.innerWidth * 0.9;
          const minDrag = slide === 0 ? -window.innerWidth * 0.9 : 0;
          setDragOffset(Math.max(minDrag, Math.min(maxDrag, dx)));
        }
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current || 0));
        if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
          setSlide(dx < 0 ? 1 : 0);
        }
        touchStartX.current = null;
        touchStartY.current = null;
        setIsDragging(false);
        setDragOffset(0);
      }}>

      {/* ── PHOTO PANEL ── */}
      <div
        className="absolute top-0 h-full overflow-hidden"
        style={{
          left: '7.5%', width: '78%', borderRadius: '8px',
          transform: `translateX(${isDragging ? `calc(${slide === 0 ? '0%' : '-100%'} + ${dragOffset}px)` : slide === 0 ? '0%' : '-100%'})`,
          transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
        {photoUrl ? (
          <>
            <img src={photoUrl} alt="workout"
              style={{ position: 'absolute', left: 0, right: 0, width: '100%', height: '143%', top: '-21.5%', objectFit: 'cover', objectPosition: 'center center' }} />
            <button onClick={onRemovePhoto}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white z-10">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onPhotoClick}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-colors"
            style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.18)', borderRadius: '10px' }}>
            {uploading
              ? <span className="text-slate-400 text-sm font-medium">Uploading...</span>
              : <>
                  <Camera className="w-6 h-6 text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-500">Add a photo</span>
                </>}
          </button>
        )}
      </div>

      {/* ── SUMMARY PANEL — peeking from right ── */}
      <div
        className="absolute top-0 h-full overflow-hidden"
        style={{
          width: SUMMARY_WIDTH, left: '10%',
          transform: `translateX(${isDragging ? `calc(${slide === 0 ? '100%' : '0%'} + ${dragOffset}px)` : slide === 0 ? '92%' : '0%'})`,
          transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
        {exerciseSummaryJSX}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ShareWorkoutScreen({ workoutName, exercises, previousExercises = [], currentUser, gymName, gymId, onContinue, durationMinutes }) {
  const [comment, setComment] = useState('');
  const [postTitle, setPostTitle] = useState(workoutName || '');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const [shareWithCommunity, setShareWithCommunity] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPostTitle(workoutName || '');
  }, [workoutName]);

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
    if (!currentUser?.id) {
      toast.error('Could not identify your account — please refresh and try again');
      return;
    }
    setSharing(true);
    try {
      const content = comment ? comment.trim() : '';
      const totalVolume = exercises?.reduce((acc, ex) => {
        const s = parseFloat(ex.sets) || 0;
        const r = parseFloat(ex.reps || ex.setsReps?.split('x')?.[1]) || 0;
        const w = parseFloat(ex.weight) || 0;
        return acc + s * r * w;
      }, 0);
      const volumeStr = totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()} kg` : null;

      const res = await base44.functions.invoke('createPost', {
        content,
        image_url: photoUrl || null,
        video_url: null,
        allow_gym_repost: false,
        share_with_community: shareWithCommunity,
        workout_name: postTitle.trim() || workoutName || null,
        workout_exercises: (exercises || []).map(ex => {
          const rawName = ex.name || ex.title || ex.exercise_name || ex.exercise || '';
          const displayName = rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const { sets, reps, weight } = parseEx(ex);
          return { name: displayName || 'Exercise', sets, reps, weight };
        }),
        workout_duration: durationMinutes > 0 ? `${durationMinutes}m` : null,
        workout_volume: volumeStr,
        gym_id: gymId || null,
        gym_name: gymName || null,
      });
      if (res?.error) throw new Error(res.error);

      toast.success('Workout shared with your friends! 🔥');
      queryClient.invalidateQueries({ queryKey: ['friendPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      onContinue();
    } catch (err) {
      console.error('[ShareWorkout] failed:', err);
      toast.error('Failed to share workout — ' + (err?.message || 'unknown error'));
    }
    finally { setSharing(false); }
  };

  const PANEL_HEIGHT = 'min(71vw, 315px)';
  const PREVIEW_COUNT_POST = 8;

  const durationStr = durationMinutes > 0 ? `${durationMinutes}m` : '—';
  const totalVol = exercises?.reduce((acc, ex) => {
    const { sets: s, reps: r, weight: w } = parseEx(ex);
    return acc + (parseFloat(s)||0) * (parseFloat(r)||0) * (parseFloat(w)||0);
  }, 0) || 0;
  const volumeStr = totalVol > 0 ? `${Math.round(totalVol).toLocaleString()} kg` : '—';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-6"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

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

          <div className="relative z-10 px-4 pt-3.5 pb-3">

            {/* Editable title */}
            <div className="relative mb-3">
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value.slice(0, 60))}
                maxLength={60}
                className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-white text-lg font-black placeholder-slate-500 focus:outline-none focus:border-white/25 transition-colors tracking-tight"
                style={{ letterSpacing: '-0.02em' }}
                placeholder="Workout title…"
              />
              {postTitle.length >= 50 && (
                <span className="absolute bottom-2 right-3 text-[10px] font-medium text-orange-400">
                  {postTitle.length}/60
                </span>
              )}
            </div>

            {/* Stat row */}
            <div className="flex items-center mb-3">
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-black text-white leading-tight">{exercises?.length > 0 ? exercises.length : '—'}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Exercises</span>
              </div>
              <div className="w-px self-stretch bg-white/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-black text-white leading-tight">{durationStr}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Duration</span>
              </div>
              <div className="w-px self-stretch bg-white/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm font-black text-white leading-tight">{volumeStr}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Volume</span>
              </div>
            </div>

            {/* Caption */}
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                placeholder="How did it go? Share your highlights!"
                rows={2}
                maxLength={200}
                className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-white/25 transition-colors"
              />
              <span className={`absolute bottom-2 right-3 text-[10px] font-medium ${comment.length >= 180 ? 'text-orange-400' : 'text-slate-600'}`}>
                {comment.length}/200
              </span>
            </div>
          </div>

          {/* Swipeable panels */}
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
          />
        </motion.div>

        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
      </div>

      {/* Share with community toggle */}
      <div className="w-full max-w-sm flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-300">Share with community</span>
        </div>
        <button
          onClick={() => setShareWithCommunity(!shareWithCommunity)}
          style={{
            width: 44,
            height: 28,
            position: 'relative',
            borderRadius: 14,
            background: shareWithCommunity ? '#3b82f6' : 'rgba(100,116,139,0.4)',
            transition: 'background 0.2s ease',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}>
          <div
            style={{
              position: 'absolute',
              top: 2,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              left: shareWithCommunity ? 18 : 2,
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Buttons */}
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
}