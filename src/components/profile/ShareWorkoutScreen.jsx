import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, X, Share2, ChevronRight } from 'lucide-react';
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
      // Build exercise summary for post content
      const exerciseSummary = exercises
        ?.map(ex => `${ex.exercise || ex.name}  ${ex.setsReps || ''}  ${ex.weight ? ex.weight + 'kg' : ''}`.trim())
        .filter(Boolean)
        .join('\n') || '';

      const content = [
        `💪 Just finished ${workoutName}!`,
        comment ? `\n${comment}` : '',
        exerciseSummary ? `\n\n${exerciseSummary}` : ''
      ].join('').trim();

      await base44.entities.Post.create({
        member_id: currentUser.id,
        member_name: currentUser.full_name,
        member_avatar: currentUser.avatar_url || '',
        content,
        image_url: photoUrl || null,
        video_url: null,
        likes: 0,
        comments: [],
        reactions: {},
        is_system_generated: false,
        allow_gym_repost: false
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

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-6"
        >
          <p className="text-3xl font-black text-white mb-1">Share Workout</p>
          <p className="text-slate-400 text-sm font-medium">Let your friends see how you crushed it</p>
        </motion.div>

        {/* Workout card preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, type: 'spring' }}
          className="w-full max-w-sm bg-white/8 border border-white/15 rounded-2xl p-4 mb-5 backdrop-blur-sm"
        >
          <p className="text-orange-300 font-black text-base mb-3 tracking-tight">{workoutName}</p>

          {/* Photo preview */}
          {photoUrl && (
            <div className="relative mb-3 rounded-xl overflow-hidden">
              <img src={photoUrl} alt="workout" className="w-full h-40 object-cover" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Exercises */}
          {exercises && exercises.length > 0 && (
            <div className="space-y-1.5">
              {exercises.map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/8 last:border-0">
                  <span className="text-white font-semibold text-sm">{ex.exercise || ex.name || '-'}</span>
                  <span className="text-slate-300 text-xs font-medium">
                    {[ex.setsReps, ex.weight ? ex.weight + 'kg' : null].filter(Boolean).join('  ·  ')}
                  </span>
                </div>
              ))}
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
        <Button
          onClick={handleShare}
          disabled={sharing}
          className="w-full h-13 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white font-black text-base rounded-2xl shadow-[0_4px_0_0_#c2410c,0_8px_20px_rgba(234,88,12,0.4)] active:shadow-none active:translate-y-[4px] active:scale-95 transition-all duration-100 border border-transparent flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {sharing ? 'Sharing...' : 'Share Workout'}
        </Button>

        <Button
          onClick={onContinue}
          variant="ghost"
          className="w-full h-12 text-slate-400 hover:text-white font-semibold text-base rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}