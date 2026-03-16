import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Home, Calendar, Users, BookOpen, MessageSquare, User,
  Plus, Building2, Search, Edit2, X, Dumbbell, Menu, LogOut,
  Star, Clock
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'community', label: 'Community', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function StatCard({ label, value, color }) {
  return (
    <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
      <p style={{ color, fontWeight: 900, fontSize: 24, margin: '0 0 2px' }}>{value}</p>
      <p style={{ color: '#64748b', fontSize: 11, margin: 0, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function ClassCard({ cls, onEdit, onDelete, showActions }) {
  const diffColors = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444', all_levels: '#3b82f6' };
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Dumbbell size={18} color="#60a5fa" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cls.duration_minutes && <span style={{ color: '#475569', fontSize: 11 }}>{cls.duration_minutes}min</span>}
          {cls.difficulty && (
            <span style={{ color: diffColors[cls.difficulty] || '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 6, background: `${diffColors[cls.difficulty] || '#3b82f6'}20` }}>
              {cls.difficulty.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
      {showActions && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ padding: '6px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Edit</button>
          <button onClick={onDelete} style={{ padding: '6px 10px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>Delete</button>
        </div>
      )}
    </div>
  );
}

function JoinGymModal({ onClose, onRequest, currentUser }) {
  const [query, setQuery] = useState('');

  const { data: results = [] } = useQuery({
    queryKey: ['gymSearchCoach', query],
    queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 30),
    enabled: query.length >= 2,
    select: (data) => data.filter(g => g.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: 440, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, zIndex: 201, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 18, margin: 0 }}>Request to Join a Gym</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search gyms..." style={{ width: '100%', padding: '11px 12px 11px 36px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {query.length < 2 && <p style={{ color: '#334155', textAlign: 'center', fontSize: 13, padding: '20px 0' }}>Type to search gyms...</p>}
          {query.length >= 2 && results.length === 0 && <p style={{ color: '#334155', textAlign: 'center', fontSize: 13, padding: '20px 0' }}>No gyms found</p>}
          {results.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={16} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</p>
                <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>{g.city}</p>
              </div>
              <button onClick={() => onRequest(g)} style={{ padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                Request
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ClassModal({ cls, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(cls || { name: '', description: '', duration_minutes: 60, difficulty: 'all_levels' });
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: 440, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, zIndex: 201, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 18, margin: 0 }}>{cls?.id ? 'Edit Class' : 'New Class'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['name', 'Class Name', 'e.g. Morning HIIT', false], ['description', 'Description', 'What to expect...', true]].map(([key, label, ph, multi]) => (
            <div key={key}>
              <label style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{label}</label>
              {multi ? (
                <textarea value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} rows={3} style={{ width: '100%', padding: '11px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              ) : (
                <input value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={{ width: '100%', padding: '11px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              )}
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Duration (min)</label>
              <input type="number" value={form.duration_minutes || 60} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))} style={{ width: '100%', padding: '11px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Difficulty</label>
              <select value={form.difficulty || 'all_levels'} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: 12, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all_levels">All Levels</option>
              </select>
            </div>
          </div>
          <button onClick={() => onSave(form)} disabled={!form.name || isSaving} style={{ padding: '13px', borderRadius: 14, background: form.name ? 'linear-gradient(to bottom, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.05)', border: 'none', color: form.name ? '#fff' : '#334155', fontWeight: 700, fontSize: 14, cursor: form.name ? 'pointer' : 'not-allowed', marginTop: 4 }}>
            {isSaving ? 'Saving...' : cls?.id ? 'Save Changes' : 'Create Class'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function CoachDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classModal, setClassModal] = useState(null); // null | 'new' | classObj
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({});

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coachRecord } = useQuery({
    queryKey: ['myCoachRecord', currentUser?.email],
    queryFn: async () => {
      const r = await base44.entities.Coach.filter({ user_email: currentUser.email });
      return r?.[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  const { data: gym } = useQuery({
    queryKey: ['coachGym', coachRecord?.gym_id],
    queryFn: async () => {
      const r = await base44.entities.Gym.filter({ id: coachRecord.gym_id });
      return r?.[0] || null;
    },
    enabled: !!coachRecord?.gym_id,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['coachClasses', coachRecord?.gym_id, currentUser?.full_name],
    queryFn: () => coachRecord?.gym_id
      ? base44.entities.GymClass.filter({ gym_id: coachRecord.gym_id })
      : base44.entities.GymClass.filter({ instructor: currentUser?.full_name }),
    enabled: !!coachRecord,
  });

  const { data: gymMembers = [] } = useQuery({
    queryKey: ['gymMembersCoach', coachRecord?.gym_id],
    queryFn: () => base44.entities.GymMembership.filter({ gym_id: coachRecord.gym_id, status: 'active' }),
    enabled: !!coachRecord?.gym_id,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['coachCommunityPosts', coachRecord?.gym_id],
    queryFn: () => base44.entities.Post.filter({ gym_id: coachRecord.gym_id }, '-created_date', 15),
    enabled: !!coachRecord?.gym_id,
  });

  const updateCoachMutation = useMutation({
    mutationFn: (data) => coachRecord?.id
      ? base44.entities.Coach.update(coachRecord.id, data)
      : base44.entities.Coach.create({ ...data, user_email: currentUser?.email, name: currentUser?.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myCoachRecord'] }); setEditingProfile(false); },
  });

  const requestJoinMutation = useMutation({
    mutationFn: async (g) => {
      await base44.entities.Notification.create({
        user_id: g.admin_id || g.owner_email,
        type: 'coach_join_request',
        title: `${currentUser?.full_name} wants to join your gym`,
        message: `Coach ${currentUser?.full_name} has requested to join ${g.name}`,
        data: JSON.stringify({ coach_email: currentUser?.email, gym_id: g.id, gym_name: g.name }),
        read: false,
      });
    },
    onSuccess: () => { setShowJoinModal(false); alert('Request sent! The gym owner will review it.'); },
  });

  const saveClassMutation = useMutation({
    mutationFn: (form) => form.id
      ? base44.entities.GymClass.update(form.id, form)
      : base44.entities.GymClass.create({ ...form, gym_id: coachRecord?.gym_id, gym_name: gym?.name, instructor: currentUser?.full_name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coachClasses'] }); setClassModal(null); },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => base44.entities.GymClass.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coachClasses'] }),
  });

  const isConnected = !!coachRecord?.gym_id;

  // ── Tab renderers ──────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div style={{ padding: '24px 20px', maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 22, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Coach'} 👋
        </h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          {gym ? `${gym.name} · Gym Coach` : 'Independent Coach'}
        </p>
      </div>

      {!isConnected && (
        <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: '#93c5fd', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>You're operating as an independent coach</p>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>Join a gym to reach more clients and appear on their public page.</p>
          <button onClick={() => setShowJoinModal(true)} style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            Request to Join a Gym
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        <StatCard label="Classes" value={classes.length} color="#3b82f6" />
        <StatCard label="Clients" value={gymMembers.length} color="#22c55e" />
        <StatCard label="Scheduled" value={classes.filter(c => c.schedule?.length > 0).length} color="#a855f7" />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Your Classes</p>
          <button onClick={() => setActiveTab('classes')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>See all</button>
        </div>
        {classes.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#334155', fontSize: 13, margin: '0 0 12px' }}>No classes yet.</p>
            <button onClick={() => setClassModal('new')} style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Create First Class</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {classes.slice(0, 3).map(cls => <ClassCard key={cls.id} cls={cls} />)}
          </div>
        )}
      </div>
    </div>
  );

  const renderClasses = () => (
    <div style={{ padding: '24px 20px', maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 20, margin: 0 }}>Classes</h2>
        <button onClick={() => setClassModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <Plus size={14} /> New Class
        </button>
      </div>
      {classes.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
          <BookOpen size={32} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ color: '#334155', fontSize: 14, margin: '0 0 16px' }}>No classes yet</p>
          <button onClick={() => setClassModal('new')} style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Create First Class</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {classes.map(cls => (
            <ClassCard key={cls.id} cls={cls} showActions
              onEdit={() => setClassModal(cls)}
              onDelete={() => deleteClassMutation.mutate(cls.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderSchedule = () => {
    const withSchedule = classes.filter(c => c.schedule?.length > 0);
    return (
      <div style={{ padding: '24px 20px', maxWidth: 680 }}>
        <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 20, margin: '0 0 20px' }}>Weekly Schedule</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DAY_NAMES.map(day => {
            const dayClasses = withSchedule.filter(c => c.schedule?.some(s => s.day === day));
            const active = dayClasses.length > 0;
            return (
              <div key={day} style={{ borderRadius: 14, background: 'rgba(15,23,42,0.5)', border: `1px solid ${active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'}`, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: active ? 'rgba(59,130,246,0.08)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ color: active ? '#93c5fd' : '#334155', fontWeight: 700, fontSize: 13, margin: 0 }}>{day}</p>
                  {active && <span style={{ background: 'rgba(59,130,246,0.25)', color: '#93c5fd', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>{dayClasses.length} class{dayClasses.length > 1 ? 'es' : ''}</span>}
                </div>
                {active && (
                  <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {dayClasses.map(cls => {
                      const slot = cls.schedule.find(s => s.day === day);
                      return (
                        <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 12, minWidth: 48 }}>{slot?.time || '—'}</span>
                          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{cls.name}</span>
                          <span style={{ color: '#475569', fontSize: 11 }}>{cls.duration_minutes}min</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!active && <div style={{ padding: '8px 16px 12px' }}><p style={{ color: '#1e293b', fontSize: 12, margin: 0 }}>No classes</p></div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderClients = () => (
    <div style={{ padding: '24px 20px', maxWidth: 680 }}>
      <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 20, margin: '0 0 6px' }}>Clients</h2>
      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>
        {isConnected ? `Members at ${gym?.name || 'your gym'}` : 'Connect to a gym to manage clients'}
      </p>
      {!isConnected ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
          <Users size={32} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ color: '#334155', fontSize: 14, margin: '0 0 16px' }}>Join a gym to manage clients</p>
          <button onClick={() => setShowJoinModal(true)} style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Join a Gym</button>
        </div>
      ) : gymMembers.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#334155', fontSize: 14, margin: 0 }}>No gym members yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gymMembers.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{(m.user_name || 'U')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{m.user_name || 'Member'}</p>
                <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>Joined {m.join_date ? new Date(m.join_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 99, background: m.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)', color: m.status === 'active' ? '#4ade80' : '#64748b', fontSize: 10, fontWeight: 700 }}>{m.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCommunity = () => (
    <div style={{ padding: '24px 20px', maxWidth: 680 }}>
      <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 20, margin: '0 0 6px' }}>Community Feed</h2>
      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>{gym?.name || 'Gym community'}</p>
      {!isConnected ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
          <MessageSquare size={32} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ color: '#334155', fontSize: 14, margin: 0 }}>Join a gym to see its community feed</p>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#334155', fontSize: 14, margin: 0 }}>No posts yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map(post => (
            <div key={post.id} style={{ padding: '16px', borderRadius: 16, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {post.member_avatar ? <img src={post.member_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{(post.member_name || 'U')[0]}</span>}
                </div>
                <div>
                  <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, margin: 0 }}>{post.member_name || 'Anonymous'}</p>
                  <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>{post.created_date ? new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</p>
                </div>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 10, marginTop: 10, objectFit: 'cover', maxHeight: 220 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    const d = editingProfile ? profileDraft : coachRecord;
    return (
      <div style={{ padding: '24px 20px', maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 20, margin: 0 }}>Coach Profile</h2>
          {!editingProfile ? (
            <button onClick={() => { setProfileDraft({ bio: coachRecord?.bio || '', experience_years: coachRecord?.experience_years || '', specialties: coachRecord?.specialties || [] }); setEditingProfile(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              <Edit2 size={12} /> Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingProfile(false)} style={{ padding: '8px 14px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => updateCoachMutation.mutate(profileDraft)} style={{ padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Save</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '20px', borderRadius: 18, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 26, fontWeight: 900, color: '#fff' }}>
            {(currentUser?.full_name || 'C')[0]}
          </div>
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 18, margin: '0 0 2px' }}>{currentUser?.full_name}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 4px' }}>{currentUser?.email}</p>
            {gym && <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600, margin: 0 }}>@ {gym.name}</p>}
            {!isConnected && <p style={{ color: '#a855f7', fontSize: 12, fontWeight: 600, margin: 0 }}>Independent Coach</p>}
          </div>
        </div>

        {[
          { key: 'bio', label: 'Bio', placeholder: 'Tell clients about yourself...', multi: true },
          { key: 'experience_years', label: 'Years of Experience', placeholder: 'e.g. 5', type: 'number' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{f.label}</p>
            {editingProfile ? (
              f.multi ? (
                <textarea value={profileDraft[f.key] || ''} onChange={e => setProfileDraft(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              ) : (
                <input type={f.type || 'text'} value={profileDraft[f.key] || ''} onChange={e => setProfileDraft(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              )
            ) : (
              <p style={{ color: d?.[f.key] ? '#cbd5e1' : '#1e293b', fontSize: 13, lineHeight: 1.6, margin: 0, padding: '12px', borderRadius: 12, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {d?.[f.key] ? (f.key === 'experience_years' ? `${d[f.key]} years` : d[f.key]) : `No ${f.label.toLowerCase()} added yet`}
              </p>
            )}
          </div>
        ))}

        <div style={{ marginTop: 24, padding: '16px', borderRadius: 14, background: isConnected ? 'rgba(34,197,94,0.07)' : 'rgba(59,130,246,0.07)', border: `1px solid ${isConnected ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Gym Connection</p>
          {isConnected ? (
            <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 14, margin: 0 }}>Connected to {gym?.name || 'gym'}</p>
          ) : (
            <div>
              <p style={{ color: '#93c5fd', fontWeight: 600, fontSize: 13, margin: '0 0 10px' }}>Operating independently</p>
              <button onClick={() => setShowJoinModal(true)} style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Request to Join a Gym
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const tabContent = {
    overview: renderOverview,
    classes: renderClasses,
    schedule: renderSchedule,
    clients: renderClients,
    community: renderCommunity,
    profile: renderProfile,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020817', display: 'flex', overflow: 'hidden' }}>

      {/* ── Sidebar desktop ── */}
      <aside style={{ width: 220, flexShrink: 0, background: 'rgba(10,18,38,0.97)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '24px 0 16px' }} className="hidden md:flex">
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg" alt="CoStride" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover' }} />
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: 900, fontSize: 14, margin: 0 }}>CoStride</p>
            <p style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, margin: 0 }}>Coach Portal</p>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: active ? 'rgba(34,197,94,0.12)' : 'transparent', border: active ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent', color: active ? '#4ade80' : '#475569', fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s ease' }}>
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '0 12px' }}>
          <button onClick={() => navigate(createPageUrl('Home'))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'transparent', border: '1px solid transparent', color: '#1e293b', fontWeight: 500, fontSize: 12, cursor: 'pointer', width: '100%' }}>
            <LogOut size={14} /> Back to App
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Mobile header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,18,38,0.95)', backdropFilter: 'blur(8px)', flexShrink: 0 }} className="md:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg" alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
            <div>
              <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, margin: 0 }}>Coach Portal</p>
              {gym && <p style={{ color: '#22c55e', fontSize: 10, fontWeight: 600, margin: 0 }}>{gym.name}</p>}
            </div>
          </div>
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div style={{ position: 'absolute', top: 57, left: 0, right: 0, background: 'rgba(8,14,28,0.99)', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 100, padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: active ? 'rgba(34,197,94,0.12)' : 'transparent', border: 'none', color: active ? '#4ade80' : '#64748b', fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer', width: '100%' }}>
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
            <button onClick={() => navigate(createPageUrl('Home'))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: 'transparent', border: 'none', color: '#1e293b', fontWeight: 500, fontSize: 14, cursor: 'pointer', width: '100%', marginTop: 4 }}>
              <LogOut size={16} /> Back to App
            </button>
          </div>
        )}

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {tabContent[activeTab]?.()}
        </main>

        {/* Mobile bottom nav */}
        <nav style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,18,38,0.97)', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }} className="md:hidden">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', background: 'none', border: 'none', color: active ? '#22c55e' : '#334155', cursor: 'pointer' }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modals */}
      {showJoinModal && <JoinGymModal currentUser={currentUser} onClose={() => setShowJoinModal(false)} onRequest={(g) => requestJoinMutation.mutate(g)} />}
      {classModal && (
        <ClassModal
          cls={classModal === 'new' ? null : classModal}
          onClose={() => setClassModal(null)}
          onSave={(form) => saveClassMutation.mutate(form)}
          isSaving={saveClassMutation.isPending}
        />
      )}
    </div>
  );
}