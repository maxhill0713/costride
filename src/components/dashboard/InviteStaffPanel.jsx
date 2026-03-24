import React, { useState } from 'react';
import { GraduationCap, Mail, Send, Check, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const T = {
  purple: '#8b5cf6', green: '#10b981', red: '#ef4444',
  text1: '#f0f4f8', text2: '#94a3b8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', card: '#0b1120', divider: 'rgba(255,255,255,0.05)',
};

export default function InviteStaffPanel({ gym }) {
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState('coach');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || sending) return;
    setSending(true); setError('');
    try {
      await base44.users.inviteUser(email.trim(), 'user');
      setSent(true); setEmail('');
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      setError(e?.message || 'Failed to send invite');
    } finally { setSending(false); }
  };

  const joinUrl = gym?.join_code ? `${window.location.origin}/GymSignup?code=${gym.join_code}` : null;
  const handleCopy = () => {
    if (joinUrl) { navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div style={{ borderRadius: 14, background: '#0c1a2e', border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden', padding: 20 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.purple}28,transparent)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${T.purple}14`, border: `1px solid ${T.purple}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap style={{ width: 14, height: 14, color: T.purple }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Invite Staff</div>
          <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Add coaches & employees to the app</div>
        </div>
      </div>

      {/* Role selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[{ id: 'coach', label: 'Coach' }, { id: 'staff', label: 'Staff' }].map(r => (
          <button key={r.id} onClick={() => setRole(r.id)}
            style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: role === r.id ? `${T.purple}14` : T.divider, color: role === r.id ? T.purple : T.text3, border: `1px solid ${role === r.id ? T.purple + '35' : T.border}`, transition: 'all 0.12s' }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Email input */}
      <div style={{ display: 'flex', gap: 6, marginBottom: error ? 6 : 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 11, height: 11, color: T.text3, pointerEvents: 'none' }} />
          <input
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="Email address…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 28px', borderRadius: 8, background: T.divider, border: `1px solid ${error ? T.red + '50' : T.border}`, color: T.text1, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = `${T.purple}50`}
            onBlur={e => e.target.style.borderColor = error ? `${T.red}50` : T.border}
          />
        </div>
        <button onClick={handleInvite} disabled={!email.trim() || sending || sent}
          style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: !email.trim() || sending || sent ? 'default' : 'pointer', fontFamily: 'inherit', border: `1px solid ${sent ? T.green + '40' : T.purple + '40'}`, background: sent ? `${T.green}12` : `${T.purple}14`, color: sent ? T.green : T.purple, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'all 0.15s' }}>
          {sent ? <><Check style={{ width: 11, height: 11 }} /> Sent</> : sending ? '…' : <><Send style={{ width: 11, height: 11 }} /> Send</>}
        </button>
      </div>

      {error && <div style={{ fontSize: 11, color: T.red, marginBottom: 8 }}>{error}</div>}

      <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.5, marginBottom: joinUrl ? 10 : 0 }}>
        They'll receive an email invite and be added as a <span style={{ fontWeight: 700, color: T.purple }}>{role}</span> on the app.
      </div>

      {joinUrl && (
        <>
          <div style={{ height: 1, background: T.divider, margin: '10px 0' }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Or share gym link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: T.divider, border: `1px solid ${T.border}` }}>
            <span style={{ flex: 1, fontSize: 10, color: T.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joinUrl}</span>
            <button onClick={handleCopy}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: copied ? `${T.green}12` : `${T.purple}10`, color: copied ? T.green : T.purple, border: `1px solid ${copied ? T.green + '28' : T.purple + '28'}`, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? <><Check style={{ width: 9, height: 9 }} /> Copied</> : <><Copy style={{ width: 9, height: 9 }} /> Copy</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}