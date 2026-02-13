import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Bell, BellOff, Moon, Sun, Lock, Globe, Ruler, LogOut, User, Camera, Image, ChevronRight, ChevronLeft, HelpCircle, Search, Bell as BellIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MobileSelect } from '@/components/ui/mobile-select';
import SearchSettingsDisplay from '@/components/settings/SearchSettingsDisplay';

export default function Settings() {
  const queryClient = useQueryClient();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const settings = [
    { name: 'Notifications', page: 'NotificationSettings', icon: '🔔', keywords: ['notification', 'alert', 'push', 'email', 'message'] },
    { name: 'Privacy', page: 'PrivacySettings', icon: '🔒', keywords: ['privacy', 'public', 'profile', 'private', 'visibility'] },
    { name: 'Account', page: 'AccountSettings', icon: '🔐', keywords: ['account', 'password', 'email', 'security', 'change password'] },
    { name: 'Profile', page: 'ProfileSettings', icon: '👤', keywords: ['profile', 'avatar', 'banner', 'bio', 'name', 'picture', 'photo'] },
    { name: 'Appearance', page: 'AppearanceSettings', icon: '🎨', keywords: ['appearance', 'dark mode', 'theme', 'unit', 'language', 'settings'] },
    { name: 'Subscriptions', page: 'SubscriptionSettings', icon: 'S', keywords: ['subscription', 'plan', 'billing', 'payment'] },
    { name: 'Help & Support', page: 'HelpSupport', icon: '❓', keywords: ['help', 'support', 'faq', 'question', 'contact'] }
  ];

  const displayedSettings = useMemo(() => {
    if (!searchQuery.trim()) return settings;
    const query = searchQuery.toLowerCase();
    return settings.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

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
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      await base44.auth.updateMe(settings);
      return base44.auth.me();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Profile')}>
            <div className="flex items-center justify-center w-10 h-10">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-3">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
         {displayedSettings.map((setting) => {
           const colorMap = {
             'NotificationSettings': { from: 'from-orange-600', to: 'to-red-600', fromHover: 'hover:from-orange-700', toHover: 'hover:to-red-700', icon: Bell },
             'PrivacySettings': { from: 'from-green-600', to: 'to-emerald-600', fromHover: 'hover:from-green-700', toHover: 'hover:to-emerald-700', icon: Lock },
             'AccountSettings': { from: 'from-purple-600', to: 'to-indigo-600', fromHover: 'hover:from-purple-700', toHover: 'hover:to-indigo-700', icon: Lock },
             'ProfileSettings': { from: 'from-blue-600', to: 'to-cyan-600', fromHover: 'hover:from-blue-700', toHover: 'hover:to-cyan-700', icon: User },
             'AppearanceSettings': { from: 'from-yellow-600', to: 'to-orange-600', fromHover: 'hover:from-yellow-700', toHover: 'hover:to-orange-700', icon: Sun },
             'SubscriptionSettings': { from: 'from-emerald-600', to: 'to-teal-600', fromHover: 'hover:from-emerald-700', toHover: 'hover:to-teal-700', icon: null },
             'HelpSupport': { from: 'from-indigo-600', to: 'to-purple-600', fromHover: 'hover:from-indigo-700', toHover: 'hover:to-purple-700', icon: HelpCircle }
           };

           const colors = colorMap[setting.page];
           const IconComponent = colors?.icon;

           return (
             <Link key={setting.page} to={createPageUrl(setting.page)} className="block pb-2">
               <div className={`w-full bg-gradient-to-r ${colors.from} ${colors.to} ${colors.fromHover} ${colors.toHover} rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg`}>
                 <div className="flex items-center gap-3">
                   <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                     {IconComponent ? <IconComponent className="w-4 h-4 text-white" /> : <span className="text-white font-bold text-sm">{setting.icon}</span>}
                   </div>
                   <span className="font-semibold text-white">{setting.name}</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-white/70" />
               </div>
             </Link>
           );
         })}

         {/* Logout and Delete Account - Smaller Buttons */}
         <div className="pt-4 space-y-3">
           <Button 
             className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium h-9 text-sm flex items-center gap-2 justify-center"
             onClick={() => {
               if (confirm('Are you sure you want to logout?')) {
                 base44.auth.logout();
               }
             }}
           >
             <LogOut className="w-4 h-4" />
             Logout
           </Button>
           <AlertDialog>
             <AlertDialogTrigger asChild>
               <Button 
                 variant="outline"
                 className="w-full border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded-xl font-medium h-9 text-sm"
               >
                 Delete Account
               </Button>
             </AlertDialogTrigger>
             <AlertDialogContent className="bg-slate-800 border-red-600/50">
               <AlertDialogHeader>
                 <AlertDialogTitle className="text-white">⚠️ Delete Account?</AlertDialogTitle>
                 <AlertDialogDescription className="text-slate-300">
                   This will permanently delete your account and all your data including check-ins, posts, progress{currentUser.account_type === 'gym_owner' ? ', and all gyms you own' : ''}. This action cannot be undone.
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                 <AlertDialogAction
                   className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                   onClick={async () => {
                     try {
                       await base44.functions.invoke('deleteUserAccount');
                       base44.auth.logout();
                     } catch (error) {
                       console.error('Failed to delete account:', error);
                     }
                   }}
                 >
                   Delete Permanently
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
         </div>



        </div>
        </div>
        </div>
        );
        }