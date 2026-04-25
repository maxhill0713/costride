import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

const NOTIFICATION_CSS = `
  @keyframes np-slide-in {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes np-fade-out {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
`;

function injectNotificationStyles() {
  if (document.getElementById('notification-prompt-styles')) return;
  const s = document.createElement('style');
  s.id = 'notification-prompt-styles';
  s.textContent = NOTIFICATION_CSS;
  document.head.appendChild(s);
}

export default function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    injectNotificationStyles();

    // Check if notifications are supported and not already granted
    const checkNotificationPermission = async () => {
      if (!('Notification' in window)) {
        return;
      }

      // Don't show if already granted or denied
      if (Notification.permission !== 'default') {
        return;
      }

      // Check if user has dismissed this recently (7 days)
      const dismissedAt = localStorage.getItem('notificationPromptDismissed');
      if (dismissedAt) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return;
        }
      }

      // Show after a short delay
      setTimeout(() => setVisible(true), 2000);
    };

    checkNotificationPermission();
  }, []);

  const handleAllow = async () => {
    setIsClosing(true);
    try {
      if (window.OneSignal) {
        await window.OneSignal.push(() => {
          window.OneSignal.Slidedown.promptPush();
        });
        localStorage.removeItem('notificationPromptDismissed');
      }
    } catch (error) {
      console.error('OneSignal permission error:', error);
    }
    setTimeout(() => setVisible(false), 300);
  };

  const handleDismiss = () => {
    setIsClosing(true);
    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 16,
        right: 16,
        maxWidth: 400,
        zIndex: 500,
        animation: isClosing ? 'np-fade-out 0.3s ease forwards' : 'np-slide-in 0.4s ease forwards',
      }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30,40,80,0.95) 0%, rgba(15,20,45,0.98) 100%)',
          border: '1px solid rgba(147,197,253,0.2)',
          borderRadius: 18,
          padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(147,197,253,0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(147,197,253,0.15)',
              border: '1px solid rgba(147,197,253,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <Bell style={{ width: 20, height: 20, color: '#93c5fd' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', marginBottom: 4, letterSpacing: '-0.01em' }}>
              Stay Connected
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: 12 }}>
              Get real-time updates on your workouts, friends, and gym activity.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleAllow}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 11,
                  border: 'none',
                  background: 'linear-gradient(to bottom, #60a5fa, #3b82f6 40%, #1d4ed8)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  borderBottom: '3px solid #1a3fa8',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(59,130,246,0.3)',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(3px)';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.15)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(59,130,246,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(59,130,246,0.3)';
                }}>
                Allow
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  padding: '10px 14px',
                  borderRadius: 11,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  transition: 'background 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}>
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
}