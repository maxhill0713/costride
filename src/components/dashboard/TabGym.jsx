import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Dumbbell, Calendar, Users, Star, Trash2, Image as ImageIcon,
  MapPin, Tag, ShieldCheck, Clock, ChevronRight, ExternalLink,
  Settings, Camera, AlertTriangle, Copy, Check
} from 'lucide-react';
import { Card, SectionTitle } from './DashboardPrimitives';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`, color: copied ? '#34d399' : 'var(--text3)', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', marginLeft: 6 }}>
      {copied ? <Check style={{ width: 9, height: 9 }}/> : <Copy style={{ width: 9, height: 9 }}/>}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function TabGym({ selectedGym, classes, coaches, openModal }) {
  const statusVerified = selectedGym?.verified;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero banner ────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        position: 'relative',
      }}>
        {/* Background image strip */}
        <div style={{ height: 100, position: 'relative', background: 'linear-gradient(135deg, #0a1628 0%, #0d2248 50%, #0a1628 100%)', overflow: 'hidden' }}>
          {selectedGym?.image_url && (
            <img src={selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}/>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(17,24,39,0.85) 100%)' }}/>
          {/* Edit hero button */}
          <button onClick={() => openModal('heroPhoto')} style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            <Camera style={{ width: 12, height: 12 }}/> Edit Hero
          </button>
        </div>

        {/* Gym info row */}
        <div style={{ padding: '0 24px 24px', marginTop: -24, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Logo */}
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(14,165,233,0.35)', border: '3px solid var(--card)', flexShrink: 0, cursor: 'pointer' }} onClick={() => openModal('logo')}>
                {selectedGym?.logo_url
                  ? <img src={selectedGym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 15 }}/>
                  : <Dumbbell style={{ width: 26, height: 26, color: '#fff' }}/>
                }
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.035em', lineHeight: 1 }}>{selectedGym?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{selectedGym?.type}</span>
                  {selectedGym?.city && <>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text3)' }}/>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin style={{ width: 11, height: 11, color: 'var(--text3)' }}/>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{selectedGym?.city}</span>
                    </div>
                  </>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: statusVerified ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${statusVerified ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                    <ShieldCheck style={{ width: 10, height: 10, color: statusVerified ? '#34d399' : '#fbbf24' }}/>
                    <span style={{ fontSize: 10, fontWeight: 800, color: statusVerified ? '#34d399' : '#fbbf24', letterSpacing: '0.04em' }}>{statusVerified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => openModal('editInfo')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'rgba(14,165,233,0.12)', color: 'var(--cyan)', border: '1px solid rgba(14,165,233,0.25)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,0.12)'}>
              <Settings style={{ width: 13, height: 13 }}/> Edit Info
            </button>
          </div>

          {/* Info fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 20 }}>
            {[
              { label: 'Monthly Price', value: selectedGym?.price ? `£${selectedGym.price}/mo` : 'Not set',     icon: Tag,       color: selectedGym?.price ? 'var(--text1)' : '#f59e0b' },
              { label: 'Address',       value: selectedGym?.address,                                             icon: MapPin,    color: 'var(--text1)' },
              { label: 'Postcode',      value: selectedGym?.postcode,                                            icon: MapPin,    color: 'var(--text1)' },
              { label: 'Status',        value: statusVerified ? 'Verified' : 'Pending Approval',                icon: ShieldCheck, color: statusVerified ? '#10b981' : '#f59e0b' },
            ].map((f, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <f.icon style={{ width: 10, height: 10, color: 'var(--text3)' }}/>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)' }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: f.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Manage sections ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { icon: Calendar, label: 'Classes',   count: classes.length,                         unit: 'total',  color: '#10b981', fn: () => openModal('classes') },
          { icon: Users,    label: 'Coaches',   count: coaches.length,                          unit: 'total',  color: '#0ea5e9', fn: () => openModal('coaches') },
          { icon: Dumbbell, label: 'Equipment', count: selectedGym?.equipment?.length || 0,     unit: 'items',  color: '#a78bfa', fn: () => openModal('equipment') },
          { icon: Star,     label: 'Amenities', count: selectedGym?.amenities?.length || 0,     unit: 'listed', color: '#f59e0b', fn: () => openModal('amenities') },
        ].map(({ icon: Icon, label, count, unit, color, fn }, i) => (
          <button key={i} onClick={fn} style={{
            padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
            background: 'var(--card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.transform = ''; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 18, height: 18, color }}/>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                  <span style={{ fontWeight: 800, color }}>{count}</span> {unit}
                </div>
              </div>
            </div>
            <ChevronRight style={{ width: 14, height: 14, color: 'var(--text3)' }}/>
          </button>
        ))}
      </div>

      {/* ── Photos + Admin ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* Hero Photo */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Hero Photo</div>
            <button onClick={() => openModal('heroPhoto')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
              Edit
            </button>
          </div>
          {selectedGym?.image_url ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 140, cursor: 'pointer' }} onClick={() => openModal('heroPhoto')}>
              <img src={selectedGym.image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
                <Camera style={{ width: 22, height: 22, color: '#fff', opacity: 0 }} />
              </div>
            </div>
          ) : (
            <div onClick={() => openModal('heroPhoto')} style={{ height: 140, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.09)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon style={{ width: 16, height: 16, color: 'rgba(14,165,233,0.5)' }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Add Hero Photo</span>
            </div>
          )}
        </Card>

        {/* Photo Gallery */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Photo Gallery</div>
            <button onClick={() => openModal('photos')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
              Manage
            </button>
          </div>
          {selectedGym?.gallery?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {selectedGym.gallery.slice(0, 6).map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
              ))}
            </div>
          ) : (
            <div onClick={() => openModal('photos')} style={{ height: 140, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.09)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon style={{ width: 16, height: 16, color: 'rgba(14,165,233,0.5)' }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Add Photos</span>
            </div>
          )}
        </Card>

        {/* Admin */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 16 }}>Admin</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 4 }}>Owner Email</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', wordBreak: 'break-all' }}>{selectedGym?.owner_email || '—'}</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)' }}>Gym ID</div>
                <CopyButton value={selectedGym?.id}/>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedGym?.id || '—'}</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: statusVerified ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${statusVerified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: statusVerified ? '#34d399' : '#fbbf24' }}>{statusVerified ? '✓ Verified' : 'Pending Approval'}</div>
            </div>
          </div>
          <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
            <button style={{ width: '100%', marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: 'var(--text2)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text2)'; }}>
              <ExternalLink style={{ width: 13, height: 13 }}/> View Public Gym Page
            </button>
          </Link>
        </Card>
      </div>

      {/* ── Danger zone ─────────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 16, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.03)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle style={{ width: 13, height: 13, color: '#f87171' }}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>Danger Zone</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>These actions are permanent and cannot be undone.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Delete Gym',     desc: 'Permanently delete this gym and all its data, including members, check-ins, and content.', fn: () => openModal('deleteGym') },
            { title: 'Delete Account', desc: 'Permanently delete your owner account and all associated gyms. This cannot be reversed.',    fn: () => openModal('deleteAccount') },
          ].map((d, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{d.desc}</div>
              </div>
              <button onClick={d.fn} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.22)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5'; }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
