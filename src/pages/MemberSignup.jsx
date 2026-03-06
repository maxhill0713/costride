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
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-800/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md w-full relative z-10 bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/40">
        <div className="text-center mb-5">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
            alt="CoStride Logo"
            className="w-12 h-12 rounded-2xl mx-auto mb-3 object-cover shadow-2xl shadow-blue-500/30"
          />
          <h1 className="text-2xl font-black text-white mb-1">
            Complete Your Profile
          </h1>
          <p className="text-slate-300 text-sm">
            Let's personalize your fitness journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-400/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border-4 border-slate-600">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm mb-1">Profile Photo</p>
              <p className="text-slate-400 text-xs">{uploading ? 'Uploading...' : 'Tap to upload a photo'}</p>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <Label htmlFor="name" className="text-white font-semibold mb-1.5 block text-sm">
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
              className="h-11 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-white font-semibold mb-1.5 block text-sm">
              Bio <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about your fitness journey..."
              className="min-h-[80px] text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={() => navigate(createPageUrl('Onboarding'))}
              className="flex-1 bg-white/10 hover:bg-white/15 text-white h-12 text-sm rounded-xl font-semibold border border-white/10"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending || !formData.name}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white h-12 text-sm rounded-xl shadow-lg font-semibold disabled:opacity-50"
            >
              {createMemberMutation.isPending ? 'Saving...' : <>Complete Setup <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}