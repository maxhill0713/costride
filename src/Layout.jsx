import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Trophy, Dumbbell, Crown, MessageCircle, Users, Bell, Building2, Home, Flame, Award, MoreVertical, Gift, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentRestTimer from './components/PersistentRestTimer';
import { TimerProvider } from './components/TimerContext';

// ── Tab accent colors per item ─────────────────────────────────────────────
const TAB_ACCENTS = {
  Home:          { pill: 'rgba(99,102,241,0.18)',  border: 'rgba(99,102,241,0.5)',  floor: '#312e81', icon: '#818cf8' },
  Gyms:          { pill: 'rgba(14,165,233,0.15)',  border: 'rgba(14,165,233,0.45)', floor: '#0c4a6e', icon: '#38bdf8' },
  Progress:      { pill: 'rgba(34,197,94,0.14)',   border: 'rgba(34,197,94,0.4)',   floor: '#14532d', icon: '#4ade80' },
  RedeemReward:  { pill: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  floor: '#78350f', icon: '#fbbf24' },
  Profile:       { pill: 'rgba(236,72,153,0.14)',  border: 'rgba(236,72,153,0.4)',  floor: '#831843', icon: '#f472b6' },
  // gym owner
  GymOwnerDashboard: { pill: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.4)', floor: '#7c2d12', icon: '#fb923c' },
};

const NAV_ANIM_CSS = `
@keyframes nav-pip-in {
  from { transform: scaleX(0); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}
@keyframes nav-icon-up {
  from { transform: translateY(0) scale(1); }
  to   { transform: translateY(-2px) scale(1.12); }
}
`;

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [tabHistory, setTabHistory] = useState({});
  const [lastTabPage, setLastTabPage] = useState({});
  const [restTimer, setRestTimer] = useState('');
  const [initialRestTime, setInitialRestTime] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [pressedTab, setPressedTab] = useState(null);

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

  const isGymOwner = currentUser?.account_type === 'gym_owner';

  const navItems = isGymOwner ? [
    { name: 'Dashboard', icon: Building2, page: 'GymOwnerDashboard' },
    { name: 'Gyms',      icon: Dumbbell,  page: 'Gyms' },
  ] : [
    { name: 'Home',       icon: Home,     page: 'Home' },
    { name: 'Gyms',       icon: Dumbbell, page: 'Gyms' },
    { name: 'Progress',   icon: BarChart3, page: 'Progress' },
    { name: 'Challenges', icon: Gift,     page: 'RedeemReward' },
    { name: 'Profile',    icon: Crown,    page: 'Profile' },
  ];

  useEffect(() => {
    const currentTab = navItems.find(item => item.page === currentPageName);
    if (currentTab) {
      setTabHistory(prev => ({ ...prev, [currentTab.page]: location.pathname + location.search }));
      setLastTabPage(prev => ({ ...prev, [currentTab.page]: currentPageName }));
    }
  }, [currentPageName, location]);

  const hideNavigation = currentPageName === 'Onboarding' || currentPageName === 'GymSignup' || currentPageName === 'MemberSignup';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id, read: false }),
    enabled: !!currentUser && currentUser.id !== 'guest',
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000
  });

  const unreadCount = notifications.length;

  React.useEffect(() => {
    let interval;
    if (isTimerActive && restTimer > 0) {
      interval = setInterval(() => { setRestTimer(t => t - 1); }, 1000);
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

  const getTabLink = item => tabHistory[item.page] || createPageUrl(item.page) + (item.params || '');
  const handleTabClick = (item, e) => { if (currentPageName === item.page) e.preventDefault(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950">
      <style>{NAV_ANIM_CSS}</style>

      {/* ── MOBILE BOTTOM NAV ── */}
      {!hideNavigation && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]"
          style={{
            background: 'linear-gradient(180deg, rgba(8,12,28,0.82) 0%, rgba(4,7,18,0.97) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 -1px 0 rgba(255,255,255,0.04), 0 -8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Subtle top-edge shimmer line */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 70%, transparent)',
            pointerEvents: 'none',
          }} />

          <div className="flex justify-around items-center px-1 pt-2 pb-1" style={{ height: 64 }}>
            {navItems.map((item, idx) => {
              const isActive = currentPageName === item.page;
              const accent = TAB_ACCENTS[item.page] || TAB_ACCENTS['Home'];
              const isPressed = pressedTab === item.page;

              return (
                <Link
                  key={item.page}
                  to={getTabLink(item)}
                  onClick={e => handleTabClick(item, e)}
                  onTouchStart={() => setPressedTab(item.page)}
                  onTouchEnd={() => setPressedTab(null)}
                  onMouseDown={() => setPressedTab(item.page)}
                  onMouseUp={() => setPressedTab(null)}
                  onMouseLeave={() => setPressedTab(null)}
                  aria-label={item.name}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    padding: '4px 4px 2px',
                    borderRadius: 14,
                    position: 'relative',
                    textDecoration: 'none',
                    // Duolingo 3D press
                    transform: isPressed ? 'translateY(2px) scale(0.88)' : 'translateY(0) scale(1)',
                    transition: isPressed
                      ? 'transform 0.06s ease'
                      : 'transform 0.32s cubic-bezier(0.34,1.7,0.64,1)',
                  }}
                >
                  {/* Active pill background — sits behind icon */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: 2, left: 4, right: 4, bottom: 2,
                      borderRadius: 12,
                      background: accent.pill,
                      border: `1px solid ${accent.border}`,
                      borderBottom: `3px solid ${accent.floor}`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.3)`,
                      pointerEvents: 'none',
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1)',
                  }}>
                    <item.icon
                      style={{
                        width: 22, height: 22,
                        color: isActive ? accent.icon : 'rgba(148,163,184,0.55)',
                        strokeWidth: isActive ? 2.4 : 1.8,
                        filter: isActive ? `drop-shadow(0 0 6px ${accent.icon}88)` : 'none',
                        transition: 'color 0.2s, filter 0.2s',
                      }}
                    />
                    {/* Notification badge */}
                    {item.page === 'Notifications' && unreadCount > 0 && (
                      <div style={{
                        position: 'absolute', top: -4, right: -5,
                        width: 16, height: 16,
                        background: '#ef4444',
                        borderRadius: '50%',
                        fontSize: 9, fontWeight: 900, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid rgba(4,7,18,0.97)',
                        boxShadow: '0 0 0 1px rgba(239,68,68,0.4)',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span style={{
                    position: 'relative', zIndex: 1,
                    fontSize: 10,
                    fontWeight: isActive ? 800 : 500,
                    letterSpacing: isActive ? '-0.01em' : '0',
                    color: isActive ? accent.icon : 'rgba(100,116,139,0.7)',
                    lineHeight: 1,
                    transition: 'color 0.2s, font-weight 0.2s',
                  }}>
                    {item.name}
                  </span>

                  {/* Active dot pip under label */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      bottom: 1,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 18,
                      height: 2.5,
                      borderRadius: 99,
                      background: accent.icon,
                      boxShadow: `0 0 6px ${accent.icon}`,
                      opacity: 0.8,
                      transformOrigin: 'center',
                      animation: 'nav-pip-in 0.25s cubic-bezier(0.34,1.4,0.64,1) both',
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── DESKTOP SIDE NAV (unchanged behavior, refined style) ── */}
      {!hideNavigation && (
        <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-8 z-50"
          style={{
            background: 'linear-gradient(180deg, rgba(8,12,28,0.95) 0%, rgba(4,7,18,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '2px 0 24px rgba(0,0,0,0.4)',
          }}>
          <Link to={createPageUrl('Gyms')} className="mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-3 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899, #f59e0b)' }}>
              <span className="text-xl font-black text-white">G</span>
            </div>
          </Link>
          <div className="flex flex-col gap-2">
            {navItems.map(item => {
              const isActive = currentPageName === item.page;
              const accent = TAB_ACCENTS[item.page] || TAB_ACCENTS['Home'];
              return (
                <Link
                  key={item.page}
                  to={getTabLink(item)}
                  onClick={e => handleTabClick(item, e)}
                  style={{
                    position: 'relative',
                    width: 52, height: 52,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? accent.pill : 'transparent',
                    border: isActive ? `1px solid ${accent.border}` : '1px solid transparent',
                    borderBottom: isActive ? `3px solid ${accent.floor}` : '3px solid transparent',
                    boxShadow: isActive ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.4)` : 'none',
                    transition: 'all 0.2s',
                  }}
                  className="hover:bg-white/5"
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: '0 3px 3px 0',
                      background: accent.icon,
                      boxShadow: `0 0 8px ${accent.icon}`,
                    }} />
                  )}
                  <item.icon style={{
                    width: 22, height: 22,
                    color: isActive ? accent.icon : 'rgba(100,116,139,0.6)',
                    filter: isActive ? `drop-shadow(0 0 5px ${accent.icon}88)` : 'none',
                    strokeWidth: isActive ? 2.4 : 1.8,
                  }} />
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main
        className={hideNavigation ? '' : 'md:pb-0 md:pl-20'}
        style={hideNavigation ? {} : { paddingBottom: 'calc(4rem + env(safe-area-inset-bottom) + 16px)' }}
      >
        <ErrorBoundary>
          <TimerProvider value={{ restTimer, setRestTimer, isTimerActive, setIsTimerActive, initialRestTime, setInitialRestTime }}>
            <PageTransition key={currentPageName}>
              {children}
            </PageTransition>
          </TimerProvider>
        </ErrorBoundary>
      </main>

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
