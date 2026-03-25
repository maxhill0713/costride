import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, Trash2, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export default function ModeratorDashboard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('hidden');

  // SECURITY: All moderation actions now go through the moderatePost backend function
  // which enforces server-side admin role check. Previously used asServiceRole directly
  // from the browser with only a client-side role guard.
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: hiddenPosts = [], isLoading } = useQuery({
    queryKey: ['hiddenPosts'],
    queryFn: async () => {
      const result = await base44.functions.invoke('moderatePost', { postId: 'list', action: 'list' });
      return result.data?.posts || [];
    },
    enabled: currentUser?.role === 'admin',
  });

  const unhideMutation = useMutation({
    mutationFn: (postId) => base44.functions.invoke('moderatePost', { postId, action: 'unhide' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hiddenPosts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (postId) => base44.functions.invoke('moderatePost', { postId, action: 'delete' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hiddenPosts'] }),
  });

  const handleUnhide = (postId) => unhideMutation.mutate(postId);
  const handleDelete = (postId) => deleteMutation.mutate(postId);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center p-6">
        <Card className="bg-slate-900/80 border border-red-500/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-300">This page is only accessible to administrators.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Moderation Dashboard</h1>
          <p className="text-slate-300">Review and manage flagged posts</p>
        </div>

        <div className="mb-6 flex gap-2">
          <Badge variant="outline" className="bg-slate-800 text-blue-300 border-blue-500/50">
            {hiddenPosts.length} flagged post{hiddenPosts.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {hiddenPosts.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-8 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-300">No flagged posts to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {hiddenPosts.map((post) => (
              <Card key={post.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-slate-400 text-sm mb-2">{post.member_name}</p>
                      <p className="text-white line-clamp-2">{post.content}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {format(new Date(post.created_date), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    <Badge variant="destructive" className="whitespace-nowrap">Flagged</Badge>
                  </div>
                </CardHeader>

                {post.image_url && (
                  <CardContent className="pb-3">
                    <img
                      src={post.image_url}
                      alt="Post content"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                  </CardContent>
                )}

                <CardContent className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnhide(post.id)}
                    disabled={unhideMutation.isPending}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Unhide
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(post.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}