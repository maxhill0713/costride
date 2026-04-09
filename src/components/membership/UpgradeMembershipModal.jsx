import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function UpgradeMembershipModal({ open, onClose, currentUser }) {
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      return base44.auth.updateMe({
        has_premium: true,
        premium_expires: expirationDate.toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      onClose();
    }
  });

  const freeFeatures = [
    { ok: true, text: 'View gym community' },
    { ok: true, text: 'Browse classes & events' },
    { ok: false, text: 'No leaderboard access' },
    { ok: false, text: 'No rewards program' },
    { ok: false, text: 'Limited check-ins' },
  ];

  const premiumFeatures = [
    'Everything in Free',
    'Full leaderboard access',
    'Earn & claim rewards',
    'Unlimited check-ins',
    'Join challenges',
    'Track personal records',
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="upgrade-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <motion.div
            key="upgrade-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(160deg, #0c1128 0%, #060810 100%)',
              border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
              paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Crown style={{ width: 22, height: 22, color: '#facc15' }} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Upgrade to Premium</h2>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Plans side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Free Plan */}
                <div style={{ padding: 16, borderRadius: 18, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Free</h3>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9' }}>£0</div>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>Basic access</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {freeFeatures.map(({ ok, text }) => (
                      <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {ok
                          ? <Check style={{ width: 14, height: 14, color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                          : <X style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />}
                        <span style={{ fontSize: 12, color: ok ? '#94a3b8' : '#475569' }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Premium Plan */}
                <div style={{ padding: 16, borderRadius: 18, border: '1px solid rgba(59,130,246,0.4)', background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(6,182,212,0.08))', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99 }}>POPULAR</div>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Premium</h3>
                    <div style={{ fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>£9.99</div>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>per month</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {premiumFeatures.map((text) => (
                      <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <Check style={{ width: 14, height: 14, color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => upgradeMutation.mutate()}
                    disabled={upgradeMutation.isPending}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      opacity: upgradeMutation.isPending ? 0.7 : 1, fontFamily: 'inherit',
                    }}
                  >
                    {upgradeMutation.isPending ? 'Processing...' : 'Upgrade Now'}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 11, textAlign: 'center', color: '#475569', margin: 0 }}>
                Cancel anytime. Your membership will remain active until the end of the billing period.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
