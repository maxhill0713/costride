import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function MemberSignup() {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createMemberMutation = useMutation({
    mutationFn: async (memberData) => {
      // Update user account type to member and mark onboarding as complete
      const updates = { 
        account_type: 'personal',
        onboarding_completed: true 
      };
      
      // Update user's full_name if they provided one
      if (memberData.name) {
        updates.full_name = memberData.name;
      }
      
      if (memberData.bio) {
        updates.bio = memberData.bio;
      }
      
      if (memberData.avatar_url) {
        updates.avatar_url = memberData.avatar_url;
      }
      
      await base44.auth.updateMe(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      navigate(createPageUrl('Home'));
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, avatar_url: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMemberMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-2xl w-full relative z-10 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/40 mb-8">
        <div className="text-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
            alt="CoStride Logo"
            className="w-20 h-20 rounded-3xl mx-auto mb-4 object-cover shadow-2xl shadow-blue-500/30"
          />
          <h1 className="text-4xl font-black text-white mb-3">
            Complete Your Profile
          </h1>
          <p className="text-blue-200/70 text-lg">
            Let's personalize your fitness journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border-4 border-slate-600">
                  <User className="w-16 h-16 text-slate-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && <p className="text-sm text-slate-400">Uploading...</p>}
          </div>

          {/* Name Input */}
          <div>
            <Label htmlFor="name" className="text-white font-semibold mb-2 block">
              Your Name * ({formData.name.length}/15)
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, 15) })}
              maxLength="15"
              placeholder="Enter your full name"
              required
              className="h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-white font-semibold mb-2 block">
              Bio (Optional)
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about your fitness journey..."
              className="min-h-32 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              onClick={() => navigate(createPageUrl('Onboarding'))}
              className="flex-1 bg-white/10 hover:bg-white/15 text-white h-14 text-base rounded-xl font-semibold border border-white/10"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending || !formData.name}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-14 text-base rounded-xl shadow-lg font-semibold disabled:opacity-50"
            >
              {createMemberMutation.isPending ? (
                'Creating Profile...'
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}