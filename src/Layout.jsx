import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Trophy, Dumbbell, Crown, MessageCircle, Users } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Gyms', icon: Dumbbell, page: 'Gyms', color: 'text-blue-500' },
    { name: 'Challenges', icon: Trophy, page: 'Challenges', color: 'text-orange-500' },
    { name: 'Groups', icon: Users, page: 'Groups', color: 'text-green-500' },
    { name: 'Messages', icon: MessageCircle, page: 'Messages', color: 'text-cyan-500' },
    { name: 'Profile', icon: Crown, page: 'Profile', color: 'text-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-purple-50">
      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden shadow-2xl">
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                aria-label={item.name}
                className={`
                  relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all
                  ${isActive 
                    ? `${item.color} scale-105` 
                    : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                {isActive && (
                  <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 ${item.color.replace('text-', 'bg-')} rounded-full`} />
                )}
                <div className={`${isActive ? 'bg-current bg-opacity-10 p-2 rounded-xl' : ''}`}>
                  <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-gray-900' : ''}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Side Navigation for Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white/95 backdrop-blur-lg border-r-2 border-gray-200 flex-col items-center py-8 z-50 shadow-lg">
        <Link to={createPageUrl('Gyms')} className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md hover:scale-105 transition-transform">
            <span className="text-xl font-black text-white">G</span>
          </div>
        </Link>
        
        <div className="flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all
                  ${isActive 
                    ? 'bg-green-100 text-green-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                `}
              >
                <item.icon className="w-6 h-6" />
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r-full" />
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