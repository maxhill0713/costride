import React, { useState } from 'react';
import {
  X, Check, UserPlus, Users, Dumbbell, Send,
  ArrowRight, Mail, ChevronDown, ChevronUp,
  Shield, Eye, Settings, CheckCircle,
} from 'lucide-react';

// ── Design tokens — matches the rest of the dashboard ────────────────────────
const T = {
  cyan:    '#06b6d4',
  green:   '#10b981',
  red:     '#ef4444',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  card2:   '#0d1630',
  divider: 'rgba(255,255,255,0.05)',
  bg:      '#060c18',
};

function Shimmer({ color = T.cyan }) {
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}30,transparent)`, pointerEvents: 'none' }} />;
}

// ── Role catalogue ────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'coach',
    label: 'Coach',
    icon: Dumbbell,
    desc: 'Manage members, run classes, post content',
    perms: { can_post: true, can_manage_events: true, can_manage_classes: true },
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    desc: 'Full access to everything — same as owner',
    perms: { can_post: true, can_manage_events: true, can_manage_classes: true },
  },
  {
    id: 'viewer',
    label: 'Viewer',
    icon: Eye,
    desc: 'Read-only access — can view but not edit',
    perms: { can_post: false, can_manage_events: false, can_manage_classes: false },
  },
];

const PERMS_META = [
  { key: 'can_post',           label: 'Post on Feed',   desc: 'Create and publish posts for members' },
  { key: 'can_manage_events',  label: 'Manage Events',  desc: 'Create, edit and delete events'       },
  { key: 'can_manage_classes', label: 'Manage Classes', desc: 'Create, edit and delete classes'      },
];

const STEPS = ['Basic Info', 'Permissions', 'Assign', 'Review'];

// ── Field label ───────────────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
      {children}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Inp({ label, required, type = 'text', value, onChange, placeholder, autoFocus }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        onFocus={e => { setFocus(true); e.target.style.borderColor = `${T.cyan}45`; e.target.style.background = `${T.cyan}05`; }}
        onBlur={e  => { setFocus(false); e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: T.text1, fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s' }}
      />
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, color = T.cyan }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ flexShrink: 0, width: 38, height: 21, borderRadius: 99, background: value ? color : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 2.5, left: value ? 19 : 2.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function Pill({ value, color }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 6, padding: '2px 8px' }}>{value}</span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AddCoachModal({ open, onClose, gym, allMemberships = [], classes = [], onCreate }) {
  const [step,             setStep]             = useState(1);
  const [email,            setEmail]            = useState('');
  const [name,             setName]             = useState('');
  const [role,             setRole]             = useState('coach');
  const [advOpen,          setAdvOpen]          = useState(false);
  const [permissions,      setPermissions]      = useState({ ...ROLES[0].perms });
  const [assignedMembers,  setAssignedMembers]  = useState([]);
  const [assignedClasses,  setAssignedClasses]  = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [sent,             setSent]             = useState(false);
  const [memberSearch,     setMemberSearch]     = useState('');

  if (!open) return null;

  const handleRoleChange = (r) => {
    setRole(r);
    setPermissions({ ...ROLES.find(x => x.id === r)?.perms });
  };

  const toggleMember = (id) => setAssignedMembers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleClass  = (id) => setAssignedClasses(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSend = async () => {
    setLoading(true);
    try {
      await onCreate({
        user_email: email.trim(),
        name: name.trim() || email.split('@')[0],
        gym_id: gym.id, gym_name: gym.name,
        role, invite_status: 'pending',
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
    setAdvOpen(false); setPermissions({ ...ROLES[0].perms });
    setAssignedMembers([]); setAssignedClasses([]); setSent(false);
    setMemberSearch('');
    onClose();
  };

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const activeRole   = ROLES.find(r => r.id === role);
  const filteredMembers = allMemberships.filter(m =>
    !memberSearch || (m.user_name || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
        @keyframes ac-overlay { from { opacity:0 } to { opacity:1 } }
        @keyframes ac-modal   { from { opacity:0; transform:scale(0.97) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
        .ac-scroll::-webkit-scrollbar { width:3px } .ac-scroll::-webkit-scrollbar-track { background:transparent } .ac-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px }
        .ac-cancel:hover { background:rgba(255,255,255,0.08)!important; color:#f0f4f8!important }
        .ac-primary:not(:disabled):hover { opacity:0.88 }
      `}</style>

      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(2,5,20,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'ac-overlay 0.18s ease', fontFamily: "'DM Sans', system-ui, sans-serif" }}
        onClick={e => e.target === e.currentTarget && handleClose()}>

        {/* Modal */}
        <div style={{ width: '100%', maxWidth: 520, background: '#07101f', border: `1px solid ${T.borderM}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04) inset', animation: 'ac-modal 0.22s cubic-bezier(0.34,1.4,0.64,1)', display: 'flex', flexDirection: 'column' }}>

          {/* ── Header ── */}
          <div style={{ flexShrink: 0, padding: '18px 22px 16px', borderBottom: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
            <Shimmer color={sent ? T.green : T.cyan} />
            <div style={{ position: 'absolute', top: -40, left: -20, width: 160, height: 90, borderRadius: '50%', background: sent ? T.green : T.cyan, opacity: 0.04, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sent ? T.green : T.cyan}14`, border: `1px solid ${sent ? T.green : T.cyan}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {sent
                    ? <CheckCircle style={{ width: 16, height: 16, color: T.green }} />
                    : <UserPlus style={{ width: 16, height: 16, color: T.cyan }} />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text1, letterSpacing: '-0.02em' }}>{sent ? 'Invite Sent' : 'Add Coach'}</div>
                  <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>
                    {sent ? `Invite sent to ${email}` : `Step ${step} of 4 — ${STEPS[step - 1]}`}
                  </div>
                </div>
              </div>
              <button onClick={handleClose}
                style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text3 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = T.text1; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.text3; }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          </div>

          {/* ── Step progress dots ── */}
          {!sent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 22px 0' }}>
              {STEPS.map((label, i) => {
                const idx   = i + 1;
                const done  = idx < step;
                const active= idx === step;
                return (
                  <React.Fragment key={i}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? T.green : active ? T.cyan : 'rgba(255,255,255,0.06)', border: `1px solid ${done ? T.green + '50' : active ? T.cyan + '50' : T.border}`, transition: 'all 0.2s' }}>
                        {done
                          ? <Check style={{ width: 11, height: 11, color: '#fff' }} />
                          : <span style={{ fontSize: 10, fontWeight: 800, color: active ? '#fff' : T.text3 }}>{idx}</span>
                        }
                      </div>
                      <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? T.cyan : done ? T.green : T.text3, whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: i + 1 < step ? T.green : T.border, margin: '0 4px', marginBottom: 18, transition: 'background 0.3s' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ── Body ── */}
          <div className="ac-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 6px' }}>

            {/* SUCCESS */}
            {sent && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 11, background: `${T.green}08`, border: `1px solid ${T.green}22`, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check style={{ width: 16, height: 16, color: T.green }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Invite sent to {email}</div>
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
                      {name || email.split('@')[0]} will get a link to join {gym?.name} as <strong style={{ color: T.cyan }}>{role}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Suggested next steps</div>
                {[
                  { icon: Users,    label: 'Assign members',       desc: 'Connect members to this coach'       },
                  { icon: Dumbbell, label: 'Schedule a class',     desc: 'Add a class to their timetable'      },
                  { icon: Mail,     label: 'Send a welcome note',  desc: 'Post a message to the community feed' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 10, background: T.card2, border: `1px solid ${T.border}`, cursor: 'pointer', marginBottom: 7, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${T.cyan}35`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.cyan}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <a.icon style={{ width: 13, height: 13, color: T.cyan }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{a.label}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>{a.desc}</div>
                    </div>
                    <ArrowRight style={{ width: 12, height: 12, color: T.text3 }} />
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 1: Basic Info ── */}
            {!sent && step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Inp label="Email address" required type="email" value={email} onChange={setEmail} placeholder="coach@example.com" autoFocus />
                <Inp label="Display name" value={name} onChange={setName} placeholder="Optional — uses email if left blank" />

                {/* Role picker */}
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {ROLES.map(r => {
                      const active = role === r.id;
                      const Icon   = r.icon;
                      return (
                        <div key={r.id} onClick={() => handleRoleChange(r.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, cursor: 'pointer', background: active ? `${T.cyan}0c` : T.card2, border: `1px solid ${active ? T.cyan + '40' : T.border}`, transition: 'all 0.15s' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? `${T.cyan}18` : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? T.cyan + '30' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            <Icon style={{ width: 14, height: 14, color: active ? T.cyan : T.text3 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: active ? T.text1 : T.text2 }}>{r.label}</div>
                            <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{r.desc}</div>
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? T.cyan : T.border}`, background: active ? T.cyan : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Permissions ── */}
            {!sent && step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Role summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 11, background: `${T.cyan}08`, border: `1px solid ${T.cyan}20`, position: 'relative', overflow: 'hidden' }}>
                  <Shimmer color={T.cyan} />
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${T.cyan}14`, border: `1px solid ${T.cyan}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {activeRole && <activeRole.icon style={{ width: 15, height: 15, color: T.cyan }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{activeRole?.label} role</div>
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{activeRole?.desc}</div>
                  </div>
                </div>

                {/* Permissions list — always visible */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <FieldLabel>Permissions</FieldLabel>
                    <button onClick={() => setAdvOpen(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: T.cyan, background: `${T.cyan}0a`, border: `1px solid ${T.cyan}25`, borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Customize {advOpen ? <ChevronUp style={{ width: 10, height: 10 }} /> : <ChevronDown style={{ width: 10, height: 10 }} />}
                    </button>
                  </div>

                  {/* Read-only summary or editable */}
                  <div style={{ borderRadius: 11, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                    {PERMS_META.map((p, i) => (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: T.card2, borderBottom: i < PERMS_META.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: permissions[p.key] ? T.green : T.text3, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{p.label}</div>
                          <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{p.desc}</div>
                        </div>
                        {advOpen
                          ? <Toggle value={permissions[p.key]} onChange={v => setPermissions(prev => ({ ...prev, [p.key]: v }))} />
                          : <span style={{ fontSize: 11, fontWeight: 700, color: permissions[p.key] ? T.green : T.text3 }}>{permissions[p.key] ? 'Enabled' : 'Disabled'}</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Assign ── */}
            {!sent && step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Members */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <FieldLabel>Members</FieldLabel>
                    {assignedMembers.length > 0 && <Pill value={`${assignedMembers.length} selected`} color={T.cyan} />}
                  </div>
                  {allMemberships.length > 6 && (
                    <div style={{ marginBottom: 8 }}>
                      <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members…"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: T.text1, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  )}
                  <div className="ac-scroll" style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {allMemberships.length === 0 && (
                      <div style={{ padding: '14px', borderRadius: 9, background: T.card2, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: T.text3 }}>No members yet — add them from the Members tab</div>
                      </div>
                    )}
                    {filteredMembers.slice(0, 30).map(m => {
                      const sel = assignedMembers.includes(m.user_id);
                      return (
                        <div key={m.user_id} onClick={() => toggleMember(m.user_id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', background: sel ? `${T.cyan}08` : T.card2, border: `1px solid ${sel ? T.cyan + '35' : T.border}`, transition: 'all 0.12s' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: sel ? `${T.cyan}18` : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: sel ? T.cyan : T.text3, flexShrink: 0 }}>
                            {(m.user_name || 'M').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: sel ? T.text1 : T.text2 }}>{m.user_name || 'Member'}</span>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel ? T.cyan : T.border}`, background: sel ? T.cyan : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {sel && <Check style={{ width: 9, height: 9, color: '#fff' }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Classes */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <FieldLabel>Classes</FieldLabel>
                    {assignedClasses.length > 0 && <Pill value={`${assignedClasses.length} selected`} color={T.cyan} />}
                  </div>
                  <div className="ac-scroll" style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {classes.length === 0 && (
                      <div style={{ padding: '14px', borderRadius: 9, background: T.card2, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: T.text3 }}>No classes yet — create them from the Gym tab</div>
                      </div>
                    )}
                    {classes.slice(0, 15).map(c => {
                      const sel = assignedClasses.includes(c.id);
                      return (
                        <div key={c.id} onClick={() => toggleClass(c.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', background: sel ? `${T.green}07` : T.card2, border: `1px solid ${sel ? T.green + '35' : T.border}`, transition: 'all 0.12s' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: sel ? `${T.green}14` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            <Dumbbell style={{ width: 12, height: 12, color: sel ? T.green : T.text3 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: sel ? T.text1 : T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                            {c.schedule && <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{c.schedule}</div>}
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel ? T.green : T.border}`, background: sel ? T.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {sel && <Check style={{ width: 9, height: 9, color: '#fff' }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Review ── */}
            {!sent && step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: T.text3, marginBottom: 4 }}>Review everything before sending the invite.</div>

                {/* Identity card */}
                <div style={{ padding: '14px 16px', borderRadius: 11, background: T.card2, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
                  <Shimmer color={T.cyan} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${T.cyan}14`, border: `1px solid ${T.cyan}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: T.cyan, flexShrink: 0 }}>
                      {(name || email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text1 }}>{name || email.split('@')[0]}</div>
                      <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{email}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <Pill value={role.charAt(0).toUpperCase() + role.slice(1)} color={T.cyan} />
                    </div>
                  </div>
                </div>

                {/* Summary rows */}
                <div style={{ borderRadius: 11, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  {[
                    { label: 'Gym',              value: gym?.name || '—' },
                    { label: 'Members assigned', value: assignedMembers.length > 0 ? `${assignedMembers.length} member${assignedMembers.length !== 1 ? 's' : ''}` : 'None' },
                    { label: 'Classes assigned', value: assignedClasses.length > 0 ? `${assignedClasses.length} class${assignedClasses.length !== 1 ? 'es' : ''}` : 'None' },
                  ].map((r, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: T.card2, borderBottom: i < arr.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                      <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Permissions summary */}
                <div style={{ borderRadius: 11, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  {PERMS_META.map((p, i) => (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: T.card2, borderBottom: i < PERMS_META.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: permissions[p.key] ? T.green : T.text3, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: T.text2 }}>{p.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: permissions[p.key] ? T.green : T.text3 }}>
                        {permissions[p.key] ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ flexShrink: 0, padding: '14px 22px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: sent ? 'stretch' : 'space-between', gap: 10 }}>
            {sent ? (
              <button onClick={handleClose}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: `${T.cyan}12`, color: T.cyan, border: `1px solid ${T.cyan}30`, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check style={{ width: 13, height: 13 }} /> Done
              </button>
            ) : (
              <>
                {/* Left: Back + Skip */}
                <div style={{ display: 'flex', gap: 7 }}>
                  {step > 1 && (
                    <button className="ac-cancel" onClick={() => setStep(s => s - 1)}
                      style={{ padding: '10px 16px', borderRadius: 10, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      Back
                    </button>
                  )}
                  {step === 3 && (
                    <button className="ac-cancel" onClick={() => setStep(4)}
                      style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', color: T.text3, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Skip
                    </button>
                  )}
                </div>

                {/* Right: footer status + Continue/Send */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {step === 1 && email && !isValidEmail && (
                    <span style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>Enter a valid email</span>
                  )}
                  {step === 4 && isValidEmail && (
                    <span style={{ fontSize: 10, color: T.text3 }}>{name || email.split('@')[0]} · {role}</span>
                  )}

                  {step < 4 ? (
                    <button className="ac-primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !isValidEmail}
                      style={{ padding: '10px 20px', borderRadius: 10, background: step === 1 && !isValidEmail ? 'rgba(255,255,255,0.06)' : T.cyan, color: step === 1 && !isValidEmail ? T.text3 : '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: step === 1 && !isValidEmail ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s' }}>
                      Continue <ArrowRight style={{ width: 13, height: 13 }} />
                    </button>
                  ) : (
                    <button className="ac-primary" onClick={handleSend} disabled={loading || !isValidEmail}
                      style={{ padding: '10px 22px', borderRadius: 10, background: loading || !isValidEmail ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${T.green},#059669)`, color: loading || !isValidEmail ? T.text3 : '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: loading || !isValidEmail ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', boxShadow: !loading && isValidEmail ? `0 4px 14px ${T.green}35` : 'none', minWidth: 130, justifyContent: 'center' }}>
                      {loading
                        ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'ac-modal 0.7s linear infinite' }} /> Sending…</>
                        : <><Send style={{ width: 13, height: 13 }} /> Send Invite</>
                      }
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
