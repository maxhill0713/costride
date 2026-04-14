import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User, Users, Crown, LogOut, Check } from 'lucide-react';

const D = {
  bgSurface: '#0c1422',
  bgSidebar: '#070c16',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.12)',
  blue:      '#3b82f6',
  blueDim:   'rgba(59,130,246,0.10)',
  blueBrd:   'rgba(59,130,246,0.22)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#2d3f55',
  red: '#ef4444',
};

export default function ProfileDropdown({ currentUser, coaches, onRoleSelect, currentRole }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  // Determine the currently "active" identity for display in the button
  const activeCoach = (coaches || []).find(c => c.id === currentRole);
  const displayName = activeCoach
    ? (activeCoach.name || 'Coach').split(' ')[0]
    : (currentUser?.full_name || currentUser?.email || 'User').split(' ')[0];
  const displayAvatar = activeCoach?.avatar_url || currentUser?.avatar_url || null;
  const displayInitial = (activeCoach?.name || currentUser?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase();

  // Build role options: owner + each coach
  const roleOptions = [
    { id: 'gym_owner', label: currentUser?.full_name || 'Gym Owner', sublabel: 'Gym Owner · Full access', icon: Crown },
    ...(coaches || []).map(c => ({
      id: c.id,
      label: c.name,
      sublabel: c.user_email === currentUser?.email ? 'Coach view (you)' : 'Coach view',
      icon: User,
      email: c.user_email,
      avatar: c.avatar_url,
    })),
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '4px 9px 4px 5px', borderRadius: 9,
          background: open ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? D.borderHi : D.border}`,
          cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = D.borderHi; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; } }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: D.bgSurface,
          border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, fontWeight: 700, color: D.t2,
          overflow: 'hidden', flexShrink: 0,
        }}>
          {displayAvatar
            ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : displayInitial
          }
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: D.t2 }}>{displayName}</span>
        <ChevronDown style={{ width: 10, height: 10, color: D.t4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
          background: '#060c18', border: `1px solid ${D.borderHi}`,
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          minWidth: 220, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: D.t3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Switch Dashboard</div>
            {(coaches || []).length === 0 && (
              <div style={{ fontSize: 10, color: D.t3, marginTop: 5, lineHeight: 1.45 }}>
                Add coaches via Manage Coaches to enable coach views.
              </div>
            )}
          </div>

          {/* Role options */}
          <div style={{ padding: '6px 0' }}>
            {roleOptions.map(opt => {
              const active = currentRole === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => { onRoleSelect(opt.id); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', border: 'none', background: active ? D.blueDim : 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: opt.avatar ? 'transparent' : active ? D.blueDim : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${active ? D.blueBrd : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', fontSize: 11, fontWeight: 700, color: D.t2,
                  }}>
                    {opt.avatar
                      ? <img src={opt.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Icon style={{ width: 12, height: 12, color: active ? D.blue : D.t3 }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: active ? D.t1 : D.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: D.t3, marginTop: 1 }}>{opt.sublabel}</div>
                  </div>
                  {active && <Check style={{ width: 12, height: 12, color: D.blue, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Divider + logout */}
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: '6px 0 6px' }}>
            <button
              onClick={() => { setOpen(false); /* caller handles logout */ document.dispatchEvent(new CustomEvent('dash-logout')); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 14px', border: 'none', background: 'transparent',
                color: D.red, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', opacity: 0.7, transition: 'opacity 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              <LogOut style={{ width: 12, height: 12 }} /> Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}