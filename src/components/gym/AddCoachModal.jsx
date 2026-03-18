import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Check, UserPlus, Users, Dumbbell, Send, ArrowRight, Mail } from 'lucide-react';

const T = {
  bg:      '#060c18',
  card:    '#0c1a2e',
  card2:   '#0d1b30',
  border:  'rgba(255,255,255,0.08)',
  borderM: 'rgba(255,255,255,0.13)',
  text1:   '#f0f4f8',
  text2:   '#8ba0b8',
  text3:   '#3a5070',
  blue:    '#0ea5e9',
  green:   '#10b981',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
};

const ROLES = [
  { id: 'coach',  label: 'Coach',  icon: '🏋️', desc: 'Manage members, create content, run classes' },
  { id: 'admin',  label: 'Admin',  icon: '⚙️', desc: 'Full access to everything' },
  { id: 'viewer', label: 'Viewer', icon: '👁️', desc: 'Read-only — can view but not edit' },
];

const ROLE_PERMISSIONS = {
  coach:  { can_post: true,  can_manage_events: true,  can_manage_classes: true  },
  admin:  { can_post: true,  can_manage_events: true,  can_manage_classes: true  },
  viewer: { can_post: false, can_manage_events: false, can_manage_classes: false },
};

const NEXT_ACTIONS = [
  { icon: Users,    label: 'Assign members',     desc: 'Connect members to this coach' },
  { icon: Dumbbell, label: 'Schedule a class',   desc: 'Add a class to their timetable' },
  { icon: Mail,     label: 'Send welcome message', desc: 'Drop them a note in the feed' },
];

function Input({ label, required, type = 'text', value, onChange, placeholder, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}{required && <span style={{ color: T.blue, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', borderRadius: 9,
          background: T.card2, border: `1px solid ${focused ? T.blue + '55' : T.border}`,
          color: T.text1, fontSize: 13, outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', style = {} }) {
  const base = { padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'opacity 0.12s', opacity: disabled ? 0.45 : 1, border: 'none', ...style };
  const variants = {
    primary:  { background: T.blue, color: '#fff' },
    secondary:{ background: T.card2, color: T.text2, border: `1px solid ${T.border}` },
    ghost:    { background: 'transparent', color: T.text3, padding: '8px 12px' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

export default function AddCoachModal({ open, onClose, gym, allMemberships = [], classes = [], onCreate }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [role, setRole]   = useState('coach');
  const [advOpen, setAdvOpen] = useState(false);
  const [permissions, setPermissions] = useState({ ...ROLE_PERMISSIONS.coach });
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleRoleChange = (r) => {
    setRole(r);
    setPermissions({ ...ROLE_PERMISSIONS[r] });
  };

  const togglePerm = (key) => setPermissions(p => ({ ...p, [key]: !p[key] }));

  const toggleMember = (id) => setAssignedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleClass  = (id) => setAssignedClasses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSend = async () => {
    setLoading(true);
    try {
      await onCreate({
        user_email: email.trim(),
        name: name.trim() || email.split('@')[0],
        gym_id: gym.id,
        gym_name: gym.name,
        role,
        invite_status: 'pending',
        total_clients: assignedMembers.length,
        ...permissions,
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1); setEmail(''); setName(''); setRole('coach');
    setAdvOpen(false); setPermissions({ ...ROLE_PERMISSIONS.coach });
    setAssignedMembers([]); setAssignedClasses([]); setSent(false);
    onClose();
  };

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const stepLabel = sent ? 'Invite Sent' : ['', 'Basic Info', 'Permissions', 'Assign (optional)', 'Send Invite'][step];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />

      {/* Modal */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: T.card, border: `1px solid ${T.borderM}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text1 }}>{sent ? '🎉 Invite Sent!' : '+ Add Coach'}</div>
            {!sent && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Step {step} of 4 — {stepLabel}</div>}
          </div>
          <button onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text3 }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Progress bar */}
        {!sent && (
          <div style={{ height: 2, background: T.border }}>
            <div style={{ height: '100%', width: `${(step / 4) * 100}%`, background: T.blue, transition: 'width 0.35s ease', borderRadius: 99 }} />
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '22px 20px', minHeight: 280 }}>

          {/* SUCCESS */}
          {sent && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, background: `${T.green}0a`, border: `1px solid ${T.green}25`, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${T.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check style={{ width: 15, height: 15, color: T.green }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Invite sent to {email}</div>
                  <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{name || email.split('@')[0]} will receive a link to join as {role}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Recommended next steps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {NEXT_ACTIONS.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 9, background: T.card2, border: `1px solid ${T.border}`, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${T.blue}40`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.blue}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <a.icon style={{ width: 13, height: 13, color: T.blue }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{a.label}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>{a.desc}</div>
                    </div>
                    <ArrowRight style={{ width: 12, height: 12, color: T.text3 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {!sent && step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Email" required type="email" value={email} onChange={setEmail} placeholder="coach@example.com" autoFocus />
              <Input label="Name" type="text" value={name} onChange={setName} placeholder="Optional — we'll use email if blank" />
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Role</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {ROLES.map(r => (
                    <div key={r.id} onClick={() => handleRoleChange(r.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 9, cursor: 'pointer', background: role === r.id ? `${T.blue}0d` : T.card2, border: `1px solid ${role === r.id ? T.blue + '45' : T.border}`, transition: 'all 0.12s' }}>
                      <span style={{ fontSize: 16 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: role === r.id ? T.text1 : T.text2 }}>{r.label}</div>
                        <div style={{ fontSize: 10, color: T.text3 }}>{r.desc}</div>
                      </div>
                      {role === r.id && (
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check style={{ width: 9, height: 9, color: '#fff' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Permissions */}
          {!sent && step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: `${T.blue}08`, border: `1px solid ${T.blue}20` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4 }}>
                  {ROLES.find(r => r.id === role)?.icon} {role.charAt(0).toUpperCase() + role.slice(1)} role selected
                </div>
                <div style={{ fontSize: 12, color: T.text2 }}>{ROLES.find(r => r.id === role)?.desc}</div>
              </div>

              {/* Advanced toggle */}
              <button onClick={() => setAdvOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', borderRadius: 9, background: T.card2, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text2, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', width: '100%' }}>
                <span>Advanced permissions</span>
                {advOpen ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
              </button>

              {advOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 9, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  {[
                    { key: 'can_post',           label: 'Post on Feed',     desc: 'Create posts for members' },
                    { key: 'can_manage_events',  label: 'Manage Events',    desc: 'Create and edit events'  },
                    { key: 'can_manage_classes', label: 'Manage Classes',   desc: 'Create and edit classes' },
                  ].map((p, i, arr) => (
                    <div key={p.key} onClick={() => togglePerm(p.key)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 13px', background: T.card2, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{p.label}</div>
                        <div style={{ fontSize: 10, color: T.text3 }}>{p.desc}</div>
                      </div>
                      <div style={{ width: 38, height: 22, borderRadius: 99, background: permissions[p.key] ? T.blue : T.border, position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}>
                        <div style={{ position: 'absolute', top: 3, left: permissions[p.key] ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Assign */}
          {!sent && step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Assign Members <span style={{ color: T.text3, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>({assignedMembers.length} selected)</span></div>
                <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {allMemberships.length === 0 && <div style={{ fontSize: 12, color: T.text3, padding: '8px 0' }}>No members yet</div>}
                  {allMemberships.slice(0, 20).map(m => (
                    <div key={m.user_id} onClick={() => toggleMember(m.user_id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px', borderRadius: 8, cursor: 'pointer', background: assignedMembers.includes(m.user_id) ? `${T.blue}0d` : T.card2, border: `1px solid ${assignedMembers.includes(m.user_id) ? T.blue + '40' : T.border}` }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${T.blue}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.blue, flexShrink: 0 }}>
                        {(m.user_name || 'M').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text1 }}>{m.user_name || 'Member'}</span>
                      {assignedMembers.includes(m.user_id) && <Check style={{ width: 12, height: 12, color: T.blue }} />}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Assign Classes <span style={{ color: T.text3, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>({assignedClasses.length} selected)</span></div>
                <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {classes.length === 0 && <div style={{ fontSize: 12, color: T.text3, padding: '8px 0' }}>No classes yet</div>}
                  {classes.slice(0, 10).map(c => (
                    <div key={c.id} onClick={() => toggleClass(c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px', borderRadius: 8, cursor: 'pointer', background: assignedClasses.includes(c.id) ? `${T.purple}0d` : T.card2, border: `1px solid ${assignedClasses.includes(c.id) ? T.purple + '40' : T.border}` }}>
                      <Dumbbell style={{ width: 13, height: 13, color: assignedClasses.includes(c.id) ? T.purple : T.text3, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text1 }}>{c.name}</span>
                      {assignedClasses.includes(c.id) && <Check style={{ width: 12, height: 12, color: T.purple }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Confirm + Send */}
          {!sent && step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text2 }}>Review and send the invite</div>
              {[
                { label: 'Email', value: email },
                { label: 'Name',  value: name || `(will use email)` },
                { label: 'Role',  value: role.charAt(0).toUpperCase() + role.slice(1) },
                { label: 'Members assigned', value: assignedMembers.length > 0 ? `${assignedMembers.length} members` : 'None' },
                { label: 'Classes assigned',  value: assignedClasses.length > 0 ? `${assignedClasses.length} classes` : 'None' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sent ? (
            <Btn onClick={handleClose} style={{ width: '100%', justifyContent: 'center' }}>Done</Btn>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 7 }}>
                {step > 1 && <Btn variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Btn>}
                {step === 3 && (
                  <Btn variant="ghost" onClick={() => setStep(4)}>Skip for now</Btn>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {step < 4 ? (
                  <Btn onClick={() => setStep(s => s + 1)} disabled={step === 1 && !isValidEmail}>
                    Continue <ArrowRight style={{ width: 13, height: 13 }} />
                  </Btn>
                ) : (
                  <Btn onClick={handleSend} disabled={loading}>
                    {loading ? 'Sending…' : <>Send Invite <Send style={{ width: 13, height: 13 }} /></>}
                  </Btn>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}