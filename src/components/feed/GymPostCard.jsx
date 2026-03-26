import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, MoreHorizontal, Send, Flame, ChevronDown, ChevronUp, Clock, Dumbbell, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const REACTIONS = ['💪', '🔥', '👏', '💯', '⚡'];

// ── Exercise row — matches View Summary modal style ──────────────────────────
function ExerciseRow({ ex, idx }) {
  const exName = ex.name || ex.exercise || ex.title || `Exercise ${idx + 1}`;
  const sets = ex.sets ?? '-';
  const reps = ex.reps ?? '-';
  const weight = ex.weight ?? '-';

  return (
    <div className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
      <div className="text-sm font-bold text-white leading-tight ml-1 truncate">{exName}</div>
      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: 36 }}>
        {sets}
      </div>
      <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
      <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: 36 }}>
        {reps}
      </div>
      <div className="ml-3 pr-3">
        <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
          {weight}<span className="text-[10px] font-bold">kg</span>
        </div>
      </div>
    </div>
  );
}

// ── Share menu ───────────────────────────────────────────────────────────────
function ShareMenu({ gym, post, onClose }) {
  const shareUrl = window.location.href;
  const shareText = `Check out this post from ${post.member_name} at ${gym?.name || 'the gym'}!`;
  const handle = async (method) => {
    switch (method) {
      case 'copy': await navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); break;
      case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank'); break;
    }
    onClose();
  };
  return (
    <div className="absolute top-full left-0 mt-2 p-3 bg-blue-950/95 backdrop-blur-xl rounded-xl shadow-2xl border border-blue-800/50 z-50 min-w-[160px]">
      {[['copy', 'Copy Link'], ['whatsapp', 'WhatsApp'], ['twitter', 'Twitter']].map(([m, l]) => (
        <button key={m} onClick={() => handle(m)} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-900/50 rounded-lg transition-colors">{l}</button>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
function GymPostCard({ post, gym, onDelete = null, isOwner = false }) {
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImageUrl, setEditImageUrl] = useState(post.image_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const reactions = post.reactions || {};
  const userReaction = currentUser ? reactions[currentUser.id] : null;
  const isLiked = !!userReaction;
  const totalReactions = Object.keys(reactions).length;

  const reactionMutation = useMutation({
    mutationFn: ({ postId, emoji }) => {
      const r = { ...reactions };
      const uid = currentUser?.id;
      if (r[uid] === emoji) delete r[uid]; else r[uid] = emoji;
      return base44.entities.Post.update(postId, { reactions: r });
    },
    onMutate: async ({ postId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const prev = queryClient.getQueryData(['posts']);
      queryClient.setQueryData(['posts'], (old = []) => old.map(p => {
        if (p.id !== postId) return p;
        const r = { ...(p.reactions || {}) };
        const uid = currentUser?.id;
        if (r[uid] === emoji) delete r[uid]; else r[uid] = emoji;
        return { ...p, reactions: r };
      }));
      setShowReactions(false);
      return { prev };
    },
    onError: (_, __, ctx) => queryClient.setQueryData(['posts'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const updatePostMutation = useMutation({
    mutationFn: () => base44.entities.Post.update(post.id, { content: editContent, image_url: editImageUrl || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['posts'] }); setShowEditModal(false); toast.success('Post updated'); },
    onError: () => toast.error('Failed to update post'),
  });

  const deletePostMutation = useMutation({
    mutationFn: () => base44.entities.Post.delete(post.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['posts'] }); toast.success('Post deleted'); },
    onError: () => toast.error('Failed to delete post'),
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setEditImageUrl(file_url); toast.success('Image uploaded'); }
    catch { toast.error('Failed to upload image'); }
    finally { setIsUploading(false); }
  };

  const isGymOwner = currentUser && gym && currentUser.email === gym.owner_email;
  const isWorkoutPost = !!post.workout_name;
  const exercises = post.workout_exercises || [];
  const PREVIEW_COUNT = 3;

  // ── Workout post (Strava-style) ──────────────────────────────────────────
  if (isWorkoutPost) {
    return (
      <Card className="bg-gradient-to-br from-blue-950/90 via-slate-950/95 to-blue-950/90 backdrop-blur-xl border border-white/5 overflow-hidden shadow-2xl w-full max-w-lg mx-auto">

        {/* Header: avatar + name + date */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                {post.member_avatar
                  ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
                  : <span className="text-xs font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase() || 'G'}</span>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{post.member_name}</h3>
              <p className="text-[11px] text-slate-400">{format(new Date(post.created_date), 'MMM d · h:mm a')}</p>
            </div>
          </div>
          {isGymOwner && (
            <button onClick={() => setShowEditModal(true)} className="text-slate-500 hover:text-white p-1.5">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Workout title — centred */}
        <div className="px-4 pb-3 text-center">
          <p className="text-xl font-black text-white tracking-tight">{post.workout_name}</p>
        </div>

        {/* Stats row: duration · exercises · volume */}
        <div className="flex items-center justify-center gap-5 px-4 pb-3">
          {post.workout_duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-bold text-slate-300">{post.workout_duration}</span>
            </div>
          )}
          {exercises.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-slate-300">{exercises.length} exercises</span>
            </div>
          )}
          {post.workout_volume && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-slate-300">{post.workout_volume}</span>
            </div>
          )}
        </div>

        {/* Comment (if any) */}
        {post.content && !post.content.startsWith('💪 Just finished') && (
          <div className="px-4 pb-3">
            <p className="text-sm text-slate-300 leading-relaxed italic">"{post.content}"</p>
          </div>
        )}

        {/* Image — edge-to-edge, cropped top+bottom 15% */}
        {post.image_url && (
          <div className="relative w-full overflow-hidden" style={{ height: '56vw', maxHeight: 340 }}>
            <img
              src={post.image_url}
              alt="workout"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 50%' }}
            />
            {/* Gradient overlays to create the cropped feel */}
            <div className="absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-slate-950 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-slate-950 to-transparent" />

            {/* Reaction button overlaid bottom-left */}
            {currentUser && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <button
                  onClick={() => reactionMutation.mutate({ postId: post.id, emoji: '🔥' })}
                  className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1.5 transition-transform active:scale-90"
                >
                  <Flame className={`w-5 h-5 ${isLiked ? 'fill-orange-500 text-orange-500' : 'text-white'} transition-colors`} />
                  {totalReactions > 0 && <span className="text-xs font-bold text-white">{totalReactions}</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* If no image, show standalone reaction button */}
        {!post.image_url && currentUser && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <button
              onClick={() => reactionMutation.mutate({ postId: post.id, emoji: '🔥' })}
              className="flex items-center gap-1 transition-transform active:scale-90"
            >
              <Flame className={`w-6 h-6 ${isLiked ? 'fill-orange-500 text-orange-500' : 'text-white'} transition-colors`} />
              {totalReactions > 0 && <span className="text-xs font-bold text-slate-300">{totalReactions}</span>}
            </button>
          </div>
        )}

        {/* Exercise breakdown */}
        {exercises.length > 0 && (
          <div className="px-3 pt-3 pb-2">
            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1 items-end px-1">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Exercise</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Sets</div>
                <div />
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Reps</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-3">Weight</div>
              </div>
              {(exercisesExpanded ? exercises : exercises.slice(0, PREVIEW_COUNT)).map((ex, idx) => (
                <ExerciseRow key={idx} ex={ex} idx={idx} />
              ))}
            </div>

            {exercises.length > PREVIEW_COUNT && (
              <button
                onClick={() => setExercisesExpanded(v => !v)}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                {exercisesExpanded ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> +{exercises.length - PREVIEW_COUNT} more exercises</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Bottom: share button */}
        {currentUser && (
          <div className="px-4 pb-3 pt-1 flex items-center gap-2 border-t border-white/5 mt-1 relative">
            <div className="relative">
              <button onClick={() => setShowShareMenu(v => !v)} className="transition-transform active:scale-90">
                <Send className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
              </button>
              {showShareMenu && <ShareMenu gym={gym} post={post} onClose={() => setShowShareMenu(false)} />}
            </div>
          </div>
        )}

        {/* Edit modal */}
        <EditModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          editContent={editContent}
          setEditContent={setEditContent}
          editImageUrl={editImageUrl}
          setEditImageUrl={setEditImageUrl}
          isUploading={isUploading}
          handleImageUpload={handleImageUpload}
          onSave={() => updatePostMutation.mutate()}
          onDelete={() => { if (window.confirm('Delete this post?')) { deletePostMutation.mutate(); setShowEditModal(false); } }}
          isSaving={updatePostMutation.isPending}
          isDeleting={deletePostMutation.isPending}
          isGymOwner={isGymOwner}
        />
      </Card>
    );
  }

  // ── Standard post (unchanged layout) ────────────────────────────────────
  const isTextOnly = !post.video_url && !post.image_url;

  return (
    <Card className="bg-gradient-to-br from-blue-950/90 via-slate-950/95 to-blue-950/90 backdrop-blur-xl border border-white/5 overflow-hidden shadow-2xl w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {post.member_avatar
                ? <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{post.member_name?.charAt(0)?.toUpperCase() || 'G'}</span>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{post.member_name}</h3>
            <p className="text-[11px] text-slate-400">{format(new Date(post.created_date), 'MMM d')}</p>
          </div>
        </div>
        {isGymOwner && (
          <button onClick={() => setShowEditModal(true)} className="text-white hover:text-slate-300 p-2">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>

      {isTextOnly ? (
        <>
          <div className="px-4 py-3">
            <p className="text-sm text-white leading-relaxed">{post.content}</p>
          </div>
          <div className="border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-1.5">
              {currentUser && (
                <>
                  <button onClick={() => reactionMutation.mutate({ postId: post.id, emoji: '🔥' })} className="transition-transform active:scale-90">
                    <Flame className={`w-6 h-6 ${isLiked ? 'fill-orange-500 text-orange-500' : 'text-white'} transition-colors`} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowShareMenu(!showShareMenu)} className="transition-transform active:scale-90">
                      <Send className="w-5 h-5 text-white" />
                    </button>
                    {showShareMenu && <ShareMenu gym={gym} post={post} onClose={() => setShowShareMenu(false)} />}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-full bg-black overflow-hidden">
            {post.video_url
              ? <video src={post.video_url} controls className="w-full h-auto aspect-square object-cover" />
              : <img src={post.image_url} alt="Post" className="w-full h-auto aspect-square object-cover" />}
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5">
            {currentUser && (
              <>
                <button onClick={() => reactionMutation.mutate({ postId: post.id, emoji: '🔥' })} className="transition-transform active:scale-90">
                  <Flame className={`w-6 h-6 ${isLiked ? 'fill-orange-500 text-orange-500' : 'text-white'} transition-colors`} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowShareMenu(!showShareMenu)} className="transition-transform active:scale-90">
                    <Send className="w-5 h-5 text-white" />
                  </button>
                  {showShareMenu && <ShareMenu gym={gym} post={post} onClose={() => setShowShareMenu(false)} />}
                </div>
              </>
            )}
          </div>
          <div className="px-3 pb-3">
            <p className="text-sm text-white leading-relaxed">
              <span className="font-semibold mr-1">{post.member_name}</span>
              {post.content}
            </p>
            {post.exercise && post.weight && (
              <p className="text-xs text-slate-400 mt-1.5">{post.exercise.replace('_', ' ')} • {post.weight} lbs</p>
            )}
          </div>
        </>
      )}

      <EditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        editContent={editContent}
        setEditContent={setEditContent}
        editImageUrl={editImageUrl}
        setEditImageUrl={setEditImageUrl}
        isUploading={isUploading}
        handleImageUpload={handleImageUpload}
        onSave={() => updatePostMutation.mutate()}
        onDelete={() => { if (window.confirm('Delete this post?')) { deletePostMutation.mutate(); setShowEditModal(false); } }}
        isSaving={updatePostMutation.isPending}
        isDeleting={deletePostMutation.isPending}
        isGymOwner={isGymOwner}
      />
    </Card>
  );
}

// ── Edit modal (shared) ──────────────────────────────────────────────────────
function EditModal({ open, onClose, editContent, setEditContent, editImageUrl, setEditImageUrl, isUploading, handleImageUpload, onSave, onDelete, isSaving, isDeleting, isGymOwner }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Content</Label>
            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Share an update…" className="rounded-2xl min-h-32" />
          </div>
          <div>
            <Label>Image (Optional)</Label>
            <div className="flex gap-2">
              <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="rounded-2xl" />
              {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            {editImageUrl && <img src={editImageUrl} alt="Preview" className="w-full h-40 object-cover rounded-2xl mt-2" />}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button onClick={onSave} disabled={isSaving || !editContent?.trim()} className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-2xl">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
            {isGymOwner && (
              <Button variant="outline" onClick={onDelete} disabled={isDeleting} className="rounded-2xl border-red-500 text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(GymPostCard);