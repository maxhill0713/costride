import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, X, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ShareWorkoutScreen({ workoutName, exercises, currentUser, onContinue }) {
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      // Build structured exercise list
      const structuredExercises = (exercises || []).map(ex => {
        const exName = ex.exercise || ex.name || ex.title || 'Exercise';
        let sets = ex.sets || ex.set_count || '-';
        let reps = ex.reps || ex.rep_count || '-';
        if ((sets === '-' || reps === '-') && (ex.setsReps || ex.sets_reps)) {
          const parts = String(ex.setsReps || ex.sets_reps).toLowerCase().split(/\s*x\s*/);
          if (sets === '-') sets = parts[0] || '-';
          if (reps === '-') reps = parts[1] || '-';
        }
        if (sets === '-' && ex.logged_sets?.length) sets = String(ex.logged_sets.length);
        if (reps === '-' && ex.logged_sets?.[0]?.reps) reps = String(ex.logged_sets[0].reps);
        const weight = String(ex.weight_kg ?? ex.weight_lbs ?? ex.weight ?? ex.logged_sets?.[0]?.weight ?? '-');
        return { name: exName, sets: String(sets), reps: String(reps), weight };
      });

      // Compute total volume
      let totalVolumeKg = 0;
      structuredExercises.forEach(ex => {
        const s = parseFloat(ex.sets) || 0;
        const r = parseFloat(ex.reps) || 0;
        const w = parseFloat(ex.weight) || 0;
        totalVolumeKg += s * r * w;
      });
      const volumeStr = totalVolumeKg > 0 ? `${Math.round(totalVolumeKg).toLocaleString()} kg` : null;

      const content = comment?.trim() || `💪 Just finished ${workoutName}!`;

      await base44.entities.Post.create({
        member_id: currentUser.id,
        member_name: currentUser.full_name,
        member_avatar: currentUser.avatar_url || '',
        content,
        image_url: photoUrl || null,
        video_url: null,
        workout_name: workoutName,
        workout_exercises: structuredExercises,
        workout_volume: volumeStr,
        workout_duration: null,
        likes: 0,
        comments: [],
        reactions: {},
        is_system_generated: false,
      });

      toast.success('Workout shared with your friends! 🔥');
      onContinue();
    } catch (err) {
      toast.error('Failed to share workout');
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col"
    >
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start pt-10 px-6 pb-4">

        {/* ── Workout summary card — matches Home page View Summary modal style ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
          className="w-full max-w-sm bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 p-6 mb-5"
        >
          {/* Workout name */}
          <div className="mb-5">
            <h3 className="text-2xl font-black text-white mb-1">{workoutName}</h3>
          </div>

          {/* Photo preview */}
          {photoUrl && (
            <div className="relative mb-4 rounded-xl overflow-hidden">
              <img src={photoUrl} alt="workout" className="w-full h-40 object-cover" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Exercises table — same as View Summary modal */}
          {exercises && exercises.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Exercises</p>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
                <div />
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
              </div>

              <div className="space-y-2 -mx-2">
                {exercises.map((ex, idx) => {
                  const exName = ex.exercise || ex.name || ex.title || `Exercise ${idx + 1}`;

                  // Parse sets/reps — support both separate fields and combined setsReps
                  let sets = '-', reps = '-';
                  if (ex.sets) sets = ex.sets;
                  else if (ex.set_count) sets = ex.set_count;
                  else if (ex.setsReps || ex.sets_reps) {
                    const parts = String(ex.setsReps || ex.sets_reps).toLowerCase().split(/\s*x\s*/);
                    sets = parts[0] || '-';
                  } else if (ex.logged_sets?.length) sets = ex.logged_sets.length;

                  if (ex.reps) reps = ex.reps;
                  else if (ex.rep_count) reps = ex.rep_count;
                  else if (ex.setsReps || ex.sets_reps) {
                    const parts = String(ex.setsReps || ex.sets_reps).toLowerCase().split(/\s*x\s*/);
                    reps = parts[1] || '-';
                  } else if (ex.logged_sets?.[0]?.reps) reps = ex.logged_sets[0].reps;

                  const weight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight ?? ex.logged_sets?.[0]?.weight ?? '-';

                  return (
                    <div key={idx} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
                      <div className="text-sm font-bold text-white leading-tight ml-1">{exName}</div>
                      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: '36px' }}>
                        {sets}
                      </div>
                      <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
                      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                        {reps}
                      </div>
                      <div className="ml-3 pr-3">
                        <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                          {weight}<span className="text-[10px] font-bold">kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Comment input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-sm mb-4"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment about your workout… (optional)"
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-blue-400 transition-colors"
          />
        </motion.div>

        {/* Photo upload */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm mb-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/30 text-slate-300 hover:border-white/50 hover:text-white transition-all text-sm font-medium"
          >
            {uploading ? (
              <span className="text-slate-400">Uploading...</span>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                {photoUrl ? 'Change photo' : 'Add a photo (optional)'}
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Bottom buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="px-6 pb-10 pt-3 flex flex-col gap-3 max-w-sm mx-auto w-full"
      >
        {/* Share button — icon removed */}
        <Button
          onClick={handleShare}
          disabled={sharing}
          className="w-full h-13 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white font-black text-base rounded-2xl shadow-[0_4px_0_0_#c2410c,0_8px_20px_rgba(234,88,12,0.4)] active:shadow-none active:translate-y-[4px] active:scale-95 transition-all duration-100 border border-transparent flex items-center justify-center"
        >
          {sharing ? 'Sharing...' : 'Share Workout'}
        </Button>

        {/* Continue button — chevron removed */}
        <Button
          onClick={onContinue}
          variant="ghost"
          className="w-full h-12 text-slate-400 hover:text-white font-semibold text-base rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}