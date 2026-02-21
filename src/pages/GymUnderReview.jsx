import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createPageUrl } from '../utils';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GymUnderReview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700/50">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-12 h-12 text-amber-400" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">Under Review</h2>
        
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-semibold text-amber-300 mb-1">Email Verification Pending</p>
              <p className="text-xs text-amber-200">
                We're verifying your gym ownership. This typically takes 24 hours.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-xs text-slate-300">
                Your gym has been created and you can start building your community while we verify your domain.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-slate-300 text-sm">Once verified, your gym will:</p>
          <ul className="text-left space-y-2">
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Get a verified badge
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Be featured in search results
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Unlock admin features
            </li>
          </ul>
        </div>

        <Button 
          onClick={() => window.location.href = createPageUrl('GymOwnerDashboard')}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl h-12"
        >
          Go to Dashboard
        </Button>

        <p className="text-xs text-slate-500 mt-4">
          We'll email you at the address you registered with once verification is complete.
        </p>
      </Card>
    </div>
  );
}