import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '../utils';

import { Button } from '@/components/ui/button';

export default function SubscriptionSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Settings')}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-700/60 transition-colors active:scale-95">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Subscriptions</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Coming Soon</p>
            <p className="text-slate-400 mt-2">Subscription settings will be available here</p>
          </div>
        </div>
      </div>
    </div>
  );
}