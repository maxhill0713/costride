import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, Users, Dumbbell } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Members', icon: Users, page: 'Members' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-purple-50">
      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-gray-200 z-50 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all
                  ${isActive 
                    ? 'text-green-500' 
                    : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-bold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Side Navigation for Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white/95 backdrop-blur-lg border-r-2 border-gray-200 flex-col items-center py-8 z-50 shadow-lg">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-md">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
        </div>
        
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
      <main className="pb-20 md:pb-0 md:pl-20">
        {children}
      </main>
    </div>
  );
}