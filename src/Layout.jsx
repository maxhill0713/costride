import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentRestTimer from './components/PersistentRestTimer';
import { TimerProvider } from './components/TimerContext';

// ── Custom SVG Icons from design ──────────────────────────────────────────

function HomeIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 600 400" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M363 2284 c-283 -251 -283 -251 -283 -284 0 -36 23 -50 85 -50 l46 0 -1 -197 -2 -198 136 -3 136 -3 0 113 c0 125 9 151 56 162 34 9 78 -9 93 -37 6 -12 12 -69 13 -127 l3 -105 133 -3 132 -3 0 203 0 203 48 -3 c36 -3 53 1 65 13 39 38 26 54 -217 274 -129 116 -239 211 -245 211 -6 0 -95 -75 -198 -166z m333 6 c70 -63 170 -153 221 -199 51 -47 90 -88 86 -92 -5 -4 -35 -9 -68 -11 l-60 -3 3 -200 3 -200 -101 1 -102 2 -2 98 c-1 75 -6 105 -19 125 -34 51 -107 64 -164 29 -41 -25 -57 -80 -51 -180 l4 -75 -103 0 -103 0 0 203 0 202 -66 0 c-50 0 -65 3 -62 13 2 8 61 65 132 128 72 63 171 151 220 196 50 45 94 81 97 80 4 -1 64 -54 135 -117z"/>
    </svg>
  );
}

function GymIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 600 400" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4030 2460 l0 -40 -55 0 c-47 0 -60 -4 -82 -26 -22 -22 -25 -32 -21 -74 6 -63 66 -185 114 -234 22 -21 69 -59 107 -83 37 -25 67 -49 67 -54 0 -4 29 -38 65 -74 93 -95 93 -96 -49 -220 -25 -22 -49 -49 -52 -60 -4 -11 -15 -26 -26 -33 -14 -10 -18 -23 -16 -50 l3 -37 275 0 275 0 3 32 c2 22 -3 38 -17 52 -11 11 -23 32 -27 46 -3 14 -10 25 -15 25 -5 0 -23 14 -41 30 -18 17 -49 43 -67 59 -27 22 -35 36 -35 62 0 29 12 46 91 124 50 50 117 108 150 131 93 65 162 188 163 290 0 69 -26 94 -98 94 l-51 0 -3 38 -3 37 -327 3 -328 2 0 -40z"/>
    </svg>
  );
}

function ProgressIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 600 400" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3290 2018 l0 -503 -30 -1 -30 -1 0 373 0 373 -96 3 c-53 2 -98 1 -100 -1 -2 -2 -4 -172 -4 -376 l0 -372 -30 -1 -30 -1 -2 267 -3 267 -102 3 -103 3 0 -269 0 -269 -30 0 -30 0 0 164 0 163 -105 0 -105 0 0 -163 0 -163 -34 4 c-24 3 -35 -1 -39 -12 -4 -9 -1 -19 6 -21 6 -3 269 -4 582 -3 499 3 570 5 570 18 0 11 -10 15 -37 14 l-38 -1 0 503 0 504 -105 0 -105 0 0 -502z m180 -15 l0 -488 -72 2 -73 2 -3 485 -2 486 75 0 75 0 0 -487z m-270 -130 l0 -358 -70 0 -70 0 0 358 0 357 70 0 70 0 0 -357z m-265 -104 l0 -251 -73 -1 -72 -2 0 253 0 252 73 0 73 0 -1 -251z m-265 -106 l0 -148 -71 2 -70 1 -2 146 -2 146 73 0 72 0 0 -147z"/>
    </svg>
  );
}

function ChallengesIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 600 400" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5592 2507 c-45 -14 -118 -81 -144 -130 -89 -175 45 -387 244 -387 146 1 254 101 266 247 12 157 -109 284 -268 282 -36 -1 -80 -6 -98 -12z m169 -29 c51 -15 114 -70 140 -121 40 -78 23 -195 -39 -260 -46 -49 -100 -71 -173 -72 -56 0 -73 4 -114 30 -27 17 -63 50 -80 73 -25 37 -30 55 -33 116 -5 88 15 135 80 190 63 54 137 69 219 44z"/>
    </svg>
  );
}

function ProfileIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 600 400" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1830 2470 c-11 -11 -20 -25 -20 -31 0 -7 -10 -5 -25 5 -39 25 -90 21 -114 -10 -39 -49 -27 -90 50 -170 l49 -50 -166 -172 -166 -173 -63 61 c-72 68 -105 76 -151 36 -34 -28 -38 -84 -9 -116 15 -16 15 -20 3 -20 -20 0 -46 -30 -48 -55 -5 -42 1 -57 29 -85 24 -24 26 -31 15 -41 -21 -17 -17 -76 6 -99 28 -28 69 -36 98 -19 23 13 28 12 55 -13 17 -16 40 -28 56 -28 32 0 71 25 71 46 0 18 10 17 34 -1 69 -52 166 40 121 113 -10 15 -39 48 -65 73 l-47 45 167 170 168 170 60 -58 c51 -49 66 -58 96 -58 69 0 109 73 71 127 -14 20 -13 24 16 53 26 26 30 36 25 63 -3 17 -19 44 -33 59 -23 25 -26 32 -15 48 19 32 14 74 -12 99 -26 25 -77 31 -100 11 -13 -10 -21 -8 -47 14 -37 31 -81 34 -109 6z"/>
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