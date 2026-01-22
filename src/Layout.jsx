import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Trophy, Dumbbell, Crown, MessageCircle, Users, Bell, Building2, Plus, Home, Flame, Award, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import './components/i18n/config';
import PageTransition from './components/PageTransition';

export default function Layout({ children, currentPageName }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => ({
      id: 'guest',
      full_name: 'Guest',
      email: 'guest@example.com',
      account_type: 'user'
    }))
  });

  // Hide navigation on onboarding and signup pages
  const hideNavigation = currentPageName === 'Onboarding' || currentPageName === 'GymSignup' || currentPageName === 'MemberSignup';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id, read: false }),
    enabled: !!currentUser
  });

  const unreadCount = notifications.length;

  const isGymOwner = currentUser?.account_type === 'gym_owner';

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser
  });

  const primaryGymId = gymMemberships.length > 0 ? gymMemberships[0].gym_id : null;

  const navItems = isGymOwner ? [
    { name: 'Dashboard', icon: Building2, page: 'GymOwnerDashboard', color: 'text-orange-500' },
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms', color: 'text-cyan-500' },
  ] : [
    { name: 'Home', icon: Home, page: 'Home', color: 'text-indigo-500' },
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms', color: 'text-blue-500' },
    { name: 'Notifications', icon: Bell, page: 'Notifications', color: 'text-purple-500', badge: unreadCount },
    { name: 'Profile', icon: Crown, page: 'Profile', color: 'text-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950">


            {/* Main Content */}
            <main>
              <PageTransition key={currentPageName}>
                {children}
              </PageTransition>
            </main>
    </div>
  );
}