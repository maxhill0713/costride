import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Trophy, Dumbbell, Crown, MessageCircle, Users, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: currentUser.id, read: false }),
    enabled: !!currentUser
  });

  const unreadCount = notifications.length;

  const navItems = [
    { name: 'Home', icon: Dumbbell, page: 'Home', color: 'text-indigo-500' },
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms', color: 'text-blue-500' },
    { name: 'Challenges', icon: Trophy, page: 'Challenges', color: 'text-orange-500' },
    { name: 'Leaderboards', icon: Trophy, page: 'Leaderboards', color: 'text-yellow-500' },
    { name: 'Notifications', icon: Bell, page: 'Notifications', color: 'text-purple-500', badge: unreadCount },
    { name: 'Profile', icon: Crown, page: 'Profile', color: 'text-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                aria-label={item.name}
                className={`
                  relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'scale-105' 
                    : 'text-gray-400 hover:text-gray-600 hover:scale-105'}
                `}
              >
                {isActive && (
                  <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1.5 ${item.color.replace('text-', 'bg-')} rounded-full shadow-lg`} />
                )}
                <div className={`relative ${isActive ? `bg-gradient-to-br ${item.color.replace('text-', 'from-')}-100 ${item.color.replace('text-', 'to-')}-200 p-2.5 rounded-2xl shadow-sm` : 'p-2'}`}>
                  <item.icon className={`w-6 h-6 ${isActive ? item.color : ''} transition-all duration-300`} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                      {item.badge > 9 ? '9+' : item.badge}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-gray-900' : ''} transition-colors`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Side Navigation for Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 flex-col items-center py-8 z-50 shadow-xl">
        <Link to={createPageUrl('Gyms')} className="mb-8">
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
                to={createPageUrl(item.page)}
                className={`
                  relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                  ${isActive 
                    ? `bg-gradient-to-br ${item.color.replace('text-', 'from-')}-100 ${item.color.replace('text-', 'to-')}-200 ${item.color} shadow-md scale-110` 
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 hover:scale-105'}
                `}
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                      {item.badge > 9 ? '9+' : item.badge}
                    </div>
                  )}
                </div>
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 ${item.color.replace('text-', 'bg-')} rounded-r-full shadow-lg`} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24 md:pb-0 md:pl-20">
        {children}
      </main>
    </div>
  );
}