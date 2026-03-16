import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Plus, Image, Trash2, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';

export default function DashCommunity({ currentUser }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  const gymId = coachProfile?.gym_id;

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts', gymId],
    queryFn: () => base44.entities.Post.filter({ member_id: currentUser.id }, '-created_date', 30),
    enabled: !!currentUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.Post.create({
      member_id: currentUser.id,
      member_name: currentUser.full_name,
      member_avatar: currentUser.avatar_url || null,
      content,
      image_url: imageUrl || null,
      likes: 0,
      comments: [],
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communityPosts'] });
      setContent(''); setImageUrl(''); setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communityPosts'] }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Community Feed</h2>
          <p className="text-slate-400 text-sm">Posts you've shared</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="bg-slate-800/80 border-slate-700 p-5 space-y-3">
          <h3 className="font-bold text-white">Create Post</h3>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
          />
          {imageUrl && <img src={imageUrl} alt="" className="rounded-xl max-h-48 object-cover w-full" />}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer text-sm font-medium transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              <Image className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Add Photo'}
            </label>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setContent(''); setImageUrl(''); }} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!content.trim() || createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {createMutation.isPending ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No posts yet</p>
          <p className="text-slate-500 text-sm mt-1">Share something with the community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id} className="bg-slate-800/60 border-slate-700 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                      {post.member_avatar
                        ? <img src={post.member_avatar} alt="" className="w-full h-full object-cover" />
                        : post.member_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{post.member_name}</p>
                      <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</p>
                    </div>
                  </div>
                  {post.member_id === currentUser?.id && (
                    <button onClick={() => deleteMutation.mutate(post.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {post.content && <p className="text-slate-300 text-sm mt-3 leading-relaxed">{post.content}</p>}
              </div>
              {post.image_url && <img src={post.image_url} alt="" className="w-full max-h-72 object-cover" />}
              <div className="px-4 py-2.5 border-t border-slate-700 flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-slate-400"><Heart className="w-3.5 h-3.5" />{post.likes || 0}</span>
                <span className="text-xs text-slate-500">{(post.comments || []).length} comments</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}