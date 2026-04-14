import React from 'react';
import SettingsSubPageShell from '../components/settings/SettingsSubPageShell';

export default function SubscriptionSettings() {
  return (
    <SettingsSubPageShell title="Subscriptions">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Coming Soon</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', margin: 0 }}>Subscription settings will be available here</p>
        </div>
      </div>
    </SettingsSubPageShell>
  );
}