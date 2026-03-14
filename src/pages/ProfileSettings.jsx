import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Camera, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function useSectionHighlight() {
  const { search } = useLocation();
  const section = new URLSearchParams(search).get('section');
  const [highlightedSection, setHighlightedSection] = useState(null);

  useEffect(() => {
    if (!section) return;
    setHighlightedSection(section);
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`section-${section}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    const clearTimer = setTimeout(() => setHighlightedSection(null), 2500);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [section]);

  return highlightedSection;
}

function SectionCard({ sectionId, highlightedSection, children }) {
  const isHighlighted = highlightedSection === sectionId;
  return (
    <div
      id={`section-${sectionId}`}
      style={{
        borderRadius: 16,
        transition: 'box-shadow 0.4s ease',
        boxShadow: isHighlighted ? '0 0 0 2px rgba(96,165,250,0.7), 0 0 24px rgba(96,165,250,0.25)' : 'none',
      }}
    >
      {children}
    </div>
  );
}

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const highlightedSection = useSectionHighlight();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [nameTimeout, setNameTimeout] = useState(null);
  const [localFullName, setLocalFullName] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    if (currentUser) {
      setLocalFullName(currentUser.full_name || '');
    }
  }, []);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      await base44.auth.updateMe(settings);
      return base44.auth.me();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const handleImageUpload = async (file, type) => {
    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'avatar') await updateSettingsMutation.mutateAsync({ avatar_url: file_url });
      else await updateSettingsMutation.mutateAsync({ hero_image_url: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Settings')}>
            <div className="flex items-center justify-center w-10 h-10">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-20">

        {/* Avatar — id: section-avatar */}
        <SectionCard sectionId="avatar" highlightedSection={highlightedSection}>
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Label className="text-sm font-bold text-slate-100 block mb-3">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden ring-2 ring-slate-600/50">
                  {currentUser.avatar_url
                    ? <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-semibold text-white">{currentUser.full_name?.charAt(0)?.toUpperCase()}</span>}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
                  <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
                    {uploadingAvatar ? <span>Uploading...</span> : <Camera className="w-4 h-4" />}
                  </div>
                </label>
              </div>
            </div>
          </Card>
        </SectionCard>

        {/* Banner — id: section-banner */}
        <SectionCard sectionId="banner" highlightedSection={highlightedSection}>
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
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                  <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
                    {uploadingBanner ? <span>Uploading...</span> : <Camera className="w-4 h-4" />}
                  </div>
                </label>
              </div>
            </div>
          </Card>
        </SectionCard>

        {/* Name — id: section-name */}
        <SectionCard sectionId="name" highlightedSection={highlightedSection}>
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Full Name</Label>
              <Input
                type="text"
                value={localFullName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalFullName(newValue);
                  clearTimeout(nameTimeout);
                  setNameTimeout(setTimeout(() => updateSettingsMutation.mutate({ full_name: newValue }), 800));
                }}
                placeholder="Your full name"
                className="bg-white/5 border border-white/10 text-slate-100 rounded-xl"
              />
            </div>
          </Card>
        </SectionCard>

      </div>
    </div>
  );
}