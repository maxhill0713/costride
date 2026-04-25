import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

/**
 * NotificationBanner
 * Shows a prompt banner asking users to enable push notifications.
 * Hidden if already subscribed or if user has dismissed it.
 * Tapping "Enable" calls window._OneSignalShowPrompt() set up in index.html.
 */
export default function NotificationBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait for OneSignal to be ready, then check subscription status
    const DISMISS_KEY = 'notifBannerDismissed';
    if (localStorage.getItem(DISMISS_KEY)) return;

    const checkStatus = async () => {
      if (!window.OneSignalDeferred) return;
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          const enabled = await OneSignal.Notifications.isPushNotificationsEnabled();
          if (!enabled) setShow(true);
        } catch {
          // If check fails, don't show banner
        }
      });
    };

    // Small delay so OneSignal has time to init
    const t = setTimeout(checkStatus, 2000);
    return () => clearTimeout(t);
  }, []);

  const handleEnable = async () => {
    if (!window._OneSignalShowPrompt) return;
    setLoading(true);
    try {
      await window._OneSignalShowPrompt();
      // After prompt, hide the banner regardless of outcome
      setShow(false);
    } catch (err) {
      console.warn('NotificationBanner: prompt error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notifBannerDismissed', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(30,35,60,0.92) 0%, rgba(8,10,20,0.98) 100%)',
        border: '1px solid rgba(96,165,250,0.25)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        marginBottom: 4,
      }}
    >
      <div
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'rgba(96,165,250,0.12)',
          border: '1px solid rgba(96,165,250,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Bell style={{ width: 16, height: 16, color: '#60a5fa' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
          Stay in the loop
        </p>
        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)', margin: '1px 0 0', fontWeight: 500 }}>
          Enable notifications to get updates
        </p>
      </div>

      <button
        onClick={handleEnable}
        disabled={loading}
        style={{
          flexShrink: 0,
          padding: '7px 13px',
          borderRadius: 10,
          fontSize: 12, fontWeight: 800,
          color: '#fff',
          background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
          border: 'none',
          borderBottom: '3px solid #1a3fa8',
          boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
        onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        onTouchStart={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
        onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        {loading ? 'Enabling…' : 'Enable'}
      </button>

      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0, background: 'none', border: 'none',
          padding: 4, cursor: 'pointer', color: 'rgba(148,163,184,0.5)',
          display: 'flex', alignItems: 'center',
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}