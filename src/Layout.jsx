import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentRestTimer from './components/PersistentRestTimer';
import { TimerProvider } from './components/TimerContext';

// ─── CoStride custom SVG icons ───────────────────────────────────────────────
// Active palette
const A1 = '#7aa8e8';
const A2 = '#5580c8';
const A3 = '#3660a8';
const A4 = '#1e4488';
const A5 = '#102860';
// Inactive palette
const I2 = 'rgba(255,255,255,0.26)';
const I3 = 'rgba(255,255,255,0.09)';
const I4 = 'rgba(0,0,0,0.18)';
const I1 = 'rgba(255,255,255,0.40)';

function HomeIcon({ isActive }) {
  const c = isActive
    ? { roof: A3, body: A2, trim: A3, highlight: A1, windowFill: A5, windowDetail: A2, door: A5, doorknob: A3 }
    : { roof: I2, body: I2, trim: I2, highlight: I1, windowFill: I3, windowDetail: I2, door: I3, doorknob: I2 };
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect x="26" y="5" width="5.5" height="9" rx="2" fill={c.roof} />
      <rect x="3" y="18" width="34" height="20" rx="3" fill={c.body} />
      <path d="M20 3.5 L37.5 18 L2.5 18 Z" fill={c.trim} opacity={isActive ? 1 : 0.75} />
      <path d="M20 3.5 L2.5 18" stroke={c.highlight} strokeWidth="1.6" strokeLinecap="round" opacity={isActive ? 0.55 : 0.3} />
      <rect x="7" y="22" width="10" height="8" rx="1.5" fill={c.windowFill} />
      <rect x="11.5" y="22" width="1.2" height="8" rx="0.4" fill={c.windowDetail} opacity={isActive ? 0.5 : 0.35} />
      <rect x="7" y="25.8" width="10" height="1.2" rx="0.4" fill={c.windowDetail} opacity={isActive ? 0.5 : 0.35} />
      <rect x="23" y="22" width="10" height="8" rx="1.5" fill={c.windowFill} />
      <rect x="27.5" y="22" width="1.2" height="8" rx="0.4" fill={c.windowDetail} opacity={isActive ? 0.5 : 0.35} />
      <rect x="23" y="25.8" width="10" height="1.2" rx="0.4" fill={c.windowDetail} opacity={isActive ? 0.5 : 0.35} />
      <path d="M16.5 38 L16.5 32 Q16.5 27.5 20 27.5 Q23.5 27.5 23.5 32 L23.5 38 Z" fill={c.door} />
      <circle cx="22.5" cy="33.5" r="1" fill={c.doorknob} />
    </svg>
  );
}

function GymsIcon({ isActive }) {
  const f = isActive ? A2 : I2;
  const d = isActive ? A4 : I4;
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect x="1" y="8" width="10" height="24" rx="3.5" fill={f} />
      <rect x="7.5" y="12" width="1.5" height="16" rx="0.8" fill={d} />
      <rect x="11" y="13.5" width="5.5" height="13" rx="2" fill={f} />
      <rect x="16.5" y="17" width="7" height="6" rx="3" fill={f} />
      <rect x="18.5" y="17.5" width="1" height="5" rx="0.5" fill={d} />
      <rect x="20.5" y="17.5" width="1" height="5" rx="0.5" fill={d} />
      <rect x="23.5" y="13.5" width="5.5" height="13" rx="2" fill={f} />
      <rect x="29" y="8" width="10" height="24" rx="3.5" fill={f} />
      <rect x="31" y="12" width="1.5" height="16" rx="0.8" fill={d} />
    </svg>
  );
}

function ProgressIcon({ isActive }) {
  const bar = isActive ? A2 : I2;
  const base = isActive ? A3 : I2;
  const line = isActive ? A1 : I1;
  const dotOuter = isActive ? A3 : I3;
  const dotInner = isActive ? A1 : I1;
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="35" width="36" height="2.5" rx="1.25" fill={base} opacity={isActive ? 1 : 0.5} />
      <rect x="3" y="24" width="9" height="11" rx="3" fill={bar} />
      <rect x="15.5" y="15" width="9" height="20" rx="3" fill={bar} />
      <rect x="28" y="6" width="9" height="29" rx="3" fill={bar} />
      <path d="M7.5 23 L20 14 L32.5 5.5" stroke={line} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity={isActive ? 0.85 : 0.5} />
      <circle cx="32.5" cy="5.5" r="2.5" fill={dotOuter} />
      <circle cx="32.5" cy="5.5" r="1.2" fill={dotInner} opacity={isActive ? 1 : 0.7} />
    </svg>
  );
}

function ChallengesIcon({ isActive }) {
  const cup = isActive ? A2 : I2;
  const star = isActive ? A4 : I4;
  const starOpacity = isActive ? 0.7 : 0.5;
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <path d="M10.5 3 L29.5 3 L29.5 20 Q29.5 31.5 20 31.5 Q10.5 31.5 10.5 20 Z" fill={cup} />
      <path d="M10.5 8.5 Q3 8.5 3 15.5 Q3 22.5 10.5 22.5 L10.5 18.5 Q7.5 18.5 7.5 15.5 Q7.5 12.5 10.5 12.5 Z" fill={cup} />
      <path d="M29.5 8.5 Q37 8.5 37 15.5 Q37 22.5 29.5 22.5 L29.5 12.5 Q32.5 12.5 32.5 15.5 Q32.5 18.5 29.5 18.5 Z" fill={cup} />
      <path d="M20 10.5 L21.5 15 L26 15.3 L22.7 18 L23.8 22.5 L20 20 L16.2 22.5 L17.3 18 L14 15.3 L18.5 15 Z" fill={star} opacity={starOpacity} />
      <rect x="18" y="31.5" width="4" height="3.5" rx="0.8" fill={cup} />
      <rect x="12" y="35" width="16" height="4" rx="3" fill={cup} />
    </svg>
  );
}

function ProfileIcon({ isActive }) {
  const f = isActive ? A2 : I2;
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="13" r="9.5" fill={f} />
      <path d="M4 40 C4 28.5 11 23 20 23 C29 23 36 28.5 36 40 Z" fill={f} />
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

  // Rest timer effect
  React.useEffect(() => {
    let interval;
    if (isTimerActive && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((t) => t - 1);
      }, 1000);
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

  // navItems — icon is now a React component accepting { isActive }
  const navItems = isDashboardUser
    ? [
        { name: 'Dashboard', icon: ({ isActive }) => <Building2 className={`w-7 h-7 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />, page: 'GymOwnerDashboard', activeColor: 'text-orange-500' },
        { name: 'Gyms',      icon: GymsIcon, page: 'Gyms', activeColor: 'text-[#7aa8e8]' }
      ]
    : [
        { name: 'Home',       icon: HomeIcon,       page: 'Home',         activeColor: 'text-[#7aa8e8]' },
        { name: 'Gyms',       icon: GymsIcon,       page: 'Gyms',         activeColor: 'text-[#7aa8e8]' },
        { name: 'Progress',   icon: ProgressIcon,   page: 'Progress',     activeColor: 'text-[#7aa8e8]' },
        { name: 'Challenges', icon: ChallengesIcon, page: 'RedeemReward', activeColor: 'text-[#7aa8e8]' },
        { name: 'Profile',    icon: ProfileIcon,    page: 'Profile',      activeColor: 'text-[#7aa8e8]' }
      ];

  // Preserve tab navigation history
  useEffect(() => {
    const currentTab = navItems.find((item) => item.page === currentPageName);
    if (currentTab) {
      setTabHistory((prev) => ({
        ...prev,
        [currentTab.page]: location.pathname + location.search
      }));
      setLastTabPage((prev) => ({
        ...prev,
        [currentTab.page]: currentPageName
      }));
    }
  }, [currentPageName, location]);

  const getTabLink = (item) => {
    return tabHistory[item.page] || createPageUrl(item.page) + (item.params || '');
  };

  const handleTabClick = (item, e) => {
    if (currentPageName === item.page) {
      e.preventDefault();
      if (item.page === 'Home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
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
              return (
                <Link
                  key={item.page}
                  to={getTabLink(item)}
                  onClick={(e) => {
                    handleTabClick(item, e);
                    if ('vibrate' in navigator) navigator.vibrate([12, 8, 12]);
                  }}
                  aria-label={item.name}
                  className="relative flex flex-col items-center justify-start gap-1 px-3 py-1 min-w-0 flex-1 rounded-xl"
                  style={{ transition: 'transform 60ms ease-in-out' }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'}
                  onMouseUp={e => { e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onTouchStart={e => { e.currentTarget.style.transition = 'transform 60ms ease-in-out'; e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'; }}
                  onTouchEnd={e => { e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                >
                  <div
                    className="relative"
                    style={isActive ? { filter: 'drop-shadow(0 1px 6px rgba(85,128,200,0.45))' } : {}}
                  >
                    <IconComponent isActive={isActive} />
                    {item.badge > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 animate-ios-bounce">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold leading-none"
                    style={{ color: isActive ? A1 : 'rgba(255,255,255,0.35)' }}
                  >
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
          <Link to={createPageUrl('Gyms')} className="mb-8 hover:animate-ios-spring-in">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-3 transition-all duration-300">
              <span className="text-2xl font-black text-white">G</span>
            </div>
          </Link>

          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.page}
                  to={getTabLink(item)}
                  onClick={(e) => handleTabClick(item, e)}
                  className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                    isActive ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div
                    className="relative"
                    style={isActive ? { filter: 'drop-shadow(0 1px 6px rgba(85,128,200,0.45))' } : {}}
                  >
                    <IconComponent isActive={isActive} />
                    {item.badge > 0 && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#5580c8] rounded-r-full shadow-lg" />
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
