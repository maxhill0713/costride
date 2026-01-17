import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Base44 handles password reset through the login page
    // Redirect to login which has the password reset functionality
    window.location.href = '/auth/login?mode=reset';
    setSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {sent ? 'Check Your Email' : 'Reset Password'}
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Password reset instructions have been sent to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Check your inbox and follow the link to reset your password.
            </p>
            <Button
              onClick={onClose}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Got it
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-gray-700">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <div>
              <Label htmlFor="reset-email" className="text-gray-700 font-semibold">
                Email Address
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}