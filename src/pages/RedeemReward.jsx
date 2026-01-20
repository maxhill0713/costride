import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Gift, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function RedeemReward() {
  const [code, setCode] = useState('');
  const [claimedBonus, setClaimedBonus] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, checking, valid, invalid, redeemed
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Get code from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrCode = urlParams.get('code');
    if (qrCode) {
      setCode(qrCode);
      handleVerify(qrCode);
    }
  }, []);

  const redeemMutation = useMutation({
    mutationFn: async (bonusId) => {
      return await base44.entities.ClaimedBonus.update(bonusId, {
        redeemed: true,
        redeemed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setStatus('redeemed');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#3b82f6']
      });
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses'] });
    }
  });

  const handleVerify = async (codeToVerify) => {
    const verifyCode = codeToVerify || code;
    if (!verifyCode) return;

    setStatus('checking');

    try {
      const allBonuses = await base44.entities.ClaimedBonus.list();
      const bonus = allBonuses.find(b => b.redemption_code === verifyCode);

      if (!bonus) {
        setStatus('invalid');
        setClaimedBonus(null);
        return;
      }

      if (bonus.redeemed) {
        setStatus('already_redeemed');
        setClaimedBonus(bonus);
        return;
      }

      setStatus('valid');
      setClaimedBonus(bonus);
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('invalid');
    }
  };

  const handleRedeem = () => {
    if (claimedBonus && !claimedBonus.redeemed) {
      redeemMutation.mutate(claimedBonus.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Redeem Reward</h1>
          <p className="text-slate-300">Enter the redemption code to verify</p>
        </div>

        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Redemption Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter code..."
                  className="bg-slate-800/50 border-slate-600 text-white rounded-xl"
                  maxLength={20}
                />
                <Button
                  onClick={() => handleVerify()}
                  disabled={!code || status === 'checking'}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {status === 'checking' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-blue-900 font-semibold">Verifying code...</p>
              </Card>
            </motion.div>
          )}

          {status === 'invalid' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 p-8 text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-red-900 mb-2">Invalid Code</h3>
                <p className="text-red-700">This redemption code is not valid</p>
              </Card>
            </motion.div>
          )}

          {status === 'already_redeemed' && claimedBonus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 p-8 text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-orange-900 mb-2">Already Redeemed</h3>
                <p className="text-orange-700 mb-1">This reward was already redeemed</p>
                <p className="text-sm text-orange-600">
                  {new Date(claimedBonus.redeemed_date).toLocaleString()}
                </p>
              </Card>
            </motion.div>
          )}

          {status === 'valid' && claimedBonus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-green-900 mb-2">Valid Reward</h3>
                  <p className="text-green-700">Ready to redeem</p>
                </div>

                <div className="bg-white rounded-2xl p-6 mb-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎁</div>
                    <h4 className="font-bold text-gray-900 text-lg">{claimedBonus.offer_details}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Claimed: {new Date(claimedBonus.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleRedeem}
                  disabled={redeemMutation.isPending}
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold text-lg"
                >
                  {redeemMutation.isPending ? 'Redeeming...' : 'Confirm Redemption'}
                </Button>
              </Card>
            </motion.div>
          )}

          {status === 'redeemed' && claimedBonus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
                </motion.div>
                <h3 className="text-3xl font-black text-green-900 mb-2">Redeemed Successfully!</h3>
                <p className="text-green-700 text-lg mb-6">The reward has been redeemed</p>
                
                <div className="bg-white rounded-2xl p-6">
                  <div className="text-4xl mb-3">🎉</div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">{claimedBonus.offer_details}</h4>
                  <p className="text-sm text-gray-600">
                    Redeemed: {new Date().toLocaleString()}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}