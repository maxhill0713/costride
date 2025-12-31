import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dumbbell, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import PostCard from '@/components/feed/PostCard';
import CreatePostButton from '@/components/feed/CreatePostButton';
import StoriesBar from '@/components/feed/StoriesBar';
import LogLiftModal from '@/components/lifts/LogLiftModal';

export default function Feed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLogLift, setShowLogLift] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date')
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list()
  });

  const addLiftMutation = useMutation({
    mutationFn: async (data) => {
      // Create lift record
      await base44.entities.Lift.create(data);
      // Create post from lift
      const member = members.find(m => m.id === data.member_id);
      return base44.entities.Post.create({
        member_id: data.member_id,
        member_name: data.member_name,
        member_avatar: member?.avatar_url,
        content: data.notes || `Just lifted ${data.weight_lbs} lbs on ${data.exercise.replace(/_/g, ' ')}! ${data.is_pr ? '🔥 NEW PR!' : ''}`,
        exercise: data.exercise,
        weight: data.weight_lbs,
        likes: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['lifts'] });
      setShowLogLift(false);
    }
  });

  const updateLikeMutation = useMutation({
    mutationFn: ({ postId, liked }) => {
      const post = posts.find(p => p.id === postId);
      return base44.entities.Post.update(postId, {
        likes: (post.likes || 0) + (liked ? 1 : -1)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-gray-900" />
            <h1 className="text-xl font-bold text-gray-900">Fattie</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(createPageUrl('Search'))}
              className="hover:opacity-70 transition-opacity"
            >
              <Search className="w-6 h-6 text-gray-900" />
            </button>
            <button 
              onClick={() => navigate(createPageUrl('Notifications'))}
              className="hover:opacity-70 relative transition-opacity"
            >
              <Bell className="w-6 h-6 text-gray-900" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Stories */}
      <StoriesBar />

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-0 md:px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 mx-4">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-700">No posts yet</p>
            <p className="text-sm text-gray-500 mt-1">Share your first workout!</p>
          </div>
        ) : (
          <div className="md:space-y-0">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={(postId, liked) => updateLikeMutation.mutate({ postId, liked })}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePostButton onClick={() => setShowLogLift(true)} />

      <LogLiftModal
        open={showLogLift}
        onClose={() => setShowLogLift(false)}
        onSave={(data) => addLiftMutation.mutate(data)}
        members={members}
        isLoading={addLiftMutation.isPending}
      />
    </div>
  );
}