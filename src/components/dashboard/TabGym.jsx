import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Dumbbell, Calendar, Users, Star, Trash2, Image as ImageIcon } from 'lucide-react';
import { Card, SectionTitle } from './DashboardPrimitives';

export default function TabGym({ selectedGym, classes, coaches, openModal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(14,165,233,0.3)' }}>
              <Dumbbell style={{ width: 24, height: 24, color: '#fff' }}/>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.03em' }}>{selectedGym?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{selectedGym?.type} · {selectedGym?.city}</div>
            </div>
          </div>
          <button onClick={() => openModal('editInfo')} style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(14,165,233,0.12)', color: 'var(--cyan)', border: '1px solid rgba(14,165,233,0.25)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit Info</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { l: 'Price',    v: selectedGym?.price ? `£${selectedGym.price}/mo` : 'Not set', c: '#f59e0b' },
            { l: 'Address',  v: selectedGym?.address, c: 'var(--text1)' },
            { l: 'Postcode', v: selectedGym?.postcode, c: 'var(--text1)' },
            { l: 'Status',   v: selectedGym?.verified ? '✓ Verified' : 'Pending', c: selectedGym?.verified ? '#10b981' : '#f59e0b' },
          ].map((f, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 4 }}>{f.l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: f.c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.v || '—'}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { icon: Calendar, label: 'Classes',   sub: `${classes.length} total`,                    color: '#10b981', fn: () => openModal('classes') },
          { icon: Users,    label: 'Coaches',   sub: `${coaches.length} total`,                    color: '#0ea5e9', fn: () => openModal('coaches') },
          { icon: Dumbbell, label: 'Equipment', sub: `${selectedGym?.equipment?.length||0} items`,  color: '#a78bfa', fn: () => openModal('equipment') },
          { icon: Star,     label: 'Amenities', sub: `${selectedGym?.amenities?.length||0} listed`, color: '#f59e0b', fn: () => openModal('amenities') },
        ].map(({ icon: Icon, label, sub, color, fn }, i) => (
          <Card key={i} style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={fn}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon style={{ width: 17, height: 17, color }}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('heroPhoto')} actionLabel="Edit">Hero Photo</SectionTitle>
          {selectedGym?.image_url ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 160 }}>
              <img src={selectedGym.image_url} alt="Gym" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => openModal('heroPhoto')} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'} />
            </div>
          ) : (
            <div onClick={() => openModal('heroPhoto')} style={{ padding: '24px', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
              <ImageIcon style={{ width: 16, height: 16 }}/> Add Hero Photo
            </div>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle action={() => openModal('photos')} actionLabel="Manage">Photo Gallery</SectionTitle>
          {selectedGym?.gallery?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
              {selectedGym.gallery.map((url, i) => <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}/>)}
            </div>
          ) : (
            <div onClick={() => openModal('photos')} style={{ padding: '24px', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
              <ImageIcon style={{ width: 16, height: 16 }}/> Add Photos
            </div>
          )}
        </Card>
        <Card style={{ padding: 20 }}>
          <SectionTitle>Admin</SectionTitle>
          {[{l:'Owner Email',v:selectedGym?.owner_email},{l:'Gym ID',v:selectedGym?.id,mono:true},{l:'Status',v:selectedGym?.verified?'✓ Verified':'Not Verified',c:selectedGym?.verified?'#10b981':'#f87171'}].map((f,i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.l}</div>
              <div style={{ fontSize: f.mono ? 11 : 13, fontWeight: 600, color: f.c || 'var(--text1)', fontFamily: f.mono ? 'monospace' : 'Outfit', wordBreak: 'break-all' }}>{f.v || '—'}</div>
            </div>
          ))}
          <Link to={createPageUrl('GymCommunity')+'?id='+selectedGym?.id}>
            <button style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text1)', border: '1px solid rgba(255,255,255,0.09)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>View Public Gym Page →</button>
          </Link>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { title: 'Delete Gym',     desc: 'Permanently delete this gym and all its data.',  fn: () => openModal('deleteGym') },
          { title: 'Delete Account', desc: 'Permanently delete your account and all gyms.',   fn: () => openModal('deleteAccount') },
        ].map((d,i) => (
          <Card key={i} style={{ padding: 18, border: '1px solid rgba(239,68,68,0.16)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><Trash2 style={{ width: 14, height: 14, color: '#f87171' }}/><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{d.title}</span></div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.4 }}>{d.desc}</p>
            <button onClick={d.fn} style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          </Card>
        ))}
      </div>
    </div>
  );
}