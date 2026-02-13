import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { HelpCircle, Mail } from 'lucide-react';

export default function HelpSupportContent() {
  return (
    <div className="space-y-4 pb-20">
      {/* Support Email */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5 text-blue-400" />
            <Label className="text-sm font-bold text-white">Contact Support</Label>
          </div>
          <p className="text-sm text-slate-300 mb-2">Need help? Reach out to us at:</p>
          <a href="mailto:support@fitness.app" className="text-blue-400 hover:text-blue-300 font-medium">
            support@fitness.app
          </a>
        </div>
      </Card>

      {/* FAQ */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 shadow-2xl shadow-black/20">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <Label className="text-sm font-bold text-white">Frequently Asked Questions</Label>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-200">How do I reset my password?</p>
              <p className="text-xs text-slate-400">Click on the "Change Password" section in Account Settings to update your password.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">How do I delete my account?</p>
              <p className="text-xs text-slate-400">Go to the Settings page and click "Delete Account". This action is permanent and cannot be undone.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}