import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import PersistentRestTimer from './components/PersistentRestTimer';
import { TimerProvider } from './components/TimerContext';

// ─── Icons from uploaded SVG — all normalised to a 100×100 screen-unit square
// Original transform: translate(0,400) scale(0.1,-0.1)
//   screen_x = path_x * 0.1
//   screen_y = 400 − path_y * 0.1
// Each viewBox is centred on its icon so all render at identical visual size.

function HomeIcon({ color }) {
  // icon spans screen ≈ (8,171)→(70,218), centre (39,194) → viewBox "-11 144 100 100"
  return (
    <svg width="30" height="30" viewBox="-11 144 100 100"
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0,400) scale(0.1,-0.1)" fill={color} stroke="none">
        <path d="M363 2284 c-283 -251 -283 -251 -283 -284 0 -36 23 -50 85 -50 l46 0
-1 -197 -2 -198 136 -3 136 -3 0 113 c0 125 9 151 56 162 34 9 78 -9 93 -37 6
-12 12 -69 13 -127 l3 -105 133 -3 132 -3 0 203 0 203 48 -3 c36 -3 53 1 65
13 39 38 26 54 -217 274 -129 116 -239 211 -245 211 -6 0 -95 -75 -198 -166z
m333 6 c70 -63 170 -153 221 -199 51 -47 90 -88 86 -92 -5 -4 -35 -9 -68 -11
l-60 -3 3 -200 3 -200 -101 1 -102 2 -2 98 c-1 75 -6 105 -19 125 -34 51 -107
64 -164 29 -41 -25 -57 -80 -51 -180 l4 -75 -103 0 -103 0 0 203 0 202 -66 0
c-50 0 -65 3 -62 13 2 8 61 65 132 128 72 63 171 151 220 196 50 45 94 81 97
80 4 -1 64 -54 135 -117z"/>
        <path d="M462 2053 l3 -98 95 0 95 0 3 98 3 97 -101 0 -101 0 3 -97z m86 45
c-3 -28 -7 -32 -33 -32 -26 0 -30 4 -33 32 -3 31 -2 32 33 32 35 0 36 -1 33
-32z m90 0 c-3 -29 -7 -33 -35 -34 -31 -2 -33 0 -33 32 0 32 2 34 36 34 34 0
35 -1 32 -32z m-88 -88 c0 -28 -3 -30 -35 -30 -32 0 -35 2 -35 30 0 28 3 30
35 30 32 0 35 -2 35 -30z m90 0 c0 -28 -3 -30 -35 -30 -32 0 -35 2 -35 30 0
28 3 30 35 30 32 0 35 -2 35 -30z"/>
      </g>
    </svg>
  );
}

function GymIcon({ color }) {
  // icon spans screen ≈ (116,152)→(201,214), centre (158,183) → viewBox "108 133 100 100"
  return (
    <svg width="30" height="30" viewBox="108 133 100 100"
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0,400) scale(0.1,-0.1)" fill={color} stroke="none">
        <path d="M1830 2470 c-11 -11 -20 -25 -20 -31 0 -7 -10 -5 -25 5 -39 25 -90
21 -114 -10 -39 -49 -27 -90 50 -170 l49 -50 -166 -172 -166 -173 -63 61 c-72
68 -105 76 -151 36 -34 -28 -38 -84 -9 -116 15 -16 15 -20 3 -20 -20 0 -46
-30 -48 -55 -5 -42 1 -57 29 -85 24 -24 26 -31 15 -41 -21 -17 -17 -76 6 -99
28 -28 69 -36 98 -19 23 13 28 12 55 -13 17 -16 40 -28 56 -28 32 0 71 25 71
46 0 18 10 17 34 -1 69 -52 166 40 121 113 -10 15 -39 48 -65 73 l-47 45 167
170 168 170 60 -58 c51 -49 66 -58 96 -58 69 0 109 73 71 127 -14 20 -13 24
16 53 26 26 30 36 25 63 -3 17 -19 44 -33 59 -23 25 -26 32 -15 48 19 32 14
74 -12 99 -26 25 -77 31 -100 11 -13 -10 -21 -8 -47 14 -37 31 -81 34 -109 6z
m172 -117 c95 -94 109 -112 106 -137 -2 -19 -10 -32 -24 -37 -18 -6 -39 10
-133 104 -113 114 -130 145 -93 166 9 6 21 11 26 11 5 0 58 -48 118 -107z
m-84 -87 c154 -153 163 -165 160 -197 -2 -26 -9 -36 -31 -43 -27 -10 -34 -3
-194 156 -171 171 -186 194 -153 233 28 33 53 16 218 -149z m146 145 c17 -19
15 -61 -3 -61 -15 0 -63 59 -57 69 11 17 41 13 60 -8z m-236 -300 c-12 -14
-88 -92 -167 -173 l-145 -147 -27 26 -27 27 167 173 166 172 27 -26 28 -27
-22 -25z m-357 -318 c127 -127 159 -163 159 -185 0 -25 -31 -58 -54 -58 -5 0
-85 75 -178 167 -166 166 -185 192 -156 221 7 7 25 12 41 12 23 0 57 -28 188
-157z m-110 -90 c87 -85 109 -113 109 -135 0 -33 -31 -54 -57 -39 -38 20 -213
209 -213 229 0 17 33 52 49 52 2 0 53 -48 112 -107z m-51 -137 c0 -3 -14 -6
-30 -6 -37 0 -62 39 -41 64 11 13 17 10 42 -18 16 -19 29 -36 29 -40z"/>
      </g>
    </svg>
  );
}

function ProgressIcon({ color }) {
  // icon spans screen ≈ (255,192)→(340,249), centre (297,220) → viewBox "247 170 100 100"
  return (
    <svg width="30" height="30" viewBox="247 170 100 100"
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0,400) scale(0.1,-0.1)" fill={color} stroke="none">
        <path d="M3290 2018 l0 -503 -30 -1 -30 -1 0 373 0 373 -96 3 c-53 2 -98 1
-100 -1 -2 -2 -4 -172 -4 -376 l0 -372 -30 -1 -30 -1 -2 267 -3 267 -102 3
-103 3 0 -269 0 -269 -30 0 -30 0 0 164 0 163 -105 0 -105 0 0 -163 0 -163
-34 4 c-24 3 -35 -1 -39 -12 -4 -9 -1 -19 6 -21 6 -3 269 -4 582 -3 499 3 570
5 570 18 0 11 -10 15 -37 14 l-38 -1 0 503 0 504 -105 0 -105 0 0 -502z m180
-15 l0 -488 -72 2 -73 2 -3 485 -2 486 75 0 75 0 0 -487z m-270 -130 l0 -358
-70 0 -70 0 0 358 0 357 70 0 70 0 0 -357z m-265 -104 l0 -251 -73 -1 -72 -2
0 253 0 252 73 0 73 0 -1 -251z m-265 -106 l0 -148 -71 2 -70 1 -2 146 -2 146
73 0 72 0 0 -147z"/>
      </g>
    </svg>
  );
}

function ChallengesIcon({ color }) {
  // icon spans screen ≈ (396,149)→(468,251), centre (432,200) → viewBox "382 150 100 100"
  return (
    <svg width="30" height="30" viewBox="382 150 100 100"
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0,400) scale(0.1,-0.1)" fill={color} stroke="none">
        <path d="M4030 2460 l0 -40 -55 0 c-47 0 -60 -4 -82 -26 -22 -22 -25 -32 -21
-74 6 -63 66 -185 114 -234 22 -21 69 -59 107 -83 37 -25 67 -49 67 -54 0 -4
29 -38 65 -74 93 -95 93 -96 -49 -220 -25 -22 -49 -49 -52 -60 -4 -11 -15 -26
-26 -33 -14 -10 -18 -23 -16 -50 l3 -37 275 0 275 0 3 32 c2 22 -3 38 -17 52
-11 11 -23 32 -27 46 -3 14 -10 25 -15 25 -5 0 -23 14 -41 30 -18 17 -49 43
-67 59 -27 22 -35 36 -35 62 0 29 12 46 91 124 50 50 117 108 150 131 93 65
162 188 163 290 0 69 -26 94 -98 94 l-51 0 -3 38 -3 37 -327 3 -328 2 0 -40z
m623 -67 c-8 -116 -36 -248 -73 -338 -28 -66 -46 -92 -107 -153 -69 -69 -73
-75 -73 -119 0 -38 5 -50 33 -77 17 -17 43 -39 57 -48 24 -16 18 -17 -130 -17
-148 0 -154 1 -130 17 14 9 40 31 58 48 27 27 32 39 32 78 0 43 -4 50 -63 110
-35 35 -76 86 -91 112 -59 104 -106 295 -106 426 l0 38 299 0 299 0 -5 -77z
m-614 -94 c10 -78 38 -185 67 -253 15 -37 -86 46 -128 104 -21 30 -48 85 -59
122 -20 64 -20 70 -5 93 14 21 24 25 65 25 l48 0 12 -91z m755 75 c48 -47 -26
-226 -127 -305 -27 -22 -51 -38 -52 -37 -2 2 7 35 20 74 14 38 29 104 35 145
6 40 13 89 16 107 5 30 7 32 49 32 26 0 50 -6 59 -16z m-234 -781 c0 -17 -16
-18 -200 -18 -191 0 -218 4 -193 28 3 4 93 7 200 7 177 0 193 -1 193 -17z m43
-68 c5 -12 -29 -15 -239 -17 -135 -2 -248 0 -251 5 -14 23 23 27 247 27 200 0
239 -2 243 -15z"/>
        <path d="M4483 2381 c0 -16 -8 -42 -19 -58 l-19 -28 -3 26 c-6 55 -65 81 -106
48 -23 -18 -27 -27 -22 -53 l6 -31 -26 29 c-14 15 -28 41 -31 57 -8 39 -21 36
-39 -8 -21 -49 -12 -89 36 -161 22 -33 40 -71 40 -86 0 -35 -25 -95 -52 -123
-27 -29 -10 -30 26 -2 14 11 26 15 26 9 0 -6 12 -22 26 -35 28 -26 85 -34 113
-16 12 8 11 13 -8 28 -28 23 -38 87 -21 137 6 20 28 48 49 66 67 53 90 139 54
201 -22 37 -30 37 -30 0z m-179 -102 c72 -44 138 -27 181 45 l25 41 0 -37 c0
-55 -16 -88 -69 -139 -48 -46 -61 -76 -61 -143 0 -18 7 -41 15 -52 21 -27 19
-34 -10 -34 -15 0 -36 11 -51 27 -23 25 -24 31 -18 98 6 70 6 72 -24 107 -39
43 -52 77 -52 131 l0 42 17 -34 c9 -18 30 -42 47 -52z m110 59 c14 -23 -3 -52
-33 -56 -42 -6 -67 38 -39 66 17 17 58 11 72 -10z"/>
      </g>
    </svg>
  );
}

function ProfileIcon({ color }) {
  // icon spans screen ≈ (524,150)→(595,245), centre (559,197) → viewBox "509 147 100 100"
  return (
    <svg width="30" height="30" viewBox="509 147 100 100"
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0,400) scale(0.1,-0.1)" fill={color} stroke="none">
        <path d="M5592 2507 c-45 -14 -118 -81 -144 -130 -89 -175 45 -387 244 -387
146 1 254 101 266 247 12 157 -109 284 -268 282 -36 -1 -80 -6 -98 -12z m169
-29 c51 -15 114 -70 140 -121 40 -78 23 -195 -39 -260 -46 -49 -100 -71 -173
-72 -56 0 -73 4 -114 30 -27 17 -63 50 -80 73 -25 37 -30 55 -33 116 -5 88 15
135 80 190 63 54 137 69 219 44z"/>
        <path d="M5563 1895 c-184 -52 -320 -198 -326 -351 l-2 -59 383 -3 c378 -2
382 -2 382 18 0 20 -4 20 -366 18 l-366 -3 5 47 c14 119 125 241 261 288 74
25 161 33 235 21 60 -10 160 -51 209 -87 21 -16 22 -15 22 5 0 25 -59 65 -140
94 -73 26 -226 32 -297 12z"/>
      </g>
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

  const ACTIVE_COLOR   = '#3b82f6';
  const INACTIVE_COLOR = '#6b7280';

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
          <div className="flex justify-around items-center pt-2 h-[79px] px-1">
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
                  className="relative flex flex-col items-center justify-center gap-1 min-w-0 flex-1"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', background: 'none', border: 'none', transition: 'transform 60ms ease-in-out' }}
                  onFocus={clearFocusStyle}
                  onBlur={clearFocusStyle}
                  onMouseDown={e => { clearFocusStyle(e); e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'; }}
                  onMouseUp={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onMouseLeave={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                  onTouchStart={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 60ms ease-in-out'; e.currentTarget.style.transform = 'scale(0.82) translateY(3px)'; }}
                  onTouchEnd={e => { clearFocusStyle(e); e.currentTarget.style.transition = 'transform 350ms cubic-bezier(0.34,1.7,0.64,1)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                >
                  <div className="relative flex items-center justify-center w-8 h-8">
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