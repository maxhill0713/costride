/**
 * TabGymProfile — Gym Owner Dashboard
 * Surfaces all gym profile editing actions that feed into the member-facing app.
 */
import React from 'react';
import {
  Image, Camera, Dumbbell, Sparkles, DollarSign, Info,
  ChevronRight, BadgeCheck, MapPin, Star, Users, Tag,
  QrCode, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const T = {
  bg:      '#000000',
  card:    '#141416',
  card2:   '#1a1a1f',
  brd:     '#222226',
  brd2:    '#2a2a30',
  t1:      '#ffffff',
  t2:      '#8a8a94',
  t3:      '#444450',
  cyan:    '#4d7fff',
  cyanDim: 'rgba(77,127,255,0.12)',
  cyanBrd: 'rgba(77,127,255,0.28)',
  green:   '#22c55e',
  greenDim:'rgba(34,197,94,0.12)',
  amber:   '#f59e0b',
  amberDim:'rgba(245,158,11,0.12)',
};

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
      {(title || subtitle) && (
        <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${T.brd}` }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, letterSpacing: '-0.01em' }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 11, color: T.t3, marginTop: 3 }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function EditRow({ icon: Icon, label, sub, status, onClick, statusColor }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.brd}`, cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: T.card2, border: `1px solid ${T.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 14, height: 14, color: T.t2 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {status && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: statusColor === 'green' ? T.greenDim : statusColor === 'amber' ? T.amberDim : T.cyanDim, color: statusColor === 'green' ? T.green : statusColor === 'amber' ? T.amber : T.cyan, border: `1px solid ${statusColor === 'green' ? 'rgba(34,197,94,0.25)' : statusColor === 'amber' ? 'rgba(245,158,11,0.25)' : T.cyanBrd}`, flexShrink: 0 }}>
          {status}
        </span>
      )}
      <ChevronRight style={{ width: 13, height: 13, color: T.t3, flexShrink: 0 }} />
    </button>
  );
}

export default function TabGymProfile({ gym, openModal, setShowPoster }) {
  if (!gym) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: T.t3, fontSize: 13 }}>
      No gym selected
    </div>
  );

  const amenitiesCount = gym.amenities?.length || 0;
  const equipmentCount = gym.equipment?.length || 0;
  const galleryCount   = gym.gallery?.length || 0;

  // Member-app preview URL
  const previewUrl = createPageUrl('GymCommunity') + '?id=' + gym.id;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Live preview banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #050c1a 0%, #071225 100%)', border: '1px solid rgba(77,127,255,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.cyanDim, border: `1px solid ${T.cyanBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ExternalLink style={{ width: 16, height: 16, color: T.cyan }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Member-Facing Profile</div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Everything on this page is visible to members in the CoStride app</div>
        </div>
        <Link to={previewUrl} target="_blank">
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: T.cyanDim, border: `1px solid ${T.cyanBrd}`, color: T.cyan, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <ExternalLink style={{ width: 11, height: 11 }} /> Preview
          </button>
        </Link>
      </div>

      {/* ── Gym identity snapshot ── */}
      <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
        {/* Hero image preview */}
        <div style={{ position: 'relative', height: 130, background: T.card2, overflow: 'hidden' }}>
          {gym.image_url
            ? <img src={gym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.t3, fontSize: 12 }}>No hero image set</div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
          <button onClick={() => openModal('heroPhoto')} style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <Camera style={{ width: 11, height: 11 }} /> Edit Cover
          </button>
          {/* Logo overlay */}
          <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={() => openModal('logo')} style={{ width: 48, height: 48, borderRadius: '50%', background: T.card, border: `2px solid ${T.cyan}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
              {gym.logo_url
                ? <img src={gym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Dumbbell style={{ width: 18, height: 18, color: T.cyan }} />
              }
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{gym.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin style={{ width: 10, height: 10 }} />{gym.city}
                {gym.type && <span style={{ marginLeft: 6, textTransform: 'capitalize' }}>· {gym.type}</span>}
              </div>
            </div>
          </div>
        </div>
        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.brd}` }}>
          {[
            { label: 'Rating',   value: gym.rating ? `${gym.rating}/5` : '—',   icon: Star },
            { label: 'Members',  value: gym.members_count || 0,                  icon: Users },
            { label: 'Status',   value: gym.claim_status === 'claimed' ? 'Official' : 'Unclaimed', icon: BadgeCheck, color: gym.claim_status === 'claimed' ? T.green : T.amber },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRight: i < 2 ? `1px solid ${T.brd}` : 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.10em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <s.icon style={{ width: 10, height: 10 }} />{s.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color || T.t1, letterSpacing: '-0.03em' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Basic info ── */}
      <SectionCard title="Basic Information" subtitle="Name, type, location, price & specializations">
        <EditRow icon={Info}       label="Gym Info"   sub="Name, city, type, address"       onClick={() => openModal('editInfo')} status={gym.name ? 'Set' : 'Missing'} statusColor={gym.name ? 'green' : 'amber'} />
        <EditRow icon={DollarSign} label="Pricing"    sub="Monthly membership price"         onClick={() => openModal('pricing')}  status={gym.price ? gym.price : 'Not set'} statusColor={gym.price ? 'green' : 'amber'} />
        <div style={{ borderBottom: 'none' }}>
          <EditRow icon={Tag} label="Join Code & QR"  sub={gym.join_code ? `Code: ${gym.join_code}` : 'Generate a code for members to join'} onClick={() => setShowPoster(true)} status={gym.join_code ? gym.join_code : 'No code'} statusColor={gym.join_code ? 'green' : 'amber'} />
        </div>
      </SectionCard>

      {/* ── Visuals ── */}
      <SectionCard title="Photos & Visuals" subtitle="Hero image, logo, and gallery shown in the member app">
        <EditRow icon={Camera} label="Logo / Profile Photo" sub="Shown on the gym card and community page" onClick={() => openModal('logo')}      status={gym.logo_url ? 'Set' : 'Missing'} statusColor={gym.logo_url ? 'green' : 'amber'} />
        <EditRow icon={Image}  label="Hero / Cover Image"   sub="Large background image on the gym profile" onClick={() => openModal('heroPhoto')} status={gym.image_url ? 'Set' : 'Missing'} statusColor={gym.image_url ? 'green' : 'amber'} />
        <div style={{ borderBottom: 'none' }}>
          <EditRow icon={Image} label="Photo Gallery"        sub={`${galleryCount} photo${galleryCount !== 1 ? 's' : ''} · shown in the gallery tab`} onClick={() => openModal('photos')} status={galleryCount > 0 ? `${galleryCount} photos` : 'Empty'} statusColor={galleryCount > 0 ? 'green' : 'amber'} />
        </div>
      </SectionCard>

      {/* ── Member-app discoverability ── */}
      <SectionCard title="Member App Discoverability" subtitle="What members see when browsing or checking out your gym">
        <EditRow icon={Sparkles} label="Amenities"  sub={amenitiesCount > 0 ? amenitiesCount + ' listed (e.g. Changing Rooms, Sauna)' : 'Not set — members look for these'} onClick={() => openModal('amenities')} status={amenitiesCount > 0 ? `${amenitiesCount} items` : 'Empty'} statusColor={amenitiesCount > 0 ? 'green' : 'amber'} />
        <div style={{ borderBottom: 'none' }}>
          <EditRow icon={Dumbbell} label="Equipment" sub={equipmentCount > 0 ? equipmentCount + ' listed (e.g. Barbells, Cable Machines)' : 'Not set — members filter by equipment'} onClick={() => openModal('equipment')} status={equipmentCount > 0 ? `${equipmentCount} items` : 'Empty'} statusColor={equipmentCount > 0 ? 'green' : 'amber'} />
        </div>
      </SectionCard>

      {/* ── Completeness score ── */}
      {(() => {
        const checks = [
          gym.name, gym.image_url, gym.logo_url,
          (gym.gallery?.length || 0) > 0,
          (gym.amenities?.length || 0) > 0,
          (gym.equipment?.length || 0) > 0,
          gym.price, gym.join_code,
        ];
        const done = checks.filter(Boolean).length;
        const total = checks.length;
        const pct = Math.round((done / total) * 100);
        const color = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.cyan;
        return (
          <div style={{ background: T.card, border: `1px solid ${T.brd}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Profile Completeness</div>
                <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Complete profiles get more member joins</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.04em' }}>{pct}%</div>
            </div>
            <div style={{ height: 5, borderRadius: 9, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 9, background: color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 8 }}>{done} of {total} sections complete</div>
          </div>
        );
      })()}
    </div>
  );
}