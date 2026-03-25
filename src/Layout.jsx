import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Trophy, Dumbbell, Crown, MessageCircle, Users, Bell, Building2, Home, Flame, Award, MoreVertical, Gift, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentRestTimer from './components/PersistentRestTimer';
import { TimerProvider, useTimer } from './components/TimerContext';

// ── Inner layout that can access TimerContext ─────────────────────────────────
function LayoutInner({ children, currentPageName, currentUser, notifications, gymMemberships, isDashboardUser, hideNavigation }) {
  const location = useLocation();
  const [tabHistory, setTabHistory] = useState({});
  const [lastTabPage, setLastTabPage] = useState({});
  const { restTimer, isTimerActive, initialRestTime, setIsTimerActive, setRestTimer } = useTimer();

  const unreadCount = notifications.length;
  const isGymOwner = currentUser?.account_type === 'gym_owner';

  const navItems = isDashboardUser ? [
    { name: 'Dashboard', icon: Building2, page: 'GymOwnerDashboard', color: 'text-orange-500' },
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms', color: 'text-cyan-500' },
  ] : [
    { name: 'Home', icon: Home, page: 'Home', color: 'text-indigo-500' },
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms', color: 'text-blue-500' },
    { name: 'Progress', icon: BarChart3, page: 'Progress', color: 'text-green-500' },
    { name: 'Challenges', icon: Gift, page: 'RedeemReward', color: 'text-amber-500' },
    { name: 'Profile', icon: Crown, page: 'Profile', color: 'text-pink-500' },
  ];

  useEffect(() => {
    const currentTab = navItems.find((item) => item.page === currentPageName);
    if (currentTab) {
      setTabHistory((prev) => ({ ...prev, [currentTab.page]: location.pathname + location.search }));
      setLastTabPage((prev) => ({ ...prev, [currentTab.page]: currentPageName }));
    }
  }, [currentPageName, location]);

  const getTabLink = (item) => tabHistory[item.page] || createPageUrl(item.page) + (item.params || '');

  const handleTabClick = (item, e) => {
    if (currentPageName === item.page) {
      e.preventDefault();
      if (item.page === 'Home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.dispatchEvent(new Event('homeButtonClicked'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950">

      {/* Bottom Navigation */}
      {!hideNavigation &&
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-blue-800/50 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-start pt-1 h-[79px] px-2">
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
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'}
                  onMouseUp={e => { e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onTouchStart={e => { e.currentTarget.style.transition = 'transform 60ms ease-in-out'; e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'; }}
                  onTouchEnd={e => { e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}>
                  <div className="relative">
                    <item.icon className={`w-6 h-6 ${isActive ? item.color : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge > 0 &&
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 animate-ios-bounce">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    }
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? item.color : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      }

      {/* Side Navigation for Desktop */}
      {!hideNavigation &&
        <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-slate-900/95 backdrop-blur-xl border-r border-blue-800/50 flex-col items-center py-8 z-50 shadow-xl">
          <Link to={createPageUrl('Gyms')} className="mb-8 hover:animate-ios-spring-in">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-3 transition-all duration-300">
              <span className="text-2xl font-black text-white">G</span>
            </div>
          </Link>
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={getTabLink(item)}
                  onClick={(e) => handleTabClick(item, e)}
                  className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.color.replace('text-', 'from-')}-600 ${item.color.replace('text-', 'to-')}-700 text-white shadow-md scale-110`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-105 active:animate-ios-haptic'
                  }`}>
                  <div className="relative">
                    <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge > 0 &&
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    }
                  </div>
                  {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 ${item.color.replace('text-', 'bg-')} rounded-r-full shadow-lg`} />}
                </Link>
              );
            })}
          </div>
        </nav>
      }

      {/* Main Content */}
      <main className={hideNavigation ? '' : 'md:pb-0 md:pl-20'} style={hideNavigation ? {} : { paddingBottom: 'calc(4.9375rem + env(safe-area-inset-bottom))' }}>
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
        onTimerValueChange={setRestTimer}
      />

    </div>
  );
}

// ── Outer Layout — sets up TimerProvider then renders LayoutInner ─────────────
export default function Layout({ children, currentPageName }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => ({
      id: 'guest', full_name: 'Guest', email: 'guest@example.com', account_type: 'user'
    })),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id, read: false }),
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const hideNavigation = currentPageName === 'Onboarding' || currentPageName === 'GymSignup' || currentPageName === 'MemberSignup' || currentPageName === 'GymOwnerDashboard';
  const isDashboardUser = currentUser?.account_type === 'gym_owner' || currentUser?.account_type === 'coach';

  return (
    <TimerProvider>
      <LayoutInner
        currentPageName={currentPageName}
        currentUser={currentUser}
        notifications={notifications}
        gymMemberships={gymMemberships}
        isDashboardUser={isDashboardUser}
        hideNavigation={hideNavigation}>
        {children}
      </LayoutInner>
    </TimerProvider>
  );
}