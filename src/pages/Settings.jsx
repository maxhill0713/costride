import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, ChevronRight, Search, LogOut, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';

const SETTINGS_LIST = [
  { name: 'Account', page: 'AccountSettings', icon: '🔐', sub: 'Password, email & security', iconBg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(185,28,28,0.3))', keywords: ['account', 'security'] },
  { name: 'Profile', page: 'ProfileSettings', icon: '👤', sub: 'Avatar, banner & name', iconBg: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(37,99,235,0.3))', keywords: ['profile'] },
  { name: 'Privacy', page: 'PrivacySettings', icon: '🔒', sub: 'Visibility & profile control', iconBg: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(5,150,105,0.3))', keywords: ['privacy'] },
  { name: 'Archive', page: 'PostArchive', icon: '🗂️', sub: 'All posts you\'ve ever made', iconBg: 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(71,85,105,0.3))', keywords: ['archive', 'posts', 'hidden'] },
  { name: 'Notifications', page: 'NotificationSettings', icon: '🔔', sub: 'Alerts, push & email', iconBg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(180,83,9,0.3))', keywords: ['notifications'] },
  { name: 'Appearance', page: 'AppearanceSettings', icon: '🎨', sub: 'Theme, units & language', iconBg: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(109,40,217,0.3))', keywords: ['appearance'] },
  { name: 'Subscriptions', page: 'SubscriptionSettings', icon: '💳', sub: 'Plan, billing & payment', iconBg: 'linear-gradient(135deg, rgba(251,113,133,0.2), rgba(190,18,60,0.3))', keywords: ['subscriptions'], badge: { label: 'PRO', style: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' } } },
  { name: 'Help & Support', page: 'HelpSupport', icon: '❓', sub: 'FAQ, contact & feedback', iconBg: 'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(71,85,105,0.3))', keywords: ['help', 'support'] },
];

const DEEP_LINKS = [
  { keywords: ['password', 'change password', 'current password', 'new password', 'reset password'], page: 'AccountSettings', section: 'password', label: 'Change Password', icon: '🔑', parent: 'Account' },
  { keywords: ['email', 'email address', 'account email'], page: 'AccountSettings', section: 'email', label: 'Email Address', icon: '✉️', parent: 'Account' },
  { keywords: ['avatar', 'profile picture', 'photo', 'picture', 'profile photo'], page: 'ProfileSettings', section: 'avatar', label: 'Profile Picture', icon: '📷', parent: 'Profile' },
  { keywords: ['banner', 'cover photo', 'cover image', 'hero'], page: 'ProfileSettings', section: 'banner', label: 'Banner Image', icon: '🖼️', parent: 'Profile' },
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
  { label: 'Account', pages: ['AccountSettings', 'ProfileSettings', 'PrivacySettings', 'PostArchive'] },
  { label: 'Preferences', pages: ['NotificationSettings', 'AppearanceSettings'] },
  { label: 'Billing', pages: ['SubscriptionSettings'] },
  { label: 'Support', pages: ['HelpSupport'] },
];

const MAX_SEARCH_LENGTH = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Exact animation variants from CreateSplitModal
// ─────────────────────────────────────────────────────────────────────────────
const pageSlideVariants = {
  hidden: {
    x: '100%',
    opacity: 1,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 36,
      mass: 1,
    },
  },
  exit: {
    x: '100%',
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 40,
      mass: 0.9,
    },
  },
};

// Subtle background dim that fades in independently
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// ─────────────────────────────────────────────────────────────────────────────

function sanitiseSearchInput(raw) {
  return raw.replace(/[^a-zA-Z\s]/g, '').slice(0, MAX_SEARCH_LENGTH);
}

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

function LogoutDialog({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
        <h3 className="text-xl font-black text-white mb-2">Log Out?</h3>
        <p className="text-slate-300 text-sm mb-6">
          You'll be signed out of your account and will need to log back in to continue.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700 shadow-[0_3px_0_0_#92400e,0_6px_16px_rgba(200,100,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}

function DeleteAccountDialog({ open, onClose, onConfirm, isPending, isGymOwner }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
        <h3 className="text-xl font-black text-white mb-2">⚠️ Delete Account?</h3>
        <p className="text-slate-300 text-sm mb-6">
          This will permanently delete your account and all data including check-ins, posts, progress
          {isGymOwner ? ', and all gyms you own' : ''}. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d,0_6px_16px_rgba(200,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  // Controls whether the page is "mounted" for AnimatePresence.
  // Since this is a routed page (not a modal), we treat it as always open
  // so the slide-in fires on mount. Set to false to trigger exit animation
  // before navigating away (optional — wired up in handleBack below).
  const [isVisible, setIsVisible] = useState(true);

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

  const handleDeleteAccount = async () => {
    setDeletePending(true);
    setShowDeleteDialog(false);
    try {
      await base44.functions.invoke('deleteUserAccount');
      // Clear all cached query data so fresh data is loaded on next sign-in
      queryClient.clear();
      // Clear localStorage/sessionStorage to reset all cached app data
      localStorage.clear();
      sessionStorage.clear();
      // Force logout
      await base44.auth.logout();
    } catch (error) {
      console.error('Delete account error:', error);
      setDeletePending(false);
      setShowDeleteDialog(true);
      alert('Failed to delete account. Please try again.');
    }
  };

  // Trigger exit animation then navigate back
  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => navigate(createPageUrl('Profile')), 320);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(sanitiseSearchInput(e.target.value));
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { deepLinks: [], pages: [] };
    const deepLinks = DEEP_LINKS.filter(d =>
      d.keywords.some(k => k.includes(q) || q.includes(k)) ||
      d.label.toLowerCase().includes(q) ||
      d.parent.toLowerCase().includes(q)
    );
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
    <>
      <AnimatePresence>
        {isVisible && (
          <>
            {/* ── Dim overlay: fades independently (matches CreateSplitModal) ── */}
            <motion.div
              key="settings-overlay"
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />

            {/* ── Main panel: slides in from right (matches CreateSplitModal exactly) ── */}
            <motion.div
              key="settings-panel"
              className="fixed inset-0 z-50"
              style={{
                minHeight: '100dvh',
                background: 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)',
                color: '#fff',
                fontFamily: 'inherit',
                overflowY: 'auto',
              }}
              variants={pageSlideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* ── Sticky Header ── */}
              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15, 23, 37, 0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '2px solid rgba(59, 130, 246, 0.4)', padding: '10px 16px', paddingTop: 'max(env(safe-area-inset-top), 10px)' }}>
                <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Use button + handleBack so exit animation fires before navigation */}
                  <button
                    onClick={handleBack}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft style={{ width: 22, height: 22, color: '#94a3b8' }} />
                  </button>
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
                    onChange={handleSearchChange}
                    maxLength={MAX_SEARCH_LENGTH}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
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
                        if (result.isPage) return <SettingRow key={result.page} setting={result} isLast={isLast} />;
                        return <DeepLinkRow key={`${result.page}-${result.section}`} result={result} isLast={isLast} onNavigate={() => handleDeepLink(result)} />;
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
                      <PressButton onClick={() => setShowLogoutDialog(true)}>
                        <LogOut style={{ width: 15, height: 15 }} />
                        Log Out
                      </PressButton>
                      <PressButton textColor="#ef4444" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 style={{ width: 15, height: 15 }} />
                        Delete Account
                      </PressButton>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#1e3a5f', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 28 }}>
                      CoStride
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LogoutDialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => base44.auth.logout()}
      />
      <DeleteAccountDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        isPending={deletePending}
        isGymOwner={currentUser?.account_type === 'gym_owner'}
      />
    </>
  );
}