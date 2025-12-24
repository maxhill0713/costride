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
    <div className="min-h-screen bg-zinc-950">
      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 z-50 md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all
                  ${isActive 
                    ? 'text-lime-400' 
                    : 'text-zinc-500 hover:text-zinc-300'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Side Navigation for Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-zinc-900/50 backdrop-blur-lg border-r border-zinc-800 flex-col items-center py-8 z-50">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-orange-400 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-zinc-900" />
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
                  relative flex items-center justify-center w-12 h-12 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-lime-400/10 text-lime-400' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-lime-400 rounded-r-full" />
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