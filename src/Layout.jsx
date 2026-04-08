import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Trophy, Dumbbell, Crown, MessageCircle, Users, Bell, Building2, Home, Flame, Award, MoreVertical, Gift, BarChart3, ClipboardList, CalendarDays, UserCheck, UserPlus, CalendarPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentRestTimer from './components/PersistentRestTimer';
import { TimerProvider, useTimer } from './components/TimerContext';

// ── Inner layout that can access TimerContext ─────────────────────────────────
function LayoutInner({ children, currentPageName, currentUser, notifications, gymMemberships, isDashboardUser, isCoachUser, hideNavigation }) {
  const location = useLocation();
  const tabHistoryRef = React.useRef({});
  const lastTabPageRef = React.useRef({});
  const { restTimer, isTimerActive, initialRestTime, setIsTimerActive, setRestTimer } = useTimer();

  const unreadCount = notifications.length;
  const isGymOwner = currentUser?.account_type === 'gym_owner';
  const isCoach = currentUser?.account_type === 'coach';

  const navItems = isCoach ? [
    { name: 'Dashboard', icon: ClipboardList, page: 'GymOwnerDashboard' },
    { name: 'Members', icon: UserCheck, page: 'Gyms' },
    { name: 'Schedule', icon: CalendarDays, page: 'Gyms' },
    { name: 'Messages', icon: MessageCircle, page: 'Messages' },
  ] : isGymOwner ? [
    { name: 'Dashboard', icon: Building2, page: 'GymOwnerDashboard' },
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms' },
  ] : [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms' },
    { name: 'Progress', icon: BarChart3, page: 'Progress' },
    { name: 'Challenges', icon: Gift, page: 'RedeemReward' },
    { name: 'Profile', icon: Crown, page: 'Profile' },
  ];


  useEffect(() => {
    const currentTab = navItems.find((item) => item.page === currentPageName);
    if (currentTab) {
      tabHistoryRef.current[currentTab.page] = location.pathname + location.search;
      lastTabPageRef.current[currentTab.page] = currentPageName;
    }
  }, [currentPageName, location]);

  const getTabLink = (item) => tabHistoryRef.current[item.page] || createPageUrl(item.page) + (item.params || '');

  const handleTabClick = (item, e) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentPageName === item.page) {
      e.preventDefault();
      if (item.page === 'Home') {
        window.dispatchEvent(new Event('homeButtonClicked'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950">

      {/* Safe-area top fill — colour matches each page's sticky header exactly */}
      {!hideNavigation && !isCoachUser && (
        <div
          className="fixed top-0 left-0 right-0 z-50 md:hidden"
          style={{
            height: 'env(safe-area-inset-top)',
            // Gyms & Progress use slate-900/95 headers; everything else uses the deep navy base
            background: (currentPageName === 'Gyms' || currentPageName === 'Progress')
              ? 'rgba(15,23,42,0.97)'
              : '#01020a',
          }}
        />
      )}

      {/* Bottom Navigation */}
      {!hideNavigation &&
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-blue-800/50 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-start pt-1 h-[62px] px-2">
            {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={getTabLink(item)}
                onClick={(e) => {
                  handleTabClick(item, e);
                  if ('vibrate' in navigator) navigator.vibrate([12, 8, 12]);
                }}
                aria-label={item.name}
                className="relative flex flex-col items-center justify-start gap-1 px-3 py-1 min-w-0 flex-1 text-slate-400 rounded-xl"
                style={{ transition: 'transform 60ms ease-in-out' }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'}
                onMouseUp={(e) => {e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)';e.currentTarget.style.transform = 'scale(1) translateY(0)';}}
                onMouseLeave={(e) => {e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)';e.currentTarget.style.transform = 'scale(1) translateY(0)';}}
                onTouchStart={(e) => {e.currentTarget.style.transition = 'transform 60ms ease-in-out';e.currentTarget.style.transform = 'scale(0.82) translateY(3px)';}}
                onTouchEnd={(e) => {e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)';e.currentTarget.style.transform = 'scale(1) translateY(0)';}}>
                  <div className="relative">
                    <item.icon className={`w-6 h-6 ${isActive ? 'text-blue-400' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge > 0 &&
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 animate-ios-bounce">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                  }
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-blue-400' : ''}`}>{item.name}</span>
                </Link>);

          })}
          </div>
        </nav>
      }

      {/* Side Navigation for Desktop */}
      {!hideNavigation &&
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-slate-900/95 backdrop-blur-xl border-r border-blue-800/50 flex-col items-center py-8 z-50 shadow-xl">
          <Link to={createPageUrl('Gyms')} className="mb-8">

          </Link>
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={getTabLink(item)}
                onClick={(e) => handleTabClick(item, e)}
                className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                isActive ?
                'bg-blue-500/15 text-blue-400 shadow-sm' :
                'text-slate-500 hover:text-slate-200 hover:bg-slate-800/70'}`
                }>
                  <div className="relative">
                    <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge > 0 &&
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                  }
                  </div>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full" />}
                </Link>);

          })}
          </div>
        </nav>
      }

      {/* Coach Top Bar */}
      {isCoachUser && !hideNavigation && (
        <div className="fixed top-0 left-0 right-0 z-40 md:left-20" style={{ background: 'rgba(10,14,26,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between px-4 h-12">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <ClipboardList className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Coach</span>
              {currentUser?.full_name && (
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">— {currentUser.full_name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171' }}>
                  <Bell className="w-3 h-3" />
                  {notifications.length}
                </div>
              )}
              {/* Add Client */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('coachAction', { detail: 'addClient' }))}
                title="Add Client"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Client</span>
              </button>
              {/* Book Client */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('coachAction', { detail: 'bookClient' }))}
                title="Book Client"
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-95"
                style={{ background: 'rgba(29,170,114,0.12)', border: '1px solid rgba(29,170,114,0.25)', color: '#34d399' }}>
                <CalendarPlus className="w-3.5 h-3.5" />
              </button>
              <div className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                Coach
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={hideNavigation ? '' : 'md:pb-0 md:pl-20'} style={hideNavigation ? {} : { paddingBottom: 'calc(4.9375rem + env(safe-area-inset-bottom))', paddingTop: isCoachUser ? 'calc(3rem + env(safe-area-inset-top))' : 'env(safe-area-inset-top)' }}>
        <ErrorBoundary>
          <PageTransition key={currentPageName}>
            {children}
          </PageTransition>
        </ErrorBoundary>
      </main>

      {/* Persistent Rest Timer — inside TimerProvider so it can use context */}
      <PersistentRestTimer
        isActive={isTimerActive}
        restTimer={restTimer}
        initialRestTime={initialRestTime}
        onTimerStateChange={setIsTimerActive}
        onTimerValueChange={setRestTimer} />
      

    </div>);

}

// ── Outer Layout — sets up TimerProvider then renders LayoutInner ─────────────
export default function Layout({ children, currentPageName }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => ({
      id: 'guest', full_name: 'Guest', email: 'guest@example.com', account_type: 'user'
    })),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id, read: false }),
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const isCoachUser = currentUser?.account_type === 'coach';
  const isGymOwnerUser = currentUser?.account_type === 'gym_owner';
  const hideNavigation = currentPageName === 'Onboarding' || currentPageName === 'GymSignup' || currentPageName === 'MemberSignup' || (currentPageName === 'GymOwnerDashboard' && !isCoachUser);
  const isDashboardUser = isGymOwnerUser || isCoachUser;

  return (
    <TimerProvider>
      <LayoutInner
        currentPageName={currentPageName}
        currentUser={currentUser}
        notifications={notifications}
        gymMemberships={gymMemberships}
        isDashboardUser={isDashboardUser}
        isCoachUser={isCoachUser}
        hideNavigation={hideNavigation}>
        {children}
      </LayoutInner>
    </TimerProvider>);

}