import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ExternalLink, CheckCircle, AlertCircle, Loader, CreditCard, TrendingUp } from 'lucide-react';

const C = {
  bg: '#0f0f12',
  card: '#141416',
  brd: '#222226',
  t1: '#ffffff',
  t2: '#8a8a94',
  t3: '#444450',
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
  greenBrd: 'rgba(34,197,94,0.28)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  amberBrd: 'rgba(245,158,11,0.28)',
  blue: '#4d7fff',
  blueDim: 'rgba(77,127,255,0.12)',
  blueBrd: 'rgba(77,127,255,0.28)',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

export default function StripeConnectPanel({ gym }) {
  const [status, setStatus] = useState(null); // null = loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gym?.id) return;
    base44.functions.invoke('stripeConnectStatus', { gymId: gym.id })
      .then(res => setStatus(res.data))
      .catch(() => setStatus({ connected: false, chargesEnabled: false }));
  }, [gym?.id]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const returnUrl = window.location.href;
      const res = await base44.functions.invoke('stripeConnectOnboard', { gymId: gym.id, returnUrl });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert('Failed to start Stripe onboarding: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFullyActive = status?.chargesEnabled && status?.payoutsEnabled;
  const isPartial = status?.connected && !isFullyActive;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: 'hidden', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CreditCard style={{ width: 16, height: 16, color: C.blue }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Stripe Payments</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>Receive 85% of class booking revenue directly</div>
        </div>
      </div>

      {/* Revenue split info */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.brd}`, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: C.greenDim, border: `1px solid ${C.greenBrd}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.green, letterSpacing: '-0.04em' }}>85%</div>
          <div style={{ fontSize: 10, color: C.t2, marginTop: 2, fontWeight: 600 }}>You receive</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: C.blueDim, border: `1px solid ${C.blueBrd}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.blue, letterSpacing: '-0.04em' }}>15%</div>
          <div style={{ fontSize: 10, color: C.t2, marginTop: 2, fontWeight: 600 }}>CoStride fee</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '14px 16px' }}>
        {status === null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.t3 }}>
            <Loader style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12 }}>Checking connection status…</span>
          </div>
        ) : isFullyActive ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckCircle style={{ width: 15, height: 15, color: C.green, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>Stripe Connected & Active</span>
            </div>
            <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6, marginBottom: 12 }}>
              Payments from class bookings will be split automatically. Your 85% is paid out directly to your bank account via Stripe.
            </div>
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >
              <ExternalLink style={{ width: 12, height: 12 }} />
              Manage Stripe Account
            </button>
          </div>
        ) : isPartial ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertCircle style={{ width: 15, height: 15, color: C.amber, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>Setup Incomplete</span>
            </div>
            <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6, marginBottom: 12 }}>
              Your Stripe account was created but needs more details before you can receive payments.
            </div>
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: C.amber, border: 'none', color: '#000', fontSize: 12, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: FONT, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <Loader style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <ExternalLink style={{ width: 13, height: 13 }} />}
              {loading ? 'Redirecting…' : 'Complete Setup'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6, marginBottom: 14 }}>
              Connect your bank account via Stripe to receive class booking payments. Takes about 5 minutes.
            </div>
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, background: '#635bff', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: FONT, opacity: loading ? 0.7 : 1, width: '100%', justifyContent: 'center' }}
            >
              {loading ? <Loader style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <CreditCard style={{ width: 14, height: 14 }} />}
              {loading ? 'Redirecting to Stripe…' : 'Connect with Stripe'}
            </button>
            <div style={{ fontSize: 10, color: C.t3, textAlign: 'center', marginTop: 8 }}>
              Powered by Stripe Express · Secure & PCI compliant
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}