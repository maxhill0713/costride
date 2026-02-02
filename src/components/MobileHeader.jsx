import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileHeader({ currentPageName }) {
  // Pages that should show a back button
  const backButtonPages = {
    'Settings': 'Profile',
    'UserProfile': 'Profile',
    'GymCommunity': 'Gyms',
    'GymRewards': 'Gyms',
    'Leaderboard': 'Home',
    'Notifications': 'Home',
    'Messages': 'Home',
    'Premium': 'Home',
    'Plus': 'Home',
  };

  const backPage = backButtonPages[currentPageName];
  const showHeader = ['Onboarding', 'GymSignup', 'MemberSignup'].includes(currentPageName) === false;

  if (!showHeader) return null;

  return (
    <div className="sticky top-0 z-40 md:hidden bg-gradient-to-b from-slate-900 via-slate-900 to-transparent backdrop-blur-md border-b border-slate-700/50">
      <div className="h-14 px-4 flex items-center justify-between">
        {backPage ? (
          <Link to={createPageUrl(backPage)}>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg h-10 w-10 min-h-[44px] min-w-[44px]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
        ) : (
          <div className="w-10" />
        )}
        
        <h1 className="text-sm font-bold text-white flex-1 text-center">{currentPageName}</h1>
        
        <div className="w-10" />
      </div>
    </div>
  );
}