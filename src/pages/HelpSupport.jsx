import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Mail, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function HelpSupport() {
  const supportEmail = 'support@gymfuel.app';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Settings')}>
            <div className="flex items-center justify-center w-10 h-10">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">Help & Support</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Support Card */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-8 shadow-2xl shadow-black/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Get Help</h2>
              <p className="text-slate-400 mt-1">Have questions or feedback? We're here to help!</p>
            </div>
          </div>

          <p className="text-slate-300 mb-8 leading-relaxed">
            If you have any questions, suggestions, or need assistance with your account, feel free to reach out to our support team. We typically respond within 24 hours.
          </p>

          {/* Email Contact */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Email Us</h3>
              </div>
              <a
                href={`mailto:${supportEmail}`}
                className="text-blue-400 hover:text-blue-300 font-semibold text-lg break-all transition-colors"
              >
                {supportEmail}
              </a>
              <p className="text-slate-400 text-sm mt-3">
                Click above to send us an email with your questions, feedback, or concerns.
              </p>
            </div>
          </div>
        </Card>

        {/* FAQ Card */}
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
          <h3 className="text-lg font-bold text-white mb-4">Common Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="text-white font-semibold mb-1">How do I reset my password?</p>
              <p className="text-slate-400 text-sm">You can reset your password by going to your Account settings and selecting "Change Password".</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-white font-semibold mb-1">How do I delete my account?</p>
              <p className="text-slate-400 text-sm">You can delete your account in Settings under "Danger Zone". This action is permanent and cannot be undone.</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-white font-semibold mb-1">Still need help?</p>
              <p className="text-slate-400 text-sm">Email us at {supportEmail} and we'll be happy to assist you!</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}