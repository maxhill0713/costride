import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const FUNCTIONS = [
  { name: 'Logged Workouts (Lift)', fn: 'saveSupabaseLift' },
  { name: 'Check-ins', fn: 'saveSupabaseCheckIn' },
  { name: 'Memberships', fn: 'saveSupabaseMembership' },
  { name: 'Goals', fn: 'saveSupabaseGoal' },
  { name: 'Coach', fn: 'saveSupabaseCoach' },
  { name: 'Events', fn: 'saveSupabaseEvent' },
  { name: 'Achievements', fn: 'saveSupabaseAchievement' },
  { name: 'Challenges', fn: 'saveSupabaseChallenge' },
  { name: 'Challenge Participants', fn: 'saveSupabaseChallengeParticipant' },
  { name: 'Posts', fn: 'saveSupabasePost' },
  { name: 'Messages', fn: 'saveSupabaseMessage' },
  { name: 'Notifications', fn: 'saveSupabaseNotification' },
  { name: 'Payments', fn: 'saveSupabasePayment' },
  { name: 'Payment Methods', fn: 'saveSupabasePaymentMethod' },
  { name: 'Rewards', fn: 'saveSupabaseReward' },
  { name: 'Gym Classes', fn: 'saveSupabaseGymClass' },
  { name: 'Brand Discount Codes', fn: 'saveSupabaseBrandDiscountCode' },
];

export default function FunctionStatus() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(null);

  const testFunction = async (fn, displayName) => {
    setTesting(displayName);
    try {
      const response = await base44.functions.invoke(fn, {
        test: true,
        test_timestamp: new Date().toISOString()
      });
      setResults(prev => ({
        ...prev,
        [fn]: { status: 'success', message: 'Working' }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [fn]: { status: 'error', message: error?.message || 'Failed' }
      }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 mb-20">
      <h1 className="text-3xl font-bold mb-2 text-white">Function Status Checker</h1>
      <p className="text-slate-300 mb-6">Test each Supabase save function to see which ones are working</p>

      <div className="grid gap-3">
        {FUNCTIONS.map(({ name, fn }) => {
          const result = results[fn];
          const isLoading = testing === name;

          return (
            <Card key={fn} className="p-4 bg-slate-800/50 border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {result?.status === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
                {result?.status === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                {!result && (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                )}
                
                <div>
                  <div className="text-white font-medium">{name}</div>
                  {result && (
                    <div className={`text-sm ${result.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {result.message}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => testFunction(fn, name)}
                disabled={isLoading}
                size="sm"
                className="ml-2"
                variant={result?.status === 'success' ? 'default' : 'outline'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Testing...
                  </>
                ) : (
                  'Test'
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-slate-300 text-sm">
        <p className="font-semibold mb-2">Summary:</p>
        <p>✓ {Object.values(results).filter(r => r.status === 'success').length} working</p>
        <p>✗ {Object.values(results).filter(r => r.status === 'error').length} failing</p>
        <p>- {FUNCTIONS.length - Object.values(results).length} untested</p>
      </div>
    </div>
  );
}