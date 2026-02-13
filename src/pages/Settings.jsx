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

export default function Settings() {
  const queryClient = useQueryClient();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const settings = [
    { name: 'Notifications', page: 'NotificationSettings', icon: '🔔' },
    { name: 'Privacy', page: 'PrivacySettings', icon: '🔒' },
    { name: 'Account', page: 'AccountSettings', icon: '🔐' },
    { name: 'Profile', page: 'ProfileSettings', icon: '👤' },
    { name: 'Appearance', page: 'AppearanceSettings', icon: '🎨' },
    { name: 'Subscriptions', page: 'SubscriptionSettings', icon: 'S' },
    { name: 'Help & Support', page: 'HelpSupport', icon: '❓' }
  ];

  const filteredSettings = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return settings.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
        <div className="mb-6 relative">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {searchQuery.trim() && filteredSettings.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              {filteredSettings.map((setting) => (
                <Link
                  key={setting.page}
                  to={createPageUrl(setting.page)}
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                >
                  <span className="text-lg">{setting.icon}</span>
                  <span className="text-white font-medium">{setting.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-7">
         {/* Notifications Button - Full Width */}
         <Link to={createPageUrl('NotificationSettings')}>
           <div className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <Bell className="w-4 h-4 text-white" />
               </div>
               <span className="font-semibold text-white">Notifications</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Privacy Button - Full Width */}
         <Link to={createPageUrl('PrivacySettings')}>
           <div className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <Lock className="w-4 h-4 text-white" />
               </div>
               <span className="font-semibold text-white">Privacy</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Account Button - Full Width */}
         <Link to={createPageUrl('AccountSettings')}>
           <div className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <Lock className="w-4 h-4 text-white" />
               </div>
               <span className="font-semibold text-white">Account</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Profile Button - Full Width */}
         <Link to={createPageUrl('ProfileSettings')}>
           <div className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <User className="w-4 h-4 text-white" />
               </div>
               <span className="font-semibold text-white">Profile</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Appearance Button - Full Width */}
         <Link to={createPageUrl('AppearanceSettings')}>
           <div className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <Sun className="w-4 h-4 text-white" />
               </div>
               <span className="font-semibold text-white">Appearance</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Subscriptions Button - Full Width */}
         <Link to={createPageUrl('SubscriptionSettings')}>
           <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <span className="text-white font-bold text-sm">S</span>
               </div>
               <span className="font-semibold text-white">Subscriptions</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Help & Support Button - Full Width */}
         <Link to={createPageUrl('HelpSupport')}>
           <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl h-10 flex items-center justify-between px-4 transition-all shadow-lg">
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                 <HelpCircle className="w-4 h-4 text-white" />
               </div>
               <span className="font-semibold text-white">Help & Support</span>
             </div>
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
         </Link>

         {/* Logout and Delete Account - Smaller Buttons */}
         <div className="pt-4 flex gap-3">
           <Button 
             className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium h-9 text-sm flex items-center gap-2 justify-center"
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
                 className="flex-1 border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded-xl font-medium h-9 text-sm"
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