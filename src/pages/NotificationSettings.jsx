import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { BellRing, CheckCircle2 } from 'lucide-react';
import SettingsSubPageShell from '../components/settings/SettingsSubPageShell';

const PAGE_BG  = 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)';
const GROUP_BG = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';
const DIVIDER  = 'rgba(255,255,255,0.06)';

function useSectionHighlight() {
  const { search } = useLocation();
  const section = new URLSearchParams(search).get('section');
  const [highlighted, setHighlighted] = useState(null);
  useEffect(() => {
    if (!section) return;
    setHighlighted(section);
    const t1 = setTimeout(() => { document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
    const t2 = setTimeout(() => setHighlighted(null), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [section]);
  return highlighted;
}



function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', padding: '0 4px', marginBottom: 8, marginTop: 4 }}>{children}</div>;
}

function Group({ sectionId, highlighted, children }) {
  const isHighlighted = highlighted === sectionId;
  return (
    <div id={sectionId ? `section-${sectionId}` : undefined} style={{ background: GROUP_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 20, transition: 'box-shadow 0.4s ease', boxShadow: isHighlighted ? '0 0 0 2px rgba(96,165,250,0.7), 0 0 24px rgba(96,165,250,0.2)' : 'none' }}>
      {children}
    </div>
  );
}

function Row({ label, sublabel, children, isLast }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', minHeight: 52 }}>
      {!isLast && <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 1, background: DIVIDER }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: '#475569', marginTop: 2, fontWeight: 500 }}>{sublabel}</div>}
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  );
}

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const highlighted = useSectionHighlight();
  const [notifStatus, setNotifStatus] = useState(null);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => { await base44.auth.updateMe(settings); return base44.auth.me(); },
    onSuccess: (u) => { queryClient.setQueryData(['currentUser'], u); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
  });

  const handleRequestPermission = async () => {
    if (!window.OneSignalDeferred) {
      console.warn('OneSignal not available');
      return;
    }
    
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        setNotifStatus('granted');
        console.log('OneSignal permission requested');
      } catch (err) {
        console.error('OneSignal permission error:', err);
        setNotifStatus('denied');
      }
    });
  };

  if (!currentUser) return <SettingsSubPageShell title="Notifications"><p style={{ color: '#475569', textAlign: 'center', paddingTop: 40 }}>Loading…</p></SettingsSubPageShell>;

  return (
    <SettingsSubPageShell title="Notifications">

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={handleRequestPermission}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderRadius: '12px',
            background: '#2563eb',
            border: 'none',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = '#1d4ed8'}
          onMouseLeave={e => e.target.style.background = '#2563eb'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BellRing style={{ width: 24, height: 24 }} />
            <span>Turn On Notifications</span>
          </div>
          <CheckCircle2 style={{ width: 20, height: 20, opacity: notifStatus === 'granted' ? 1 : 0 }} />
        </button>
        {notifStatus === 'granted' && (
          <p style={{ color: '#4ade80', fontWeight: 'bold', marginTop: 8, textAlign: 'center', fontSize: 14 }}>✓ Notifications enabled!</p>
        )}
        {notifStatus === 'denied' && (
          <p style={{ color: '#f87171', marginTop: 8, textAlign: 'center', fontSize: 14 }}>Permission denied. Check browser settings.</p>
        )}
      </div>

      <SectionLabel>Push</SectionLabel>
      <Group sectionId="push" highlighted={highlighted}>
        <Row label="Push notifications" sublabel="Receive alerts on your device" isLast>
          <Switch
            checked={currentUser.notifications_enabled ?? true}
            onCheckedChange={checked => updateSettingsMutation.mutate({ notifications_enabled: checked })}
          />
        </Row>
      </Group>

      <SectionLabel>Email</SectionLabel>
      <Group sectionId="email-notif" highlighted={highlighted}>
        <Row label="Email notifications" sublabel="Receive updates via email" isLast>
          <Switch
            checked={currentUser.email_notifications ?? true}
            onCheckedChange={checked => updateSettingsMutation.mutate({ email_notifications: checked })}
          />
        </Row>
      </Group>

    </SettingsSubPageShell>
  );
}