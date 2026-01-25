import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function MemberSignup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      // Update user account type to member
      await base44.auth.updateMe({ account_type: 'member' });
      
      return base44.entities.GymMember.create({
        ...memberData,
        name: currentUser.full_name,
        join_date: new Date().toISOString().split('T')[0]
      });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700/50 shadow-xl rounded-3xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Complete Your Profile
          </h1>
          <p className="text-slate-300 text-lg">
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

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-white font-semibold mb-2 block">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
              className="h-12 text-base bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="password" className="text-white font-semibold">
                Password *
              </Label>
              <a
                href="/auth/login"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Forgot Password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
              className="h-12 text-base bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {/* Name Display */}
          <div>
            <Label className="text-white font-semibold mb-2 block">
              Your Name
            </Label>
            <Input
              value={currentUser?.full_name || ''}
              disabled
              className="h-12 text-base bg-slate-700/30 border-slate-600 text-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">This is your account name</p>
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
              className="min-h-32 text-base bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={() => navigate(createPageUrl('Home'))}
              variant="outline"
              className="flex-1 h-14 text-base rounded-xl border-2 border-slate-600 text-slate-200 hover:bg-slate-700/50"
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-14 text-base rounded-xl shadow-lg font-semibold"
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
      </Card>
    </div>
  );
}