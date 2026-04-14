import React from 'react';
import SettingsSubPageShell from '../components/settings/SettingsSubPageShell';

export default function AppearanceSettings() {
  return (
    <SettingsSubPageShell title="Appearance">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Coming Soon</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', margin: 0, maxWidth: 280, lineHeight: 1.6 }}>Greater customisation options and multiple language versions of the app are on the way. Stay tuned!</p>
        </div>
      </div>
    </SettingsSubPageShell>
  );
}