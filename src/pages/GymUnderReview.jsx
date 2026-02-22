import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createPageUrl } from '../utils';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GymUnderReview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-800/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />
      <Card className="max-w-md w-full p-6 text-center bg-slate-800/50 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40 relative z-10">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
          alt="CoStride Logo"
          className="w-12 h-12 rounded-2xl mx-auto mb-3 object-cover shadow-2xl shadow-blue-500/30"
        />
        
        <h2 className="text-xl font-black text-white mb-3">Under Review</h2>
        
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-semibold text-amber-300 mb-1">Email Verification Pending</p>
              <p className="text-xs text-amber-100">
                We're verifying your gym ownership. This typically takes 24 hours.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-xs text-slate-200">
                Your gym has been created and you can start building your community while we verify your domain.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-slate-200 text-sm">Once verified, your gym will:</p>
          <ul className="text-left space-y-1.5">
            <li className="flex items-center gap-2 text-sm text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Get a verified badge
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Be featured in search results
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Unlock admin features
            </li>
          </ul>
        </div>

        <Button 
          onClick={() => window.location.href = createPageUrl('GymOwnerDashboard')}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl h-12"
        >
          Go to Dashboard
        </Button>

        <p className="text-xs text-slate-400 mt-4">
          We'll email you at the address you registered with once verification is complete.
        </p>
      </Card>
    </div>
  );
}