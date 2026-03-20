import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentRestTimer from './components/PersistentRestTimer';
import { TimerProvider } from './components/TimerContext';

// ── Pixel-accurate SVG Icons (matched to reference image) ────────────────────

function HomeIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none"
      stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* Roof — pentagon */}
      <polyline points="50,8 92,46 8,46"/>
      {/* House body */}
      <path d="M16,46 L16,90 L84,90 L84,46"/>
      {/* Door — centered, tall */}
      <rect x="39" y="65" width="22" height="25" rx="1.5"/>
      {/* Left window with cross */}
      <rect x="20" y="52" width="20" height="18" rx="1.5"/>
      <line x1="30" y1="52" x2="30" y2="70"/>
      <line x1="20" y1="61" x2="40" y2="61"/>
      {/* Right window with cross */}
      <rect x="60" y="52" width="20" height="18" rx="1.5"/>
      <line x1="70" y1="52" x2="70" y2="70"/>
      <line x1="60" y1="61" x2="80" y2="61"/>
    </svg>
  );
}

function GymIcon({ color }) {
  // Diagonal dumbbell: rotated -45deg around centre (50,50)
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none"
      stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(-45, 50, 50)">
        {/* Left outer plate */}
        <circle cx="17" cy="50" r="13"/>
        {/* Left inner plate (ring) */}
        <circle cx="17" cy="50" r="7.5"/>
        {/* Bar */}
        <rect x="30" y="46.5" width="40" height="7" rx="3.5"/>
        {/* Right inner plate (ring) */}
        <circle cx="83" cy="50" r="7.5"/>
        {/* Right outer plate */}
        <circle cx="83" cy="50" r="13"/>
      </g>
    </svg>
  );
}

function ProgressIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none"
      stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* Baseline */}
      <line x1="6" y1="88" x2="94" y2="88"/>
      {/* Bar 1 — shortest */}
      <rect x="8"  y="72" width="16" height="16" rx="1.5"/>
      {/* Bar 2 */}
      <rect x="30" y="55" width="16" height="33" rx="1.5"/>
      {/* Bar 3 */}
      <rect x="52" y="36" width="16" height="52" rx="1.5"/>
      {/* Bar 4 — tallest */}
      <rect x="74" y="16" width="16" height="72" rx="1.5"/>
    </svg>
  );
}

function ChallengesIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none"
      stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Cup body */}
      <path d="M27,10 L73,10 L73,46 Q73,70 50,70 Q27,70 27,46 Z"/>
      {/* Left handle */}
      <path d="M27,18 Q8,18 8,34 Q8,50 27,50"/>
      {/* Right handle */}
      <path d="M73,18 Q92,18 92,34 Q92,50 73,50"/>
      {/* Stem */}
      <line x1="50" y1="70" x2="50" y2="80"/>
      {/* Base lower */}
      <rect x="30" y="82" width="40" height="8" rx="3"/>
      {/* Base upper ridge */}
      <line x1="34" y1="80" x2="66" y2="80"/>
      {/* Figure inside — person with arms raised */}
      {/* Head */}
      <circle cx="50" cy="28" r="5"/>
      {/* Body */}
      <line x1="50" y1="33" x2="50" y2="48"/>
      {/* Arms up */}
      <path d="M50,37 L40,28 M50,37 L60,28"/>
      {/* Legs */}
      <path d="M50,48 L43,58 M50,48 L57,58"/>
    </svg>
  );
}

function ProfileIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none"
      stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <circle cx="50" cy="30" r="20"/>
      {/* Shoulders arc */}
      <path d="M12,92 Q12,62 50,62 Q88,62 88,92"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [tabHistory, setTabHistory] = useState({});
  const [lastTabPage, setLastTabPage] = useState({});
  const [restTimer, setRestTimer] = useState('');
  const [initialRestTime, setInitialRestTime] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => ({
      id: 'guest',
      full_name: 'Guest',
      email: 'guest@example.com',
      account_type: 'user'
    })),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const hideNavigation =
    currentPageName === 'Onboarding' ||
    currentPageName === 'GymSignup' ||
    currentPageName === 'MemberSignup' ||
    currentPageName === 'GymOwnerDashboard';

  const isDashboardUser =
    currentUser?.account_type === 'gym_owner' ||
    currentUser?.account_type === 'coach';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id, read: false }),
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000
  });

  const unreadCount = notifications.length;
  const isGymOwner = currentUser?.account_type === 'gym_owner';

  React.useEffect(() => {
    let interval;
    if (isTimerActive && restTimer > 0) {
      interval = setInterval(() => setRestTimer((t) => t - 1), 1000);
    } else if (restTimer === 0 && isTimerActive) {
      setIsTimerActive(false);
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURU=');
      audio.play().catch(() => {});
    }
    return () => clearInterval(interval);
  }, [isTimerActive, restTimer]);

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const primaryGymId =
    currentUser?.primary_gym_id ||
    (gymMemberships.length > 0 ? gymMemberships[0].gym_id : null);

  const ACTIVE_COLOR   = '#ffffff';
  const INACTIVE_COLOR = 'rgba(255,255,255,0.35)';

  const navItems = isDashboardUser
    ? [
        { name: 'Dashboard', icon: HomeIcon,   page: 'GymOwnerDashboard' },
        { name: 'Gyms',      icon: GymIcon,    page: 'Gyms' },
      ]
    : [
        { name: 'Home',       icon: HomeIcon,       page: 'Home' },
        { name: 'Gyms',       icon: GymIcon,        page: 'Gyms' },
        { name: 'Progress',   icon: ProgressIcon,   page: 'Progress' },
        { name: 'Challenges', icon: ChallengesIcon, page: 'RedeemReward' },
        { name: 'Profile',    icon: ProfileIcon,    page: 'Profile' },
      ];

  useEffect(() => {
    const currentTab = navItems.find((item) => item.page === currentPageName);
    if (currentTab) {
      setTabHistory((prev) => ({ ...prev, [currentTab.page]: location.pathname + location.search }));
      setLastTabPage((prev) => ({ ...prev, [currentTab.page]: currentPageName }));
    }
  }, [currentPageName, location]);

  const getTabLink = (item) =>
    tabHistory[item.page] || createPageUrl(item.page) + (item.params || '');

  const handleTabClick = (item, e) => {
    if (currentPageName === item.page) {
      e.preventDefault();
      if (item.page === 'Home') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFocusStyle = (e) => {
    e.currentTarget.style.outline    = 'none';
    e.currentTarget.style.background = 'none';
    e.currentTarget.style.boxShadow  = 'none';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950">

      {/* ── Bottom Navigation (Mobile) ── */}
      {!hideNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-blue-800/50 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-start pt-1 h-[79px] px-2">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const IconComponent = item.icon;
              const iconColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
              return (
                <Link
                  key={item.page}
                  to={getTabLink(item)}
                  onClick={(e) => {
                    handleTabClick(item, e);
                    if ('vibrate' in navigator) navigator.vibrate([12, 8, 12]);
                  }}
                  aria-label={item.name}
                  className="relative flex flex-col items-center justify-start gap-1 px-3 py-1 min-w-0 flex-1"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', background: 'none', border: 'none', transition: 'transform 60ms ease-in-out' }}
                  onFocus={clearFocusStyle}
                  onBlur={clearFocusStyle}
                  onMouseDown={e => { clearFocusStyle(e); e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'; }}
                  onMouseUp={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onMouseLeave={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onTouchStart={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 60ms ease-in-out'; e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'; }}
                  onTouchEnd={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                >
                  <div className="relative">
                    <IconComponent color={iconColor} />
                    {item.badge > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 animate-ios-bounce">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold leading-none" style={{ color: iconColor }}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── Side Navigation (Desktop) ── */}
      {!hideNavigation && (
        <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-slate-900/95 backdrop-blur-xl border-r border-blue-800/50 flex-col items-center py-8 z-50 shadow-xl">
          <Link to={createPageUrl('Gyms')} className="mb-8"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', background: 'none' }}>
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-3 transition-all duration-300">
              <span className="text-2xl font-black text-white">G</span>
            </div>
          </Link>

          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const IconComponent = item.icon;
              const iconColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
              return (
                <Link
                  key={item.page}
                  to={getTabLink(item)}
                  onClick={(e) => handleTabClick(item, e)}
                  className={`relative flex items-center justify-center w-14 h-14 transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', background: 'none', border: 'none' }}
                  onFocus={clearFocusStyle}
                  onBlur={clearFocusStyle}
                >
                  <div className="relative">
                    <IconComponent color={iconColor} />
                    {item.badge > 0 && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white/60 rounded-r-full shadow-lg" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── Main Content ── */}
      <main
        className={hideNavigation ? '' : 'md:pb-0 md:pl-20'}
        style={hideNavigation ? {} : { paddingBottom: 'calc(4.9375rem + env(safe-area-inset-bottom))' }}
      >
        <ErrorBoundary>
          <TimerProvider value={{ restTimer, setRestTimer, isTimerActive, setIsTimerActive, initialRestTime, setInitialRestTime }}>
            <PageTransition key={currentPageName}>
              {children}
            </PageTransition>
          </TimerProvider>
        </ErrorBoundary>
      </main>

      {/* ── Persistent Rest Timer ── */}
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
