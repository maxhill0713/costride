import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Home, BookOpen, Calendar, Users, MessageSquare, User, Settings,
  Menu, X, ChevronRight, Building2, Bell, LogOut, CheckCircle2, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import DashOverview from '../components/coach-dashboard/DashOverview';
import DashClasses from '../components/coach-dashboard/DashClasses';
import DashSchedule from '../components/coach-dashboard/DashSchedule';
import DashClients from '../components/coach-dashboard/DashClients';
import DashCommunity from '../components/coach-dashboard/DashCommunity';
import DashProfile from '../components/coach-dashboard/DashProfile';
import DashSettings from '../components/coach-dashboard/DashSettings';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'community', label: 'Community', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function GymInvitesBanner({ currentUser }) {
  const qc = useQueryClient();

  const { data: invites = [] } = useQuery({
    queryKey: ['gymInvites', currentUser?.id],
    queryFn: () => base44.entities.CoachJoinRequest.filter({ coach_id: currentUser.id, type: 'gym_invite', status: 'pending' }),
    enabled: !!currentUser?.id,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, gymId, gymName, accept }) => {
      await base44.entities.CoachJoinRequest.update(id, { status: accept ? 'approved' : 'rejected' });
      if (accept) {
        const coachProfiles = await base44.entities.Coach.filter({ user_email: currentUser.email });
        if (coachProfiles.length > 0) {
          await base44.entities.Coach.update(coachProfiles[0].id, { gym_id: gymId, gym_name: gymName });
        }
      }
    },
    onSuccess: (_, { accept }) => {
      qc.invalidateQueries({ queryKey: ['gymInvites'] });
      qc.invalidateQueries({ queryKey: ['coachProfile'] });
      toast.success(accept ? 'You joined the gym!' : 'Invite declined');
    },
  });

  if (invites.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {invites.map(inv => (
        <Card key={inv.id} className="bg-blue-500/10 border-blue-500/30 p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Gym Invite</p>
              <p className="text-blue-300 text-xs"><strong>{inv.gym_name}</strong> invited you to join as a coach.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" onClick={() => respondMutation.mutate({ id: inv.id, gymId: inv.gym_id, gymName: inv.gym_name, accept: true })}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">Accept</Button>
              <Button size="sm" variant="outline" onClick={() => respondMutation.mutate({ id: inv.id, gymId: inv.gym_id, gymName: inv.gym_name, accept: false })}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 text-xs">Decline</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['gymInvites', currentUser?.id],
    queryFn: () => base44.entities.CoachJoinRequest.filter({ coach_id: currentUser.id, type: 'gym_invite', status: 'pending' }),
    enabled: !!currentUser?.id,
    staleTime: 60 * 1000,
  });

  const handleLogout = () => base44.auth.logout('/');

  const sections = {
    home: <DashOverview currentUser={currentUser} />,
    classes: <DashClasses currentUser={currentUser} />,
    schedule: <DashSchedule currentUser={currentUser} />,
    clients: <DashClients currentUser={currentUser} />,
    community: <DashCommunity currentUser={currentUser} />,
    profile: <DashProfile currentUser={currentUser} />,
    settings: <DashSettings currentUser={currentUser} />,
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
            {coachProfile?.avatar_url
              ? <img src={coachProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              : <User className="w-5 h-5 text-white" />}
          </div>
          <div className="min-w-0">
            <p className="font-black text-white text-sm truncate">{coachProfile?.name || currentUser?.full_name || 'Coach'}</p>
            <p className="text-xs text-slate-400 truncate">
              {coachProfile?.gym_name ? coachProfile.gym_name : 'Independent Coach'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasBadge = item.id === 'settings' && pendingInvites.length > 0;
          return (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {hasBadge && <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingInvites.length}</span>}
              {isActive && !hasBadge && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900/80 border-r border-slate-700/50 flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 z-50 md:hidden flex flex-col shadow-2xl">
            <NavContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="md:hidden text-slate-400 hover:text-white p-1">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-black text-white text-lg leading-none">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 hidden md:block">Coach Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {coachProfile?.gym_name && (
              <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/20 text-xs hidden sm:flex">
                {coachProfile.gym_name}
              </Badge>
            )}
            {!coachProfile?.gym_id && (
              <Badge className="bg-slate-700/60 text-slate-300 border-slate-600 text-xs hidden sm:flex">
                Independent
              </Badge>
            )}
          </div>
        </header>

        {/* Page body */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <GymInvitesBanner currentUser={currentUser} />
          {sections[activeTab] || null}
        </div>
      </main>
    </div>
  );
}