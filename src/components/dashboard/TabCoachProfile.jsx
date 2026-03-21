import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Star, Upload, Plus, X, GraduationCap, Briefcase,
  Award, Users, Edit2, Check, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const SPECIALTIES_OPTIONS = [
  'Strength Training', 'Weight Loss', 'Muscle Gain', 'Cardio',
  'HIIT', 'Yoga', 'Boxing', 'Rehabilitation', 'Nutrition',
  'Powerlifting', 'CrossFit', 'Flexibility', 'Sports Performance',
  'Senior Fitness', 'Pre/Post Natal',
];

const CERT_SUGGESTIONS = [
  'NASM CPT', 'ACE CPT', 'ISSA CPT', 'REPS Level 3',
  'CrossFit L1', 'Precision Nutrition', 'First Aid / CPR',
  'Sports Massage', 'Kettlebell Specialist',
];

function EditableField({ label, value, onSave, multiline = false, type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  useEffect(() => { setDraft(value || ''); }, [value]);

  const commit = () => { onSave(draft); setEditing(false); };

  if (!editing) return (
    <div
      onClick={() => setEditing(true)}
      style={{
        cursor: 'pointer', padding: '10px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: value ? '#c2d4e8' : '#3a5070', fontStyle: value ? 'normal' : 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
        {value || `Add ${label.toLowerCase()}…`}
        <Edit2 style={{ width: 10, height: 10, color: '#3a5070', flexShrink: 0 }} />
      </div>
    </div>
  );

  return (
    <div style={{ borderRadius: 10, border: '1px solid rgba(167,139,250,0.5)', overflow: 'hidden', background: 'rgba(167,139,250,0.05)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 4px' }}>{label}</div>
      {multiline
        ? <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            autoFocus
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '4px 12px 8px', fontSize: 13, color: '#f0f4f8', resize: 'none', fontFamily: 'inherit' }}
          />
        : <input
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); } }}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '4px 12px 10px', fontSize: 13, color: '#f0f4f8', fontFamily: 'inherit' }}
          />
      }
      <div style={{ display: 'flex', gap: 6, padding: '0 10px 8px', justifyContent: 'flex-end' }}>
        <button onClick={() => { setDraft(value || ''); setEditing(false); }} style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
        <button onClick={commit} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
}

function TagList({ label, items = [], suggestions = [], onAdd, onRemove, color = '#a78bfa' }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const add = (val) => {
    const v = val.trim();
    if (v && !items.includes(v)) onAdd(v);
    setDraft('');
    setAdding(false);
  };

  const remaining = suggestions.filter(s => !items.includes(s));

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(item => (
          <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${color}14`, border: `1px solid ${color}28`, color }}>
            {item}
            <button onClick={() => onRemove(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color, opacity: 0.6, lineHeight: 1 }}><X style={{ width: 10, height: 10 }} /></button>
          </span>
        ))}
        {adding ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add(draft); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
              autoFocus
              placeholder="Type & press Enter"
              style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}40`, borderRadius: 99, padding: '4px 10px', color: '#f0f4f8', outline: 'none', width: 140, fontFamily: 'inherit' }}
            />
            <button onClick={() => add(draft)} style={{ fontSize: 11, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 99, padding: '4px 10px', cursor: 'pointer' }}>Add</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', color: '#3a5070', cursor: 'pointer' }}>
            <Plus style={{ width: 10, height: 10 }} /> Add
          </button>
        )}
      </div>
      {adding && remaining.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {remaining.slice(0, 8).map(s => (
            <button key={s} onClick={() => add(s)} style={{ fontSize: 10, fontWeight: 600, color: '#64748b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 99, padding: '3px 8px', cursor: 'pointer' }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TabCoachProfile({ selectedGym, currentUser }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: coachRecords = [], isLoading } = useQuery({
    queryKey: ['myCoachProfile', currentUser?.email, selectedGym?.id],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email, gym_id: selectedGym.id }),
    enabled: !!currentUser?.email && !!selectedGym?.id,
    staleTime: 2 * 60 * 1000,
  });

  const coach = coachRecords[0] || null;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Coach.update(coach.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCoachProfile', currentUser?.email, selectedGym?.id] });
      queryClient.invalidateQueries({ queryKey: ['coaches', selectedGym?.id] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const save = (field, value) => updateMutation.mutate({ [field]: value });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    save('avatar_url', file_url);
    setUploading(false);
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <Loader2 style={{ width: 24, height: 24, color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!coach) return (
    <div style={{ borderRadius: 16, padding: 32, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
      <GraduationCap style={{ width: 32, height: 32, color: '#3a5070', margin: '0 auto 12px' }} />
      <p style={{ color: '#5a7a96', fontSize: 14, fontWeight: 600 }}>No coach profile found for this gym.</p>
      <p style={{ color: '#3a5070', fontSize: 12, marginTop: 4 }}>Ask the gym owner to add you as a coach first.</p>
    </div>
  );

  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT: editable profile ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header card */}
        <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: 80, background: 'linear-gradient(135deg,rgba(167,139,250,0.25),rgba(59,130,246,0.15))', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.08),transparent)' }} />
          </div>
          <div style={{ padding: '0 20px 20px', marginTop: -40 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 14 }}>
              {/* Avatar */}
              <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                  background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
                  border: '3px solid #060c18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 900, color: '#fff', boxShadow: '0 0 20px rgba(167,139,250,0.3)',
                }}>
                  {coach.avatar_url
                    ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : ini(coach.name)
                  }
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', opacity: uploading ? 1 : 0, transition: 'opacity 0.15s' }}
                    className="avatar-overlay">
                    {uploading ? <Loader2 style={{ width: 18, height: 18, color: '#fff', animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 16, height: 16, color: '#fff' }} />}
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                <style>{`.avatar-overlay { opacity: 0 !important; } label:hover .avatar-overlay { opacity: 1 !important; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </label>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.02em' }}>{coach.name}</div>
                <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, marginTop: 2 }}>{selectedGym?.name}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
                {[
                  { icon: Star, label: 'Rating', value: coach.rating ? `${coach.rating}/5` : '—', color: '#fbbf24' },
                  { icon: Users, label: 'Clients', value: coach.total_clients || 0, color: '#38bdf8' },
                  { icon: Briefcase, label: 'Years Exp.', value: coach.experience_years ? `${coach.experience_years}y` : '—', color: '#34d399' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}</div>
                    <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <EditableField label="Bio" value={coach.bio} onSave={v => save('bio', v)} multiline />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EditableField label="Years of Experience" value={coach.experience_years?.toString()} onSave={v => save('experience_years', parseInt(v) || 0)} type="number" />
                <EditableField label="Rating (out of 5)" value={coach.rating?.toString()} onSave={v => save('rating', parseFloat(v) || null)} type="number" />
              </div>
              <EditableField label="Total Clients Coached" value={coach.total_clients?.toString()} onSave={v => save('total_clients', parseInt(v) || 0)} type="number" />
            </div>
          </div>
        </div>

        {/* Specialties & Certifications */}
        <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <TagList
            label="Specialties"
            items={coach.specialties || []}
            suggestions={SPECIALTIES_OPTIONS}
            color="#a78bfa"
            onAdd={v => save('specialties', [...(coach.specialties || []), v])}
            onRemove={v => save('specialties', (coach.specialties || []).filter(s => s !== v))}
          />
          <TagList
            label="Certifications"
            items={coach.certifications || []}
            suggestions={CERT_SUGGESTIONS}
            color="#38bdf8"
            onAdd={v => save('certifications', [...(coach.certifications || []), v])}
            onRemove={v => save('certifications', (coach.certifications || []).filter(s => s !== v))}
          />
        </div>
      </div>

      {/* ── RIGHT: preview card (as members see it) ── */}
      <div style={{ position: 'sticky', top: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Public Preview</div>
        <div style={{
          borderRadius: 18, background: 'linear-gradient(135deg,rgba(30,35,60,0.82) 0%,rgba(8,10,20,0.96) 100%)',
          border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
          overflow: 'hidden', padding: '18px 14px 18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.09) 50%,transparent 90%)' }} />
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', border: '3px solid #fbbf24', boxShadow: '0 0 12px rgba(167,139,250,0.3), 0 0 0 2px rgba(251,191,36,0.6)', flexShrink: 0 }}>
            {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(coach.name)}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{coach.name}</div>
          {coach.specialties?.length > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)', textAlign: 'center' }}>{coach.specialties.slice(0, 2).join(' · ')}</div>
          )}
          {coach.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star style={{ width: 12, height: 12, fill: '#fbbf24', color: '#fbbf24' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{coach.rating}</span>
            </div>
          )}
          {coach.bio && (
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>{coach.bio}</p>
          )}
          {coach.certifications?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {coach.certifications.map(c => (
                <span key={c} style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 99, padding: '2px 8px' }}>{c}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
            {coach.experience_years && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: '#34d399' }}>{coach.experience_years}y</div><div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase' }}>Experience</div></div>}
            {coach.total_clients > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8' }}>{coach.total_clients}</div><div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase' }}>Clients</div></div>}
          </div>
        </div>

        {/* Permissions summary */}
        <div style={{ marginTop: 12, borderRadius: 12, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Permissions</div>
          {[
            { label: 'Post on gym feed', enabled: coach.can_post },
            { label: 'Manage events', enabled: coach.can_manage_events },
            { label: 'Manage classes', enabled: coach.can_manage_classes },
          ].map(({ label, enabled }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 12, color: '#5a7a96' }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: enabled ? '#34d399' : '#f87171' }}>{enabled ? '✓ Yes' : '✗ No'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}