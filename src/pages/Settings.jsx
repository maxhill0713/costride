import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, ChevronRight, Search, LogOut, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';

const SETTINGS_LIST = [
  { name: 'Account', page: 'AccountSettings', icon: '🔐', sub: 'Password, email & security', iconBg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(185,28,28,0.3))', keywords: ['account', 'security'] },
  { name: 'Profile', page: 'ProfileSettings', icon: '👤', sub: 'Avatar, banner & bio', iconBg: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(37,99,235,0.3))', keywords: ['profile'] },
  { name: 'Privacy', page: 'PrivacySettings', icon: '🔒', sub: 'Visibility & profile control', iconBg: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(5,150,105,0.3))', keywords: ['privacy'] },
  { name: 'Notifications', page: 'NotificationSettings', icon: '🔔', sub: 'Alerts, push & email', iconBg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(180,83,9,0.3))', keywords: ['notifications'] },
  { name: 'Appearance', page: 'AppearanceSettings', icon: '🎨', sub: 'Theme, units & language', iconBg: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(109,40,217,0.3))', keywords: ['appearance'] },
  { name: 'Subscriptions', page: 'SubscriptionSettings', icon: '💳', sub: 'Plan, billing & payment', iconBg: 'linear-gradient(135deg, rgba(251,113,133,0.2), rgba(190,18,60,0.3))', keywords: ['subscriptions'], badge: { label: 'PRO', style: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' } } },
  { name: 'Help & Support', page: 'HelpSupport', icon: '❓', sub: 'FAQ, contact & feedback', iconBg: 'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(71,85,105,0.3))', keywords: ['help', 'support'] },
];

// Each entry maps keywords to a specific section id inside a sub-page.
// The `section` value must match the id you add to the card in that sub-page (see AccountSettings.jsx).
const DEEP_LINKS = [
  { keywords: ['password', 'change password', 'current password', 'new password', 'reset password'], page: 'AccountSettings', section: 'password', label: 'Change Password', icon: '🔑', parent: 'Account' },
  { keywords: ['email', 'email address', 'account email'], page: 'AccountSettings', section: 'email', label: 'Email Address', icon: '✉️', parent: 'Account' },
  { keywords: ['avatar', 'profile picture', 'photo', 'picture', 'profile photo'], page: 'ProfileSettings', section: 'avatar', label: 'Profile Picture', icon: '📷', parent: 'Profile' },
  { keywords: ['banner', 'cover photo', 'cover image', 'hero'], page: 'ProfileSettings', section: 'banner', label: 'Banner Image', icon: '🖼️', parent: 'Profile' },
  { keywords: ['bio', 'about', 'about me', 'description'], page: 'ProfileSettings', section: 'bio', label: 'Bio', icon: '📝', parent: 'Profile' },
  { keywords: ['name', 'display name', 'username', 'full name'], page: 'ProfileSettings', section: 'name', label: 'Display Name', icon: '👤', parent: 'Profile' },
  { keywords: ['dark mode', 'light mode', 'theme', 'color scheme'], page: 'AppearanceSettings', section: 'theme', label: 'Theme', icon: '🌙', parent: 'Appearance' },
  { keywords: ['unit', 'units', 'metric', 'imperial', 'kg', 'lbs', 'pounds', 'kilograms'], page: 'AppearanceSettings', section: 'units', label: 'Units', icon: '📏', parent: 'Appearance' },
  { keywords: ['language', 'locale'], page: 'AppearanceSettings', section: 'language', label: 'Language', icon: '🌐', parent: 'Appearance' },
  { keywords: ['push', 'push notification', 'push notifications'], page: 'NotificationSettings', section: 'push', label: 'Push Notifications', icon: '📲', parent: 'Notifications' },
  { keywords: ['notification email', 'email notification', 'email alerts'], page: 'NotificationSettings', section: 'email-notif', label: 'Email Notifications', icon: '📧', parent: 'Notifications' },
  { keywords: ['public', 'private', 'visibility', 'who can see', 'profile visibility'], page: 'PrivacySettings', section: 'visibility', label: 'Profile Visibility', icon: '👁️', parent: 'Privacy' },
  { keywords: ['plan', 'upgrade', 'billing', 'payment', 'subscription', 'pro'], page: 'SubscriptionSettings', section: 'plan', label: 'Subscription Plan', icon: '💳', parent: 'Subscriptions' },
  { keywords: ['faq', 'contact', 'contact us', 'feedback', 'bug', 'report'], page: 'HelpSupport', section: 'contact', label: 'Contact Support', icon: '💬', parent: 'Help & Support' },
];

const GROUPS = [
  { label: 'Account', pages: ['AccountSettings', 'ProfileSettings', 'PrivacySettings'] },
  { label: 'Preferences', pages: ['NotificationSettings', 'AppearanceSettings'] },
  { label: 'Billing', pages: ['SubscriptionSettings'] },
  { label: 'Support', pages: ['HelpSupport'] },
];

function SettingRow({ setting, isLast }) {
  return (
    <Link
      to={createPageUrl(setting.page)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', textDecoration: 'none', color: 'inherit', position: 'relative', transition: 'background 0.15s ease' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {!isLast && <div style={{ position: 'absolute', bottom: 0, left: 58, right: 0, height: 1, background: 'rgba(255,255,255,0.05)' }} />}
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: setting.iconBg, border: '1px solid rgba(255,255,255,0.08)' }}>
        {setting.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{setting.name}</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#475569', marginTop: 1 }}>{setting.sub}</div>
      </div>
      {setting.badge && (
        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em', ...setting.badge.style }}>{setting.badge.label}</span>
      )}
      <ChevronRight style={{ width: 16, height: 16, color: '#94a3b8', opacity: 0.4, flexShrink: 0 }} />
    </Link>
  );
}

function DeepLinkRow({ result, isLast, onNavigate }) {
  const parentSetting = SETTINGS_LIST.find(s => s.name === result.parent);
  return (
    <div
      onClick={onNavigate}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', cursor: 'pointer', position: 'relative', transition: 'background 0.15s ease' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {!isLast && <div style={{ position: 'absolute', bottom: 0, left: 58, right: 0, height: 1, background: 'rgba(255,255,255,0.05)' }} />}
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: parentSetting?.iconBg || 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {result.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{result.label}</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#475569', marginTop: 1 }}>in {result.parent}</div>
      </div>
      <ChevronRight style={{ width: 16, height: 16, color: '#94a3b8', opacity: 0.4, flexShrink: 0 }} />
    </div>
  );
}

function PressButton({ onClick, children, textColor = '#94a3b8' }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#0a0f1a', transform: 'translateY(4px)' }} />
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => { setPressed(false); onClick?.(); }}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => { setPressed(false); onClick?.(); }}
        style={{
          position: 'relative', zIndex: 1, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(to bottom, #1e2535 0%, #151c2a 50%, #0f1520 100%)',
          color: textColor, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer',
          boxShadow: pressed ? 'none' : '0 4px 0 0 #0a0f1a, 0 6px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          transform: pressed ? 'translateY(4px)' : 'translateY(0)',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {children}
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      await base44.auth.updateMe(settings);
      return base44.auth.me();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { deepLinks: [], pages: [] };

    const deepLinks = DEEP_LINKS.filter(d =>
      d.keywords.some(k => k.includes(q) || q.includes(k)) ||
      d.label.toLowerCase().includes(q) ||
      d.parent.toLowerCase().includes(q)
    );

    // Only show top-level page results if no deep link covers that page
    const deepLinkPages = new Set(deepLinks.map(d => d.page));
    const pages = SETTINGS_LIST.filter(s =>
      !deepLinkPages.has(s.page) && (
        s.name.toLowerCase().includes(q) ||
        s.keywords.some(k => k.includes(q))
      )
    );

    return { deepLinks, pages };
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const allResults = [
    ...searchResults.deepLinks,
    ...searchResults.pages.map(p => ({ ...p, label: p.name, parent: null, isPage: true })),
  ];
  const hasResults = allResults.length > 0;

  const handleDeepLink = (result) => {
    navigate(createPageUrl(result.page) + `?section=${result.section}`);
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#475569', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)', color: '#fff', fontFamily: 'inherit' }}>

      {/* ── Sticky Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(2,4,10,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to={createPageUrl('Profile')} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            <ChevronLeft style={{ width: 22, height: 22, color: '#94a3b8' }} />
          </Link>
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Settings</span>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* ── Search ── */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search settings…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 16px 9px 40px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
        </div>

        {/* ── Search Results ── */}
        {isSearching ? (
          !hasResults ? (
            <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No settings found</p>
          ) : (
            <div style={{ background: CARD_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              {allResults.map((result, i) => {
                const isLast = i === allResults.length - 1;
                if (result.isPage) {
                  return <SettingRow key={result.page} setting={result} isLast={isLast} />;
                }
                return (
                  <DeepLinkRow
                    key={`${result.page}-${result.section}`}
                    result={result}
                    isLast={isLast}
                    onNavigate={() => handleDeepLink(result)}
                  />
                );
              })}
            </div>
          )
        ) : (
          <>
            {GROUPS.map((group) => {
              const rows = group.pages.map(page => SETTINGS_LIST.find(s => s.page === page)).filter(Boolean);
              return (
                <div key={group.label} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', padding: '0 4px', marginBottom: 8 }}>
                    {group.label}
                  </div>
                  <div style={{ background: CARD_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                    {rows.map((setting, i) => (
                      <SettingRow key={setting.page} setting={setting} isLast={i === rows.length - 1} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* ── Danger Zone ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <PressButton onClick={() => { if (confirm('Are you sure you want to logout?')) { base44.auth.logout(); } }}>
                <LogOut style={{ width: 15, height: 15 }} />
                Log Out
              </PressButton>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div>
                    <PressButton textColor="#ef4444">
                      <Trash2 style={{ width: 15, height: 15 }} />
                      Delete Account
                    </PressButton>
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.95) 0%, rgba(8,10,20,0.98) 100%)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, color: '#fff' }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle style={{ color: '#fff', fontWeight: 900 }}>⚠️ Delete Account?</AlertDialogTitle>
                    <AlertDialogDescription style={{ color: '#94a3b8' }}>
                      This will permanently delete your account and all data including check-ins, posts, progress{currentUser.account_type === 'gym_owner' ? ', and all gyms you own' : ''}. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ borderRadius: 12 }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      style={{ background: 'linear-gradient(to bottom, #ef4444, #dc2626)', color: '#fff', borderRadius: 12, fontWeight: 800 }}
                      onClick={async () => {
                        try { await base44.functions.invoke('deleteUserAccount'); base44.auth.logout(); }
                        catch (error) { console.error('Failed to delete account:', error); }
                      }}
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#1e3a5f', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 28 }}>
              CoStride
            </p>
          </>
        )}
      </div>
    </div>
  );
}