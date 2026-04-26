/**
 * ManageCoachesModal — redesigned to match CreateGymOwnerPostModal design system.
 * Two-panel layout: coach roster (left) + coach detail / add panel (right).
 * Same tokens, animations, and interaction quality as the post creation modal.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, UserPlus, GraduationCap, Trash2, Mail, Clock,
  Shield, Eye, Edit3, BarChart2, Users, Star,
  CheckCircle, XCircle, Search, ChevronRight,
  Dumbbell, Calendar, MessageSquare, Award,
  AlertTriangle, Check, MoreHorizontal, Send,
} from 'lucide-react';

/* ─── TOKENS (identical to CreateGymOwnerPostModal) ──────────── */
const C = {
  bg:        '#0d0d11', surface:   '#17171c', card:      '#1f1f26', inset:     '#13131a',
  brd:       '#252530', brd2:      '#2e2e3a', brdHover:  '#3a3a48',
  t1:        '#ffffff', t2:        '#9898a6', t3:        '#525260',
  cyan:      '#60a5fa', cyanDim:   'rgba(96,165,250,0.07)',   cyanBrd:   'rgba(96,165,250,0.18)',
  red:       '#ff4d6d', redDim:    'rgba(255,77,109,0.08)',   redBrd:    'rgba(255,77,109,0.20)',
  amber:     '#f59e0b', amberDim:  'rgba(245,158,11,0.08)',   amberBrd:  'rgba(245,158,11,0.20)',
  green:     '#22c55e', greenDim:  'rgba(34,197,94,0.08)',    greenBrd:  'rgba(34,197,94,0.20)',
  blue:      '#2563eb', blueDim:   'rgba(37,99,235,0.08)',    blueBrd:   'rgba(37,99,235,0.20)',
  purple:    '#a78bfa', purpleDim: 'rgba(167,139,250,0.08)',  purpleBrd: 'rgba(167,139,250,0.20)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";

/* ─── ROLE CONFIG ────────────────────────────────────────────── */
const ROLES = {
  admin: {
    label: 'Admin', color: C.amber, dim: C.amberDim, brd: C.amberBrd, Icon: Shield,
    description: 'Full access to manage members, content, and settings.',
    permissions: {
      can_post: true, can_manage_events: true, can_manage_classes: true,
      can_manage_members: true, can_view_analytics: true,
    },
  },
  coach: {
    label: 'Coach', color: C.cyan, dim: C.cyanDim, brd: C.cyanBrd, Icon: GraduationCap,
    description: 'Can run classes, post updates, and manage their members.',
    permissions: {
      can_post: true, can_manage_events: true, can_manage_classes: true,
      can_manage_members: false, can_view_analytics: false,
    },
  },
  viewer: {
    label: 'Viewer', color: C.purple, dim: C.purpleDim, brd: C.purpleBrd, Icon: Eye,
    description: 'Read-only access. Cannot post or make changes.',
    permissions: {
      can_post: false, can_manage_events: false, can_manage_classes: false,
      can_manage_members: false, can_view_analytics: true,
    },
  },
};

const PERM_LABELS = {
  can_post:            { label: 'Post content',    Icon: MessageSquare },
  can_manage_events:   { label: 'Manage events',   Icon: Calendar       },
  can_manage_classes:  { label: 'Manage classes',  Icon: Dumbbell       },
  can_manage_members:  { label: 'Manage members',  Icon: Users          },
  can_view_analytics:  { label: 'View analytics',  Icon: BarChart2      },
};

const FILTER_TABS = ['All', 'Admin', 'Coach', 'Viewer', 'Pending'];

/* ─── HELPERS ────────────────────────────────────────────────── */
function ini(name = '') {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function isPending(coach) {
  return coach.invite_status === 'pending' || !coach.invite_status;
}

/* ─── SECTION LABEL ──────────────────────────────────────────── */
function SL({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Avatar({ coach, size = 36, role }) {
  const r = ROLES[role || coach.role] || ROLES.coach;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: coach.avatar_url ? 'transparent' : `${r.color}14`,
      border: `1.5px solid ${r.color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: r.color, overflow: 'hidden',
      boxShadow: `0 0 0 2px ${C.bg}, 0 0 12px ${r.color}18`,
    }}>
      {coach.avatar_url
        ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : ini(coach.name)
      }
    </div>
  );
}

/* ─── ROLE PILL ──────────────────────────────────────────────── */
function RolePill({ role, size = 'sm' }) {
  const r = ROLES[role] || ROLES.coach;
  return (
    <span style={{
      fontSize: size === 'sm' ? 9.5 : 11, fontWeight: 700,
      padding: size === 'sm' ? '1px 7px' : '3px 10px',
      borderRadius: 5, background: r.dim, border: `1px solid ${r.brd}`, color: r.color,
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <r.Icon size={size === 'sm' ? 8 : 10} /> {r.label}
    </span>
  );
}

/* ─── COACH LIST ITEM ────────────────────────────────────────── */
function CoachListItem({ coach, selected, onClick }) {
  const pending = isPending(coach);
  const [hovered, setHovered] = useState(false);
  const isActive = selected || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        cursor: 'pointer', transition: 'background 0.12s',
        background: selected ? `${C.blue}10` : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        borderLeft: `2px solid ${selected ? C.blue : 'transparent'}`,
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Avatar coach={coach} size={34} />
        {pending && (
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: C.amber, border: `1.5px solid ${C.bg}` }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {coach.name || 'Unnamed'}
          </span>
          {pending && (
            <span style={{ fontSize: 8.5, fontWeight: 700, color: C.amber, background: C.amberDim, border: `1px solid ${C.amberBrd}`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
              PENDING
            </span>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {coach.user_email || 'No email'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <RolePill role={coach.role || 'coach'} />
        <ChevronRight size={11} color={selected ? C.blue : C.t3} style={{ transition: 'color 0.15s' }} />
      </div>
    </div>
  );
}

/* ─── STAT CHIP ──────────────────────────────────────────────── */
function StatChip({ Icon, label, value, color = C.t2 }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={10} color={color} />
        <span style={{ fontSize: 9.5, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.t1, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

/* ─── PERMISSION ROW ─────────────────────────────────────────── */
function PermRow({ permKey, value }) {
  const p = PERM_LABELS[permKey];
  if (!p) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.brd}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p.Icon size={11} color={value ? C.cyan : C.t3} />
        <span style={{ fontSize: 12, color: value ? C.t1 : C.t3 }}>{p.label}</span>
      </div>
      {value
        ? <CheckCircle size={13} color={C.green} />
        : <XCircle size={13} color={C.t3} />
      }
    </div>
  );
}

/* ─── ROLE SELECTOR ──────────────────────────────────────────── */
function RoleSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {Object.entries(ROLES).map(([key, r]) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, cursor: 'pointer', fontFamily: FONT,
              background: active ? r.dim : C.card,
              border: `1px solid ${active ? r.brd : C.brd}`,
              color: active ? r.color : C.t3,
              fontSize: 11, fontWeight: 700,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <r.Icon size={13} />
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── COACH DETAIL PANEL ─────────────────────────────────────── */
function CoachDetail({ coach, onDelete, onUpdateRole, classes = [], checkIns = [], allMemberships = [], onClose }) {
  const [role, setRole] = useState(coach.role || 'coach');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = isPending(coach);

  const roleConfig = ROLES[role] || ROLES.coach;
  const hasChanges = role !== (coach.role || 'coach');

  // Derived stats
  const coachClasses = classes.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
  const memberCount = coach.total_clients || allMemberships.filter(m => m.coach_id === coach.id).length;
  const classCount = coachClasses.length;

  const handleSaveRole = async () => {
    if (!hasChanges) return;
    setSaving(true);
    const ROLE_PERMS = {
      coach:  { can_post: true,  can_manage_events: true,  can_manage_classes: true,  can_manage_members: false, can_view_analytics: false },
      admin:  { can_post: true,  can_manage_events: true,  can_manage_classes: true,  can_manage_members: true,  can_view_analytics: true  },
      viewer: { can_post: false, can_manage_events: false, can_manage_classes: false, can_manage_members: false, can_view_analytics: true  },
    };
    await onUpdateRole(coach.id, { role, ...ROLE_PERMS[role] });
    setSaving(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Coach hero */}
      <div style={{ padding: '20px 20px 0', background: C.surface, borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <Avatar coach={coach} role={role} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.t1, letterSpacing: '-0.02em' }}>{coach.name || 'Unnamed'}</span>
              <RolePill role={role} size="md" />
              {pending && (
                <span style={{ fontSize: 9, fontWeight: 700, color: C.amber, background: C.amberDim, border: `1px solid ${C.amberBrd}`, borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={8} /> INVITE PENDING
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: C.t3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mail size={10} /> {coach.user_email || 'No email on file'}
            </div>
            {pending && (
              <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 7, background: C.amberDim, border: `1px solid ${C.amberBrd}`, fontSize: 10.5, color: C.amber, lineHeight: 1.5 }}>
                Invite sent — waiting for this coach to accept before they gain access.
              </div>
            )}
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, paddingBottom: 16 }}>
          <StatChip Icon={Dumbbell}  label="Classes"  value={classCount  || '—'} color={C.cyan}  />
          <StatChip Icon={Users}     label="Members"  value={memberCount || '—'} color={C.blue}  />
          <StatChip Icon={Star}      label="Rating"   value={coach.rating ? `${coach.rating}★` : '—'} color={C.amber} />
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Role */}
        <div>
          <SL>Role</SL>
          <RoleSelector value={role} onChange={setRole} />
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 7, background: C.inset, border: `1px solid ${C.brd}`, fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
            {roleConfig.description}
          </div>
        </div>

        {/* Permissions */}
        <div>
          <SL>Permissions for {roleConfig.label}</SL>
          <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 9, padding: '0 12px', overflow: 'hidden' }}>
            {Object.entries(roleConfig.permissions).map(([key, val]) => (
              <PermRow key={key} permKey={key} value={val} />
            ))}
          </div>
        </div>

        {/* Classes assigned */}
        {coachClasses.length > 0 && (
          <div>
            <SL>Assigned Classes</SL>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {coachClasses.slice(0, 5).map((cls, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 8, background: C.card, border: `1px solid ${C.brd}` }}>
                  <Dumbbell size={10} color={C.cyan} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, flex: 1 }}>{cls.name}</span>
                  <span style={{ fontSize: 10, color: C.t3 }}>{cls.max_capacity || '—'} cap</span>
                </div>
              ))}
              {coachClasses.length > 5 && (
                <div style={{ fontSize: 10.5, color: C.t3, textAlign: 'center', padding: '4px 0' }}>+{coachClasses.length - 5} more classes</div>
              )}
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div style={{ marginTop: 'auto' }}>
          <SL>Danger Zone</SL>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ width: '100%', padding: '9px 0', borderRadius: 9, background: C.redDim, border: `1px solid ${C.redBrd}`, color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s' }}
            >
              <Trash2 size={12} /> Remove {coach.name?.split(' ')[0] || 'Coach'} from gym
            </button>
          ) : (
            <div style={{ padding: '12px', borderRadius: 9, background: C.redDim, border: `1px solid ${C.redBrd}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> Are you sure?
              </div>
              <div style={{ fontSize: 11, color: C.t2, marginBottom: 11, lineHeight: 1.5 }}>
                This will immediately revoke their access. This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: 'transparent', border: `1px solid ${C.brd2}`, color: C.t2, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
                <button onClick={() => { onDelete(coach.id); onClose(); }} style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: C.red, border: 'none', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Remove</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: `1px solid ${C.brd}`, background: C.surface, display: 'flex', gap: 9 }}>
          <button onClick={() => setRole(coach.role || 'coach')} style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd2}`, color: C.t2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Discard</button>
          <button onClick={handleSaveRole} disabled={saving} style={{ flex: 2, padding: '9px 0', borderRadius: 8, background: '#2563eb', border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: saving ? 0.7 : 1 }}>
            {saving ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'cm-spin 0.7s linear infinite' }} /> Saving…</> : <><Check size={12} /> Save Changes</>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── ADD COACH PANEL ────────────────────────────────────────── */
function AddCoachPanel({ gym, allMemberships = [], classes = [], onCreate, onCancel }) {
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState('coach');
  const [specialties, setSpecialties] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = name.trim() && email.trim().includes('@');

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const ROLE_PERMS = {
        coach:  { can_post: true,  can_manage_events: true,  can_manage_classes: true,  can_manage_members: false, can_view_analytics: false },
        admin:  { can_post: true,  can_manage_events: true,  can_manage_classes: true,  can_manage_members: true,  can_view_analytics: true  },
        viewer: { can_post: false, can_manage_events: false, can_manage_classes: false, can_manage_members: false, can_view_analytics: true  },
      };
      await onCreate({
        name: name.trim(), user_email: email.trim().toLowerCase(),
        role, invite_status: 'pending',
        specialties: specialties ? specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
        gym_id: gym?.id,
        ...ROLE_PERMS[role],
      });
    } catch (e) {
      setError('Failed to send invite. Please try again.');
      setSubmitting(false);
    }
  };

  const roleConfig = ROLES[role];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '18px 20px 16px', background: C.surface, borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={15} color={C.blue} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: '-0.02em' }}>Invite Coach</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>They'll get an email invite to join {gym?.name || 'your gym'}</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Full Name <span style={{ color: C.red }}>*</span></div>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = C.blueBrd}
            onBlur={e => e.target.style.borderColor = C.brd}
          />
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Email Address <span style={{ color: C.red }}>*</span></div>
          <div style={{ position: 'relative' }}>
            <Mail size={11} color={C.t3} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="coach@example.com" type="email"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px 10px 30px', borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = C.blueBrd}
              onBlur={e => e.target.style.borderColor = C.brd}
            />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Role</div>
          <RoleSelector value={role} onChange={setRole} />
          <div style={{ marginTop: 7, padding: '8px 10px', borderRadius: 7, background: C.inset, border: `1px solid ${C.brd}`, fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
            {roleConfig.description}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Specialties <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 9 }}>(optional, comma-separated)</span></div>
          <input
            value={specialties} onChange={e => setSpecialties(e.target.value)}
            placeholder="e.g. Strength, HIIT, Nutrition"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = C.blueBrd}
            onBlur={e => e.target.style.borderColor = C.brd}
          />
        </div>

        {/* Permissions preview */}
        <div>
          <SL>What they can do</SL>
          <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 9, padding: '0 12px', overflow: 'hidden' }}>
            {Object.entries(roleConfig.permissions).map(([key, val]) => (
              <PermRow key={key} permKey={key} value={val} />
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '9px 12px', borderRadius: 8, background: C.redDim, border: `1px solid ${C.redBrd}`, fontSize: 11.5, color: C.red, display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={11} /> {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: `1px solid ${C.brd}`, background: C.surface, display: 'flex', gap: 9 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd2}`, color: C.t2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{ flex: 2, padding: '9px 0', borderRadius: 8, background: canSubmit ? '#2563eb' : C.brd2, border: 'none', color: canSubmit ? '#fff' : C.t3, fontSize: 12.5, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s', opacity: submitting ? 0.7 : 1 }}>
          {submitting
            ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'cm-spin 0.7s linear infinite' }} /> Sending…</>
            : <><Send size={12} /> Send Invite</>
          }
        </button>
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyPanel({ onAdd }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GraduationCap size={24} color={`${C.blue}80`} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 6 }}>Select a coach</div>
        <div style={{ fontSize: 11.5, color: C.t3, lineHeight: 1.6, maxWidth: 220 }}>Choose a coach from the list to view details, change their role, or remove them.</div>
      </div>
      <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, background: '#2563eb', border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
        <UserPlus size={13} /> Invite First Coach
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN MODAL
═══════════════════════════════════════════════════════════════ */
export default function ManageCoachesModal({
  open, onClose,
  coaches = [], onCreateCoach, onDeleteCoach, onUpdateCoach,
  gym, isLoading, allMemberships = [], classes = [],
}) {
  const [selectedId,   setSelectedId]   = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [filterTab,    setFilterTab]    = useState('All');
  const [search,       setSearch]       = useState('');
  const [isMobile,     setIsMobile]     = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [mobilePanel, setMobilePanel]   = useState('list'); // 'list' | 'detail'

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) { setSelectedId(null); setShowAdd(false); setFilterTab('All'); setSearch(''); setMobilePanel('list'); }
  }, [open]);

  const filteredCoaches = useMemo(() => {
    return coaches.filter(c => {
      const matchSearch = !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.user_email || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterTab === 'All'
        ? true
        : filterTab === 'Pending'
          ? isPending(c)
          : (c.role || 'coach').toLowerCase() === filterTab.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [coaches, search, filterTab]);

  const selectedCoach = coaches.find(c => c.id === selectedId);

  const pendingCount = coaches.filter(isPending).length;

  const tabCounts = {
    All: coaches.length,
    Admin: coaches.filter(c => c.role === 'admin').length,
    Coach: coaches.filter(c => !c.role || c.role === 'coach').length,
    Viewer: coaches.filter(c => c.role === 'viewer').length,
    Pending: pendingCount,
  };

  const handleSelectCoach = (id) => {
    setSelectedId(id);
    setShowAdd(false);
    if (isMobile) setMobilePanel('detail');
  };

  const handleShowAdd = () => {
    setShowAdd(true);
    setSelectedId(null);
    if (isMobile) setMobilePanel('detail');
  };

  const handleCreate = async (data) => {
    await onCreateCoach(data);
    setShowAdd(false);
  };

  const handleBackToList = () => {
    setMobilePanel('list');
    setShowAdd(false);
    setSelectedId(null);
  };

  if (!open) return null;

  const showListPanel  = !isMobile || mobilePanel === 'list';
  const showRightPanel = !isMobile || mobilePanel === 'detail';

  return (
    <>
      <style>{`
        @keyframes cm-in      { from{opacity:0;transform:scale(0.975) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes cm-slide   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cm-fade    { from{opacity:0} to{opacity:1} }
        @keyframes cm-spin    { to{transform:rotate(360deg)} }

        .cm-search {
          width:100%; box-sizing:border-box;
          padding:8px 12px 8px 32px;
          border-radius:8px; background:${C.inset}; border:1px solid ${C.brd};
          color:${C.t1}; font-size:12px; outline:none; font-family:${FONT};
          transition:border-color 0.15s;
        }
        .cm-search:focus { border-color:${C.blueBrd}; }
        .cm-search::placeholder { color:${C.t3}; }

        .cm-tab {
          padding:8px 11px; cursor:pointer; font-size:12px; color:${C.t2};
          font-weight:500; background:none; border:none;
          border-bottom:2px solid transparent;
          font-family:${FONT}; transition:color 0.15s; white-space:nowrap;
        }
        .cm-tab:hover { color:${C.t1}; }
        .cm-tab-active { color:${C.t1} !important; font-weight:700 !important; border-bottom-color:${C.blue} !important; }

        ::-webkit-scrollbar        { width:3px; }
        ::-webkit-scrollbar-track  { background:transparent; }
        ::-webkit-scrollbar-thumb  { background:${C.brd2}; border-radius:2px; }

        @media (max-width: 768px) {
          .cm-search { font-size:16px; }
        }
      `}</style>

      {/* BACKDROP */}
      <div
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20, animation: 'cm-fade 0.15s ease', fontFamily: FONT }}
      >
        {/* MODAL SHELL */}
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 860, maxHeight: isMobile ? '96vh' : '88vh', height: isMobile ? '96vh' : '680px', display: 'flex', flexDirection: 'column', background: C.bg, border: isMobile ? 'none' : `1px solid ${C.brd}`, borderRadius: isMobile ? '20px 20px 0 0' : 14, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.85)', animation: isMobile ? 'cm-slide 0.3s cubic-bezier(0.32,0.72,0,1)' : 'cm-in 0.24s cubic-bezier(0.16,1,0.3,1)', WebkitFontSmoothing: 'antialiased' }}>

          {/* HEADER */}
          <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.brd}` }}>
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: C.brd2 }} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '6px 16px 0' : '14px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                {isMobile && mobilePanel === 'detail' && (
                  <button onClick={handleBackToList} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${C.brd}`, cursor: 'pointer', color: C.t2, flexShrink: 0 }}>
                    <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                )}
                <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 9, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GraduationCap size={isMobile ? 12 : 14} color={C.blue} />
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Coaches & Team
                  </div>
                  {!isMobile && (
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>
                      {coaches.length} {coaches.length === 1 ? 'coach' : 'coaches'} · {gym?.name}
                      {pendingCount > 0 && <span style={{ marginLeft: 7, color: C.amber }}>{pendingCount} pending</span>}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={handleShowAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '7px 11px' : '8px 14px', borderRadius: 8, background: '#2563eb', border: 'none', color: '#fff', fontSize: isMobile ? 11.5 : 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  <UserPlus size={12} /> {isMobile ? 'Invite' : 'Invite Coach'}
                </button>
                <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.t1}
                  onMouseLeave={e => e.currentTarget.style.color = C.t3}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter tabs — only on list panel */}
            {showListPanel && (
              <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', marginLeft: isMobile ? -2 : 0, padding: isMobile ? '0 14px' : '0 18px' }}>
                {FILTER_TABS.map(tab => (
                  <button key={tab} onClick={() => setFilterTab(tab)} className={`cm-tab ${filterTab === tab ? 'cm-tab-active' : ''}`}>
                    {tab}
                    {tabCounts[tab] > 0 && (
                      <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, color: filterTab === tab ? C.blue : C.t3, background: filterTab === tab ? C.blueDim : 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '0px 5px' }}>
                        {tabCounts[tab]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BODY — two-panel grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', minHeight: 0, overflow: 'hidden' }}>

            {/* LEFT: Coach List */}
            {showListPanel && (
              <div style={{ display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : `1px solid ${C.brd}`, overflow: 'hidden', background: C.bg }}>

                {/* Search */}
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={11} color={C.t3} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      className="cm-search"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search coaches…"
                    />
                  </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: C.t3, fontSize: 12 }}>
                      <div style={{ width: 14, height: 14, border: `2px solid ${C.brd2}`, borderTop: `2px solid ${C.blue}`, borderRadius: '50%', animation: 'cm-spin 0.8s linear infinite' }} /> Loading…
                    </div>
                  ) : filteredCoaches.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10, textAlign: 'center' }}>
                      <GraduationCap size={22} color={C.t3} style={{ opacity: 0.5 }} />
                      <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.5 }}>
                        {search ? `No coaches match "${search}"` : 'No coaches in this category'}
                      </div>
                    </div>
                  ) : (
                    filteredCoaches.map(coach => (
                      <CoachListItem
                        key={coach.id}
                        coach={coach}
                        selected={selectedId === coach.id}
                        onClick={() => handleSelectCoach(coach.id)}
                      />
                    ))
                  )}
                </div>

                {/* Bottom summary */}
                {coaches.length > 0 && (
                  <div style={{ flexShrink: 0, padding: '9px 14px', borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                    {[
                      { color: C.amber, label: 'Admins',  count: tabCounts.Admin   },
                      { color: C.cyan,  label: 'Coaches', count: tabCounts.Coach   },
                      { color: C.t3,    label: 'Pending', count: tabCounts.Pending },
                    ].map((s, i) => s.count > 0 && (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10.5, color: C.t3 }}>{s.count} {s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RIGHT: Detail / Add / Empty */}
            {showRightPanel && (
              <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', background: C.bg }}>
                {showAdd ? (
                  <AddCoachPanel
                    gym={gym}
                    allMemberships={allMemberships}
                    classes={classes}
                    onCreate={handleCreate}
                    onCancel={() => { setShowAdd(false); if (isMobile) setMobilePanel('list'); }}
                  />
                ) : selectedCoach ? (
                  <CoachDetail
                    coach={selectedCoach}
                    onDelete={onDeleteCoach}
                    onUpdateRole={(id, data) => onUpdateCoach(id, data)}
                    classes={classes}
                    allMemberships={allMemberships}
                    onClose={() => { setSelectedId(null); if (isMobile) setMobilePanel('list'); }}
                  />
                ) : (
                  <EmptyPanel onAdd={handleShowAdd} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
