import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ProfileSettingsContent() {
  const queryClient = useQueryClient();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [nameTimeout, setNameTimeout] = useState(null);
  const [bioTimeout, setBioTimeout] = useState(null);

  const handleImageUpload = async (file, type) => {
    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'avatar') {
        await updateSettingsMutation.mutateAsync({ avatar_url: file_url });
      } else {
        await updateSettingsMutation.mutateAsync({ hero_image_url: file_url });
      }
    } catch { } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // ── Auto-create UserProfile if it doesn't exist yet (migration for existing users) ──
  useEffect(() => {
    if (!currentUser?.id) return;
    base44.entities.UserProfile.filter({ user_id: currentUser.id }).then((existing) => {
      if (existing.length === 0) {
        base44.entities.UserProfile.create({
          user_id: currentUser.id,
          display_name: currentUser.full_name || '',
          avatar_url: currentUser.avatar_url || null,
          bio: currentUser.bio || null,
          username: currentUser.username || null,
          account_type: currentUser.account_type || 'user',
          primary_gym_id: currentUser.primary_gym_id || null,
          primary_gym_name: currentUser.primary_gym_name || null,
          current_streak: currentUser.current_streak || 0,
          equipped_badges: currentUser.equipped_badges || [],
          is_public: true,
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [currentUser?.id]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      // 1. Always keep User entity in sync (backwards compat)
      await base44.auth.updateMe(settings);
      // 2. Mirror public fields to UserProfile (upsert)
      const profileFields = {};
      if (settings.full_name !== undefined)   profileFields.display_name = settings.full_name;
      if (settings.avatar_url !== undefined)  profileFields.avatar_url   = settings.avatar_url;
      if (settings.bio !== undefined)         profileFields.bio          = settings.bio;
      if (Object.keys(profileFields).length > 0 && currentUser?.id) {
        const existing = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
        if (existing.length > 0) {
          await base44.entities.UserProfile.update(existing[0].id, profileFields);
        } else {
          await base44.entities.UserProfile.create({ user_id: currentUser.id, ...profileFields });
        }
      }
      return base44.auth.me();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', currentUser?.id] });
    }
  });

  if (!currentUser) {
    return <p className="text-slate-400">Loading...</p>;
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Picture */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Label className="text-sm font-bold text-slate-100 block mb-3">Profile Picture</Label>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden ring-2 ring-slate-600/50">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-white">
                  {currentUser.full_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
              />
              <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
                {uploadingAvatar ? (
                  <span>Uploading...</span>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Banner Image */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Label className="text-sm font-bold text-slate-100 block mb-3">Banner Image</Label>
          <div className="flex items-center gap-3">
            {currentUser.hero_image_url && (
              <div className="rounded-xl overflow-hidden h-16 w-24 flex-shrink-0">
                <img src={currentUser.hero_image_url} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
              />
              <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
                {uploadingBanner ? (
                  <span>Uploading...</span>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Full Name */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Full Name</Label>
          <Input
            type="text"
            value={currentUser?.full_name || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              queryClient.setQueryData(['currentUser'], (old) => ({
                ...old,
                full_name: newValue
              }));
              clearTimeout(nameTimeout);
              setNameTimeout(setTimeout(() => {
                updateSettingsMutation.mutate({ full_name: newValue });
              }, 800));
            }}
            placeholder="Your full name"
            className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
          />
        </div>
      </Card>

      {/* Bio */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Bio</Label>
          <Textarea
            value={currentUser?.bio || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              queryClient.setQueryData(['currentUser'], (old) => ({
                ...old,
                bio: newValue
              }));
              clearTimeout(bioTimeout);
              setBioTimeout(setTimeout(() => {
                updateSettingsMutation.mutate({ bio: newValue });
              }, 800));
            }}
            placeholder="Tell us about yourself..."
            rows={3}
            className="bg-white/5 border border-white/10 text-slate-100 rounded-xl resize-none"
          />
        </div>
      </Card>
    </div>
  );
}