import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// ── Shared design tokens ─────────────────────────────────────────────────────
const PAGE_BG   = 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)';
const GROUP_BG  = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';
const DIVIDER   = 'rgba(255,255,255,0.06)';

// ── Section highlight hook ───────────────────────────────────────────────────
function useSectionHighlight() {
  const { search } = useLocation();
  const section = new URLSearchParams(search).get('section');
  const [highlighted, setHighlighted] = useState(null);
  useEffect(() => {
    if (!section) return;
    setHighlighted(section);
    const t1 = setTimeout(() => {
      document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    const t2 = setTimeout(() => setHighlighted(null), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [section]);
  return highlighted;
}

// ── Shared layout primitives ─────────────────────────────────────────────────
function PageShell({ title, children }) {
  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, color: '#fff', fontFamily: 'inherit' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(2,4,10,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to={createPageUrl('Settings')} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '4px 8px 4px 0' }}>
            <ChevronLeft style={{ width: 22, height: 22, color: '#94a3b8' }} />
          </Link>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', color: '#fff' }}>{title}</span>
        </div>
      </div>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 60px' }}>
        {children}
      </div>
    </div>
  );
}

// Section label above a group
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', padding: '0 4px', marginBottom: 8, marginTop: 4 }}>
      {children}
    </div>
  );
}

// The glass card that wraps a group of rows
function Group({ sectionId, highlighted, children }) {
  const isHighlighted = highlighted === sectionId;
  return (
    <div
      id={sectionId ? `section-${sectionId}` : undefined}
      style={{
        background: GROUP_BG,
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        marginBottom: 20,
        transition: 'box-shadow 0.4s ease',
        boxShadow: isHighlighted ? '0 0 0 2px rgba(96,165,250,0.7), 0 0 24px rgba(96,165,250,0.2)' : 'none',
      }}
    >
      {children}
    </div>
  );
}

// A single row inside a group
function Row({ label, sublabel, children, isLast, danger }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', minHeight: 52 }}>
      {!isLast && <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 1, background: DIVIDER }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? '#f87171' : '#e2e8f0', letterSpacing: '-0.01em' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: '#475569', marginTop: 2, fontWeight: 500 }}>{sublabel}</div>}
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  );
}

// Styled text input that fits inside a Row or standalone
function SettingInput({ value, onChange, placeholder, type = 'text', disabled, suffix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${focused ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 10,
          color: disabled ? '#475569' : '#e2e8f0',
          fontSize: 14,
          padding: '9px 12px',
          outline: 'none',
          width: '100%',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
          cursor: disabled ? 'not-allowed' : 'auto',
        }}
      />
      {suffix && <span style={{ position: 'absolute', right: 10, color: '#475569', fontSize: 13 }}>{suffix}</span>}
    </div>
  );
}

// Pill-style submit button
function SubmitBtn({ children, onClick, disabled, loading }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', marginTop: 4 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#1a3fa8', transform: 'translateY(3px)' }} />
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{
          position: 'relative', zIndex: 1, width: '100%',
          padding: '11px 20px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #2563eb 100%)',
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          boxShadow: pressed ? 'none' : '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.2)',
          transform: pressed ? 'translateY(3px)' : 'translateY(0)',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          WebkitTapHighlightColor: 'transparent',
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Updating…' : children}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AccountSettings() {
  const queryClient = useQueryClient();
  const highlighted = useSectionHighlight();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [passwordError, setPasswordError]     = useState('');

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwords) => (await base44.functions.invoke('updatePassword', passwords)).data,
    onSuccess: () => {
      toast.success('Password updated');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError('');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err) => { setPasswordError(err.message || 'Failed to update password'); toast.error('Failed to update password'); },
  });

  const handlePasswordChange = () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('All fields are required'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match'); return; }
    if (newPassword.length < 8) { setPasswordError('Minimum 8 characters'); return; }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (!currentUser) return <PageShell title="Account"><p style={{ color: '#475569', textAlign: 'center', paddingTop: 40 }}>Loading…</p></PageShell>;

  const eyeBtn = (show, toggle) => (
    <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 2px', display: 'flex', alignItems: 'center' }}>
      {show ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
    </button>
  );

  return (
    <PageShell title="Account">

      {/* Email */}
      <SectionLabel>Email address</SectionLabel>
      <Group sectionId="email" highlighted={highlighted}>
        <Row label="Email" sublabel="Contact support to change your email" isLast>
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</span>
        </Row>
      </Group>

      {/* Password */}
      <SectionLabel>Change password</SectionLabel>
      <Group sectionId="password" highlighted={highlighted}>
        <div style={{ padding: '14px 16px 6px' }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Current password</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}><SettingInput type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" /></div>
              {eyeBtn(showCurrent, () => setShowCurrent(v => !v))}
            </div>
          </div>
          <div style={{ height: 1, background: DIVIDER, margin: '10px 0' }} />
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>New password</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}><SettingInput type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" /></div>
              {eyeBtn(showNew, () => setShowNew(v => !v))}
            </div>
          </div>
          <div style={{ height: 1, background: DIVIDER, margin: '10px 0' }} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Confirm new password</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}><SettingInput type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" /></div>
              {eyeBtn(showConfirm, () => setShowConfirm(v => !v))}
            </div>
          </div>
          {passwordError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '9px 12px', marginBottom: 10 }}>
              <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{passwordError}</p>
            </div>
          )}
          <div style={{ paddingBottom: 10 }}>
            <SubmitBtn onClick={handlePasswordChange} disabled={updatePasswordMutation.isPending} loading={updatePasswordMutation.isPending}>
              Update Password
            </SubmitBtn>
          </div>
        </div>
      </Group>

    </PageShell>
  );
}