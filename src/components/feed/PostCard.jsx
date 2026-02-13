import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal, Trash2, Flame, Star } from 'lucide-react';
import { format } from 'date-fns';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function PostCard({ post, onLike, onComment, onSave, onDelete }) {
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFavouriteConfirm, setShowFavouriteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', currentUser?.id],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser.id }),
    enabled: !!currentUser
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Post.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
      if (onDelete) onDelete(post.id);
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (data.is_favourite && !post.is_favourite) {
        const favouriteCount = userPosts.filter(p => p.is_favourite).length;
        if (favouriteCount >= 3) {
          throw new Error('You can only have 3 favourite posts');
        }
      }
      return base44.entities.Post.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      toast.success(post.is_favourite ? 'Removed from favourites' : 'Added to favourites');
    },
    onError: (error) => {
      if (error.message === 'You can only have 3 favourite posts') {
        toast.error('You can only have 3 favourite posts');
      } else {
        toast.error('Failed to update post');
      }
    }
  });

  const isOwner = currentUser?.id === post.member_id;
  const isNudgePost = post.exercise === 'workout_completion_nudge';
  const isWeightIncreasePost = post.content?.includes('increased their weight');
  const isGymJoinPost = post.gym_join === true;

  const userStreakVariant = useMemo(() => currentUser?.streak_variant || 'default', [currentUser?.streak_variant]);
  const hasReacted = useMemo(() => post.reactions && post.reactions[currentUser?.id], [post.reactions, currentUser?.id]);

  const getStreakIcon = (variant) => {
    switch (variant) {
      case 'sunglasses':
        return '😎';
      case 'cowboy':
        return '🤠';
      default:
        return '🔥';
    }
  };

  const reactMutation = useMutation({
    mutationFn: async (isReacting) => {
      const updatedReactions = { ...post.reactions };
      if (isReacting) {
        updatedReactions[currentUser.id] = userStreakVariant;
      } else {
        delete updatedReactions[currentUser.id];
      }
      await base44.entities.Post.update(post.id, { reactions: updatedReactions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      toast.error('Failed to react to post');
    }
  });

  const nudgeMutation = useMutation({
    mutationFn: async () => {
      // Get user's friends
      const friends = await base44.entities.Friend.filter({
        user_id: currentUser.id,
        status: 'accepted'
      });

      const todayDate = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      // Check each friend
      for (const friend of friends) {
        // Get friend's user data
        const friendUser = await base44.entities.User.filter({ id: friend.friend_id });
        if (!friendUser.length) continue;

        const friendData = friendUser[0];

        // Check if friend has a rest day (no exercises scheduled)
        const trainingDays = friendData.training_days || [];
        const isRestDay = !trainingDays.includes(adjustedDay);
        const hasNoExercises = !friendData.custom_workout_types?.[adjustedDay]?.exercises?.length;

        if (isRestDay || hasNoExercises) continue; // Skip friends on rest days

        // Check if friend already logged workout today
        const friendWorkouts = await base44.entities.WorkoutLog.filter({
          user_id: friend.friend_id,
          completed_date: todayDate
        });

        if (friendWorkouts.length === 0) {
          // Friend hasn't logged workout - send nudge
          await base44.entities.Post.create({
            member_id: friend.friend_id,
            member_name: friendData.full_name || friendData.username || 'User',
            member_avatar: friendData.avatar_url || '',
            content: `${currentUser.full_name || currentUser.username || 'User'} wants you to stop being lazy and get in the gym!`,
            likes: 0,
            comments: [],
            reactions: {}
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('Friends nudged!');
      queryClient.invalidateQueries(['posts']);
    },
    onError: () => {
      toast.error('Failed to nudge friends');
    }
  });

  const handleReact = () => {
    setReacted(!reacted);
    onLike(post.id, !reacted);
  };

  const handleSave = () => {
    setSaved(!saved);
    if (onSave) onSave(post.id, !saved);
  };

  const handleAddComment = (commentText) => {
    onComment(post.id, commentText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-xl mb-4 overflow-hidden relative shadow-2xl shadow-black/20"
    >
      {/* Header - Profile Picture Only */}
      <div className="absolute top-3 left-3 z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
          {post.member_avatar ? (
            <img src={post.member_avatar} alt={post.member_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white">
              {post.member_name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Delete Menu */}
      {isOwner && (
        <div className="absolute top-3 right-3 z-20">
          <div className="relative flex items-center gap-2">
            {post.is_favourite && (
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            )}
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-slate-300 hover:text-white"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-slate-800/80 border border-slate-700/40 rounded-lg shadow-lg z-20 backdrop-blur-sm">
                <button
                  onClick={() => {
                    setShowFavouriteConfirm(true);
                    setShowMenu(false);
                  }}
                  disabled={updatePostMutation.isPending}
                  className="flex items-center gap-2 w-full px-4 py-2 text-amber-400 hover:bg-amber-500/20 text-sm font-medium disabled:opacity-50"
                >
                  <Star className={`w-4 h-4 ${post.is_favourite ? 'fill-amber-400' : ''}`} />
                  {post.is_favourite ? 'Unfavourite' : 'Favourite'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-500/20 text-sm font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video or Image - Full Size */}
      <div className="relative w-full aspect-square bg-slate-800">
        {post.video_url ? (
          <video 
            src={post.video_url} 
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        ) : post.image_url ? (
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
        ) : null}
      </div>

      {/* Caption Section - Thin Block */}
      <div className="px-4 py-1 text-sm text-slate-200 relative pb-12">
       <p className="leading-snug">{post.content}</p>
       {post.weight && (
          <span className="block mt-1 text-blue-400 font-semibold">
            💪 {post.weight} lbs
          </span>
        )}
       {isNudgePost && isOwner && (
         <button
           onClick={() => nudgeMutation.mutate()}
           disabled={nudgeMutation.isPending}
           className="mt-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
         >
           {nudgeMutation.isPending ? 'Nudging...' : 'Nudge'}
         </button>
       )}

       {/* Reaction System for Weight Increases & Gym Joins */}
       {(isWeightIncreasePost || isGymJoinPost) && (
         <div className="absolute bottom-2 left-4 flex items-center gap-2">
           {/* Reaction Button */}
           <motion.button
             onClick={() => reactMutation.mutate(!hasReacted)}
             disabled={reactMutation.isPending}
             className={`relative w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all ${
               hasReacted ? 'bg-orange-100' : 'bg-gray-100 border-2 border-dashed border-gray-400'
             }`}
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.95 }}
           >
             {getStreakIcon(userStreakVariant)}
             {hasReacted && (
               <motion.div
                 layoutId={`reaction-check-${post.id}`}
                 className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 -z-10"
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
               />
             )}
           </motion.button>

           {/* Reaction Count & Avatars */}
           {Object.keys(post.reactions || {}).length > 0 && (
             <div className="flex items-center ml-2">
               <div className="flex relative h-8">
                 {Object.entries(post.reactions || {}).slice(0, 3).map(([userId, variant], idx) => (
                   <div
                     key={userId}
                     className="relative"
                     style={{ marginLeft: idx > 0 ? '-12px' : '0' }}
                   >
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-sm shadow-md border border-white">
                       {getStreakIcon(variant)}
                     </div>
                   </div>
                 ))}
               </div>
               {Object.keys(post.reactions || {}).length > 3 && (
                 <span className="ml-1 text-xs text-gray-600 font-semibold">
                   +{Object.keys(post.reactions).length - 3}
                 </span>
               )}
             </div>
           )}
         </div>
       )}
      </div>

      {/* Modals */}
      <CommentModal 
       open={showComments}
       onClose={() => setShowComments(false)}
       post={post}
       onAddComment={handleAddComment}
      />
      <ShareModal
       open={showShare}
       onClose={() => setShowShare(false)}
       post={post}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
       <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40">
         <AlertDialogHeader>
           <AlertDialogTitle className="text-white">Delete Post?</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-300">
             Are you sure you want to delete your post? This action cannot be undone.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <div className="flex gap-3 justify-center">
           <AlertDialogCancel className="bg-slate-800/60 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60">Cancel</AlertDialogCancel>
           <AlertDialogAction
             onClick={() => {
               deleteMutation.mutate();
               setShowDeleteConfirm(false);
             }}
             disabled={deleteMutation.isPending}
             className="bg-red-600/80 hover:bg-red-700/80 border border-red-500/30 text-white disabled:opacity-50"
           >
             {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
           </AlertDialogAction>
         </div>
       </AlertDialogContent>
      </AlertDialog>

      {/* Favourite Confirmation Dialog */}
      <AlertDialog open={showFavouriteConfirm} onOpenChange={setShowFavouriteConfirm}>
       <AlertDialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40">
         <AlertDialogHeader>
           <AlertDialogTitle className="text-white">{post.is_favourite ? 'Remove from Favourites?' : 'Add to Favourites?'}</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-300">
             {post.is_favourite 
               ? 'This post will no longer appear as your favourite on your profile.'
               : 'This post will appear as your favourite on your profile for others to see.'}
           </AlertDialogDescription>
         </AlertDialogHeader>
         <div className="flex gap-3 justify-center">
           <AlertDialogCancel className="bg-slate-800/60 border border-slate-600/40 text-slate-200 hover:bg-slate-700/60">Cancel</AlertDialogCancel>
           <AlertDialogAction
             onClick={() => {
               updatePostMutation.mutate({ id: post.id, data: { is_favourite: !post.is_favourite } });
               setShowFavouriteConfirm(false);
             }}
             disabled={updatePostMutation.isPending}
             className="bg-amber-600/80 hover:bg-amber-700/80 border border-amber-500/30 text-white disabled:opacity-50"
           >
             {updatePostMutation.isPending ? 'Loading...' : post.is_favourite ? 'Remove' : 'Add to Favourites'}
           </AlertDialogAction>
         </div>
       </AlertDialogContent>
      </AlertDialog>
      </motion.div>
      );
      }