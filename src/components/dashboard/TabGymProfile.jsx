/**
 * TabGymProfile — Forge Fitness Dashboard
 * Redesigned with dashboard card layout (Foundry-style).
 * Color tokens unified with ContentPage (#4d7fff blue system).
 */
import React, { useState } from 'react';
import {
  Image, ExternalLink, Zap, TrendingUp, BadgeCheck,
  ArrowUpRight, ArrowDownRight, Instagram, Facebook,
  Twitter, Globe, MapPin, Tag, Users, Dumbbell, Star,
  GraduationCap, UserPlus, Plus, Upload, Settings,
  Camera, Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

/* ─── TOKENS — exact ContentPage palette ────────────────────── */
const C = {
  bg:       '#000000',
  card:     '#141416',
  card2:    '#1a1a1f',
  brd:      '#222226',
  brd2:     '#2a2a30',
  t1:       '#ffffff',
  t2:       '#8a8a94',
  t3:       '#444450',
  cyan:     '#4d7fff',
  cyanDim:  'rgba(77,127,255,0.12)',
  cyanBrd:  'rgba(77,127,255,0.28)',
  red:      '#ff4d6d',
  redDim:   'rgba(255,77,109,0.15)',
  redBrd:   'rgba(255,77,109,0.28)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  amberBrd: 'rgba(245,158,11,0.28)',
  green:    '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
  greenBrd: 'rgba(34,197,94,0.28)',
};
const FONT   = "'DM Sans','Segoe UI',system-ui,sans-serif";
const SHADOW = '0 0 10px rgba(77,127,255,0.22), 0 2px 6px rgba(77,127,255,0.12)';

/* ─── HELPERS ───────────────────────────────────────────────── */
function qualityState(score) {
  if (score >= 75) return { label: 'Strong',          color: C.green, dim: C.greenDim, brd: C.greenBrd };
  if (score >= 40) return { label: 'Needs attention', color: C.amber, dim: C.amberDim, brd: C.amberBrd };
  return           { label: 'Weak',                   color: C.red,   dim: C.redDim,   brd: C.redBrd   };
}
function engLabel(s) {
  if (s >= 75) return { label: 'High',    color: C.green };
  if (s >= 40) return { label: 'Healthy', color: C.cyan  };
  return       { label: 'Low',   color: C.red   };
}
function actLabel(n) {
  if (n >= 5)  return { label: 'Very High', color: C.green };
  if (n >= 2)  return { label: 'Moderate',  color: C.amber };
  return       { label: 'Low',              color: C.red   };
}
function buildInsight({ communityScore, engScore, postsWeek, hasLogo, hasHero, galleryCount, amenitiesCount, price }) {
  if (!hasLogo && !hasHero) return "Your gym has no photos yet — members won't be able to visualise the space before joining.";
  if (galleryCount < 3 && engScore < 40) return "Your profile is sparse and community activity is low — both reduce a member's confidence before joining.";
  if (communityScore >= 70 && postsWeek < 2) return "Your profile looks solid, but low community activity means members see a quiet gym, not a thriving one.";
  if (communityScore >= 70 && engScore >= 60) return "Your gym is in good shape — a consistent post cadence is the next step to sustaining retention.";
  if (!price && amenitiesCount === 0) return "Pricing and amenities are missing — this creates uncertainty before a member decides to join.";
  return "Your gym is making progress — a few more improvements will noticeably boost member confidence.";
}

const AMENITY_ICONS = {
  wifi: '📶', shower: '🚿', sauna: '🧖', parking: '🅿️',
  café: '☕', cafe: '☕', coffee: '☕', pool: '🏊',
  towel: '🛁', lockers: '🔒', yoga: '🧘', spa: '💆',
  childcare: '👶', juice: '🥤', bar: '🥂', gym: '🏋️',
};
function getAmenityIcon(name) {
  const key = (name || '').toLowerCase();
  for (const [k, v] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '✓';
}

/* ─── SHARED: DASH CARD WRAPPER ─────────────────────────────── */
function DashCard({ children, style }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.brd}`,
      borderRadius: 12,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── SHARED: CARD HEADER ───────────────────────────────────── */
function CardHeader({ title, action, actionLabel, actionIcon: ActionIcon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px', borderBottom: `1px solid ${C.brd}`,
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: '-0.01em' }}>{title}</div>
      {action && (
        <button
          onClick={action}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700,
            background: C.cyan, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: FONT, boxShadow: SHADOW,
          }}
        >
          {ActionIcon && <ActionIcon style={{ width: 11, height: 11 }} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ─── SHARED: STATUS BADGE ──────────────────────────────────── */
function StatusBadge({ score }) {
  const state = qualityState(score);
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, flexShrink: 0,
      color: state.color, background: state.dim, border: `1px solid ${state.brd}`, whiteSpace: 'nowrap',
    }}>
      {state.label}
    </span>
  );
}

/* ─── SHARED: ACTION BUTTON ─────────────────────────────────── */
function ActionBtn({ label, onClick, icon: Icon, primary, flex }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '7px 13px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
        fontFamily: FONT,
        border: `1px solid ${primary ? C.cyan : C.brd}`,
        background: primary ? C.cyan : C.card2,
        color: primary ? '#fff' : C.t2,
        boxShadow: primary ? SHADOW : 'none',
        flex: flex ? 1 : undefined,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {Icon && <Icon style={{ width: 11, height: 11 }} />}
      {label}
    </button>
  );
}

/* ─── SHARED: METRIC CARD ───────────────────────────────────── */
function MetricCard({ label, primary, secondary, color, trend, trendLabel }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;
  const trendColor = trend === 'up' ? C.green : C.red;
  return (
    <DashCard style={{ position: 'relative' }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: color || C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {primary}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
          {secondary && <span style={{ fontSize: 11, color: C.t2 }}>{secondary}</span>}
          {trend && TrendIcon && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10.5, fontWeight: 700, color: trendColor }}>
              <TrendIcon style={{ width: 10, height: 10 }} />{trendLabel}
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 3, background: (color || C.cyan) + '55' }} />
    </DashCard>
  );
}

/* ─── SHARED: INSIGHT BAR ───────────────────────────────────── */
function InsightBar({ text }) {
  return (
    <div style={{
      padding: '10px 15px', borderRadius: 9,
      background: C.card2, border: `1px solid ${C.brd}`, borderLeft: `2px solid ${C.cyan}`,
      display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14,
    }}>
      <Zap style={{ width: 12, height: 12, color: C.cyan, flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

/* ─── PROFILE STRENGTH BAR ──────────────────────────────────── */
function ProfileStrengthBar({ score, hint }) {
  const state = qualityState(score);
  return (
    <div style={{ padding: '11px 16px', borderTop: `1px solid ${C.brd}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.t2 }}>
          Profile Strength:{' '}
          <span style={{ color: state.color, fontWeight: 700 }}>{score}%</span>
          {hint && <span style={{ color: C.t3, fontWeight: 400 }}> ({hint})</span>}
        </span>
        <StatusBadge score={score} />
      </div>
      <div style={{ height: 5, background: C.brd, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`,
          background: state.color, borderRadius: 3, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION CARDS
══════════════════════════════════════════════════════════════ */

/* ─── 1. PROFILE PAGE & BRANDING ───────────────────────────── */
function ProfileBrandingCard({ gym, openModal, profileScore }) {
  const hasLogo = !!gym.logo_url;
  const hasHero = !!gym.image_url;

  const hint = profileScore < 50
    ? 'Add gallery photos to improve'
    : profileScore < 80
    ? 'Add pricing and social links to improve'
    : undefined;

  return (
    <DashCard>
      <CardHeader title="Profile Page & Branding" />
      <div style={{ display: 'flex', gap: 14, padding: 16 }}>
        {/* Logo circle */}
        <div style={{ flexShrink: 0, width: 140 }}>
          <div style={{
            width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.brd}`, background: C.card2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {hasLogo
              ? <img src={gym.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Dumbbell style={{ width: 32, height: 32, color: C.t3 }} />
            }
          </div>
        </div>
        {/* Cover image */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            width: '100%', height: 130, borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${C.brd}`, background: C.card2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {hasHero
              ? <img src={gym.image_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Image style={{ width: 24, height: 24, color: C.t3 }} />
                  <span style={{ fontSize: 11, color: C.t3 }}>No cover image</span>
                </div>
            }
          </div>
        </div>
      </div>
      {/* Button row */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px' }}>
        <ActionBtn label="Upgrade/Change Logo" onClick={() => openModal('logo')} icon={Upload} primary flex />
        <ActionBtn label="Replace Cover Image" onClick={() => openModal('heroPhoto')} icon={Image} flex />
      </div>
      <ProfileStrengthBar score={profileScore} hint={hint} />
    </DashCard>
  );
}

/* ─── 2. PHOTO GALLERY MANAGEMENT ──────────────────────────── */
function PhotoGalleryCard({ gym, openModal, galleryCount }) {
  const photos = (gym.gallery || []).slice(0, 5).map(g => g.url || g);
  const hintText = galleryCount === 0
    ? 'No photos yet.'
    : galleryCount < 8
      ? `Photos: ${galleryCount}. Needs ${8 - galleryCount} more for optimal impact.`
      : `${galleryCount} photos — great coverage.`;

  return (
    <DashCard>
      <CardHeader title="Photo Gallery Management" action={() => openModal('photos')} actionLabel="Edit Gallery" actionIcon={Settings} />
      {/* 2-row × 3-col grid — 5 photos + 1 upload slot */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)', gap: 2,
        height: 204, padding: '2px 2px 0',
      }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ overflow: 'hidden', background: C.card2 }}>
            {photos[i]
              ? <img src={photos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.025)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera style={{ width: 16, height: 16, color: C.t3 }} />
                </div>
            }
          </div>
        ))}
        {/* Upload slot */}
        <div
          onClick={() => openModal('photos')}
          style={{
            overflow: 'hidden', background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(77,127,255,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = C.cyanDim}
        >
          <Upload style={{ width: 18, height: 18, color: C.cyan }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.cyan, textAlign: 'center', lineHeight: 1.3 }}>
            Upload New<br />Photos
          </span>
        </div>
      </div>
      <div style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: C.t3 }}>{hintText}</span>
        {galleryCount > 0 && <StatusBadge score={galleryCount >= 5 ? 100 : galleryCount >= 3 ? 60 : 20} />}
      </div>
    </DashCard>
  );
}

/* ─── 3. TRUST & CLARITY ────────────────────────────────────── */
function TrustCard({ gym, openModal }) {
  const rows = [
    {
      label: 'Gym Name & Info',
      value: gym.name || '—',
      score: gym.name ? 100 : 0,
      action: () => openModal('editInfo'),
    },
    {
      label: 'Pricing',
      value: gym.price ? gym.price : 'Not set',
      score: gym.price ? 100 : 0,
      action: () => openModal('pricing'),
    },
    {
      label: 'Address',
      value: [gym.address, gym.city, gym.postcode].filter(Boolean).join(', ') || 'Not added',
      score: (gym.address || gym.city) ? 100 : 0,
      action: () => openModal('editInfo'),
    },
    {
      label: 'Contact Details',
      value: gym.phone || gym.email || 'Not added',
      score: (gym.phone || gym.email) ? 100 : 0,
      action: () => openModal('editInfo'),
    },
  ];

  return (
    <DashCard style={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Trust & Clarity" action={() => openModal('editInfo')} actionLabel="Edit Info" actionIcon={Settings} />
      <div style={{ flex: 1 }}>
        {rows.map((row, i) => {
          const state = qualityState(row.score);
          return (
            <div
              key={i}
              onClick={row.action}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: i < rows.length - 1 ? `1px solid ${C.brd}` : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t1 }}>{row.label}</div>
                <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                  {row.value}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: state.color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: state.color }}>{state.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
}

/* ─── 4. AMENITIES MANAGEMENT ───────────────────────────────── */
function AmenitiesCard({ gym, openModal }) {
  const items = gym.amenities || [];

  return (
    <DashCard style={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Amenities Management" action={() => openModal('amenities')} actionLabel="+ Add New" actionIcon={Plus} />
      {items.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '28px 16px' }}>
          <Tag style={{ width: 22, height: 22, color: C.t3 }} />
          <span style={{ fontSize: 11.5, color: C.t3, textAlign: 'center' }}>No amenities listed yet.</span>
          <button onClick={() => openModal('amenities')} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: C.cyan, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: FONT, boxShadow: SHADOW,
          }}>
            + Add New Amenity
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', flex: 1 }}>
            {items.slice(0, 6).map((item, i) => {
              const name = typeof item === 'object' ? (item.name || item.label) : item;
              const isLast3 = i >= 3;
              return (
                <div
                  key={i}
                  onClick={() => openModal('amenities')}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 5, padding: '14px 8px', cursor: 'pointer', position: 'relative',
                    borderRight: (i % 3 < 2) ? `1px solid ${C.brd}` : 'none',
                    borderBottom: !isLast3 ? `1px solid ${C.brd}` : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Active dot */}
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, position: 'absolute', top: 8, right: 8 }} />
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{getAmenityIcon(name)}</span>
                  <span style={{ fontSize: 10.5, color: C.t2, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{name}</span>
                </div>
              );
            })}
          </div>
          {items.length > 6 && (
            <div style={{
              padding: '8px 16px', borderTop: `1px solid ${C.brd}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: C.t3 }}>+{items.length - 6} more</span>
              <button onClick={() => openModal('amenities')} style={{ fontSize: 11.5, fontWeight: 700, color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
                Edit Amenity Details
              </button>
            </div>
          )}
        </>
      )}
    </DashCard>
  );
}

/* ─── 5. EQUIPMENT INVENTORY ────────────────────────────────── */
function EquipmentCard({ gym, openModal }) {
  const items = gym.equipment || [];

  return (
    <DashCard style={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Equipment Inventory" action={() => openModal('equipment')} actionLabel="+ Add" actionIcon={Plus} />
      {items.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '28px 16px' }}>
          <Dumbbell style={{ width: 22, height: 22, color: C.t3 }} />
          <span style={{ fontSize: 11.5, color: C.t3, textAlign: 'center' }}>No equipment listed yet.</span>
          <button onClick={() => openModal('equipment')} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: C.cyan, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: FONT, boxShadow: SHADOW,
          }}>
            + Add New Equipment
          </button>
        </div>
      ) : (
        <>
          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px 8px', borderBottom: `1px solid ${C.brd}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: C.card2, color: C.t2, border: `1px solid ${C.brd}` }}>
              Status ▾
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: C.greenDim, color: C.green, border: `1px solid ${C.greenBrd}` }}>
              operational
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: C.amberDim, color: C.amber, border: `1px solid ${C.amberBrd}` }}>
              needs repair
            </span>
          </div>
          {/* Equipment list */}
          <div style={{ flex: 1 }}>
            {items.slice(0, 5).map((item, i) => {
              const name   = typeof item === 'object' ? (item.name || item.label) : item;
              const status = (typeof item === 'object' && item.status) || 'operational';
              const repair = status === 'needs repair';
              return (
                <div
                  key={i}
                  onClick={() => openModal('equipment')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                    borderBottom: i < items.slice(0, 5).length - 1 ? `1px solid ${C.brd}` : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: C.card2, border: `1px solid ${C.brd}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Dumbbell style={{ width: 14, height: 14, color: C.t3 }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.t1 }}>{name}</span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: repair ? C.amberDim : C.greenDim,
                    color: repair ? C.amber : C.green,
                    border: `1px solid ${repair ? C.amberBrd : C.greenBrd}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: `1px solid ${C.brd}` }}>
            <ActionBtn label="View Full Inventory" onClick={() => openModal('equipment')} primary flex />
            <ActionBtn label="Schedule Maintenance" onClick={() => openModal('equipment')} icon={Wrench} flex />
          </div>
          <div style={{ padding: '0 14px 10px' }}>
            <span style={{ fontSize: 10.5, color: C.t3 }}>
              Critical Maintenance: <span style={{ color: C.red, fontWeight: 700 }}>0</span>
              {'  '}Scheduled: <span style={{ color: C.amber, fontWeight: 700 }}>
                {items.filter(i => typeof i === 'object' && i.scheduled_maintenance).length}
              </span>
            </span>
          </div>
        </>
      )}
    </DashCard>
  );
}

/* ─── 6. DISCOVERY & REACH ──────────────────────────────────── */
function DiscoveryCard({ gym, openModal }) {
  const hasAddress = !!(gym.address || gym.city || gym.postcode);
  const query = encodeURIComponent([gym.name, gym.address, gym.city, gym.postcode].filter(Boolean).join(', '));
  const socials = [
    { key: 'instagram_url', Icon: Instagram, label: 'Instagram', color: '#a855f7' },
    { key: 'facebook_url',  Icon: Facebook,  label: 'Facebook',  color: '#60a5fa' },
    { key: 'twitter_url',   Icon: Twitter,   label: 'Twitter',   color: '#38bdf8' },
    { key: 'website_url',   Icon: Globe,     label: 'Website',   color: C.cyan    },
  ];
  const presentSocials = socials.filter(l => gym[l.key]);

  return (
    <DashCard>
      <CardHeader title="Discovery & Reach" action={() => openModal('editInfo')} actionLabel="Edit Details" actionIcon={Settings} />
      {/* Map */}
      <div style={{ margin: '12px 14px 0', borderRadius: 9, overflow: 'hidden', height: 155, border: `1px solid ${C.brd}`, background: C.card2 }}>
        {hasAddress
          ? <iframe
              title="map"
              width="100%" height="100%"
              style={{ border: 'none', filter: 'grayscale(0.3) invert(0.9) hue-rotate(180deg)', borderRadius: 9 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${query}&output=embed&z=14`}
            />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <MapPin style={{ width: 20, height: 20, color: C.t3 }} />
              <span style={{ fontSize: 11, color: C.t3 }}>Add address to show map</span>
            </div>
        }
      </div>
      {hasAddress && (
        <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.t2 }}>{[gym.address, gym.city, gym.postcode].filter(Boolean).join(', ')}</span>
        </div>
      )}
      {/* Social links */}
      <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${C.brd}`, marginTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>
          Social Media
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {presentSocials.length > 0 ? presentSocials.map((l) => (
            <a key={l.key} href={gym[l.key]} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 11px', borderRadius: 7,
                background: C.card2, border: `1px solid ${C.brd}`, cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.brd2}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}
              >
                <l.Icon style={{ width: 12, height: 12, color: l.color }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t2 }}>{l.label}</span>
              </div>
            </a>
          )) : (
            <button onClick={() => openModal('editInfo')} style={{
              fontSize: 11.5, padding: '6px 14px', borderRadius: 7,
              background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
              color: C.cyan, cursor: 'pointer', fontFamily: FONT, fontWeight: 700,
            }}>
              + Add Social Links
            </button>
          )}
        </div>
      </div>
    </DashCard>
  );
}

/* ─── 7. COACHES & STAFF ────────────────────────────────────── */
function CoachesCard({ coaches, openModal }) {
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <DashCard style={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Coaches & Staff" action={() => openModal('coaches')} actionLabel="+ Add Coach" actionIcon={UserPlus} />
      {coaches.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '28px 16px' }}>
          <GraduationCap style={{ width: 24, height: 24, color: C.t3 }} />
          <span style={{ fontSize: 11.5, color: C.t3 }}>No coaches added yet.</span>
          <button onClick={() => openModal('coaches')} style={{
            padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: C.cyan, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: FONT, boxShadow: SHADOW,
          }}>
            + Add Coach
          </button>
        </div>
      ) : (
        <div style={{ padding: '14px 14px 14px' }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {coaches.map((coach) => (
              <div key={coach.id} style={{
                flexShrink: 0, width: 96,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '10px 6px', borderRadius: 10,
                background: C.card2, border: `1px solid ${C.brd}`,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  overflow: 'hidden', border: `2px solid ${C.brd2}`,
                  background: C.brd, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: C.cyan,
                }}>
                  {coach.avatar_url
                    ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : ini(coach.name)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.t1, textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', paddingInline: 4 }}>
                  {coach.name}
                </div>
                {coach.specialties?.length > 0 && (
                  <div style={{ fontSize: 9.5, color: C.t3, textAlign: 'center', lineHeight: 1.3 }}>
                    {coach.specialties.slice(0, 2).join(' · ')}
                  </div>
                )}
                {coach.rating && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Star style={{ width: 9, height: 9 }} /> {coach.rating}
                  </div>
                )}
              </div>
            ))}
            <div
              onClick={() => openModal('coaches')}
              style={{
                flexShrink: 0, width: 96,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '10px 6px', borderRadius: 10,
                background: 'transparent', border: `1px dashed ${C.brd2}`, cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.brd2}
            >
              <UserPlus style={{ width: 18, height: 18, color: C.t3 }} />
              <span style={{ fontSize: 10, color: C.t3, textAlign: 'center' }}>Add coach</span>
            </div>
          </div>
        </div>
      )}
    </DashCard>
  );
}

/* ─── 8. QUICK ADMIN ACTIONS ────────────────────────────────── */
function QuickActions({ openModal }) {
  const actions = [
    { label: 'Reset QR Codes',        action: () => openModal('qrCodes')   },
    { label: 'Send Member Broadcast', action: () => openModal('broadcast')  },
    { label: 'Update Gym Hours',      action: () => openModal('hours')      },
  ];
  return (
    <DashCard>
      <CardHeader title="Quick Admin Actions" />
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px 14px' }}>
        {actions.map((a, i) => (
          <ActionBtn key={i} label={a.label} onClick={a.action} flex />
        ))}
      </div>
    </DashCard>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function TabGymProfile({ gym, openModal, coaches = [], onDeleteCoach }) {
  if (!gym) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: C.t3, fontSize: 13, fontFamily: FONT }}>
      No gym selected
    </div>
  );

  /* ── Computed scores ── */
  const galleryCount   = gym.gallery?.length    || 0;
  const amenitiesCount = gym.amenities?.length   || 0;
  const equipmentCount = gym.equipment?.length   || 0;
  const hasLogo        = !!gym.logo_url;
  const hasHero        = !!gym.image_url;
  const hasPricing     = !!gym.price;
  const hasInfo        = !!gym.name;
  const postsWeek      = gym.posts_this_week     || 0;
  const activeMembers  = gym.active_members_week || gym.members_count || 0;
  const rawEngScore    = gym.engagement_score    || 0;
  const hasSocial      = !!(gym.instagram_url || gym.facebook_url || gym.twitter_url || gym.website_url);
  const hasAddress     = !!(gym.address || gym.city || gym.postcode);

  const impressionScore = Math.round(([hasLogo, hasHero, galleryCount >= 3].filter(Boolean).length / 3) * 100);
  const trustScore      = Math.round(([hasInfo, hasPricing].filter(Boolean).length / 2) * 100);
  const discoveryScore  = Math.round(([hasAddress, hasSocial, coaches.length > 0].filter(Boolean).length / 3) * 100);

  const communityScore = gym.community_strength || Math.round((impressionScore + trustScore + discoveryScore) / 3);
  const communityState = qualityState(communityScore);
  const eng            = engLabel(rawEngScore);
  const act            = actLabel(postsWeek);

  const profileScore = Math.min(100, Math.round(
    (hasLogo ? 25 : 0) +
    (hasHero  ? 20 : 0) +
    (galleryCount >= 3 ? 20 : galleryCount > 0 ? 10 : 0) +
    (hasInfo  ? 15 : 0) +
    (hasPricing ? 10 : 0) +
    (hasSocial  ? 10 : 0)
  ));

  const actSecondary = postsWeek === 0
    ? 'No posts this week'
    : `${postsWeek}+ posts and comments this week`;

  const insight = buildInsight({
    communityScore, engScore: rawEngScore, postsWeek,
    hasLogo, hasHero, galleryCount, amenitiesCount, price: hasPricing,
  });

  const previewUrl = createPageUrl('GymCommunity') + '?id=' + gym.id;

  return (
    <div style={{ fontFamily: FONT, maxWidth: 1080, padding: '2px 0 40px', color: C.t1 }}>

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: '-0.03em' }}>
              {gym.name}
            </h2>
            {gym.verified && <BadgeCheck style={{ width: 16, height: 16, color: C.cyan }} />}
          </div>
          <p style={{ fontSize: 12, color: C.t3, margin: 0, lineHeight: 1.5, maxWidth: 480 }}>
            How your gym appears and performs for members — strengths, gaps, and what matters most.
          </p>
        </div>
        <Link to={previewUrl} target="_blank" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 8,
              fontSize: 12, fontWeight: 700, background: C.card, border: `1px solid ${C.brd}`,
              color: C.t2, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: FONT,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd;     e.currentTarget.style.color = C.t2; }}
          >
            <ExternalLink style={{ width: 11, height: 11 }} /> Member View
          </button>
        </Link>
      </div>

      {/* ── METRIC CARDS ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: 14 }}>
        <MetricCard
          label="Community Strength"
          primary={communityScore + '%'}
          secondary={communityState.label}
          color={communityState.color}
          trend={gym.community_change > 0 ? 'up' : gym.community_change < 0 ? 'down' : null}
          trendLabel={gym.community_change ? Math.abs(gym.community_change) + '% vs last mo' : null}
        />
        <MetricCard
          label="Engagement"
          primary={eng.label}
          secondary={rawEngScore > 0 ? 'High interaction rates.' : 'Not enough data yet.'}
          color={eng.color}
        />
        <MetricCard
          label="Community Activity"
          primary={act.label}
          secondary={actSecondary}
          color={act.color}
        />
        <MetricCard
          label="Active Members"
          primary={activeMembers}
          secondary="this week"
          color={activeMembers > 0 ? C.t1 : C.t3}
          trend={gym.members_change > 0 ? 'up' : gym.members_change < 0 ? 'down' : null}
          trendLabel={gym.members_change ? Math.abs(gym.members_change) + '%' : null}
        />
      </div>

      {/* ── INSIGHT BAR ──────────────────────────────────── */}
      <InsightBar text={insight} />

      {/* ── ROW 2: Profile Branding | Photo Gallery ──────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 10, marginBottom: 10 }}>
        <ProfileBrandingCard gym={gym} openModal={openModal} profileScore={profileScore} />
        <PhotoGalleryCard gym={gym} openModal={openModal} galleryCount={galleryCount} />
      </div>

      {/* ── ROW 3: Trust | Amenities | Equipment ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        <TrustCard gym={gym} openModal={openModal} />
        <AmenitiesCard gym={gym} openModal={openModal} />
        <EquipmentCard gym={gym} openModal={openModal} />
      </div>

      {/* ── ROW 4: Discovery | Coaches ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 10, marginBottom: 10 }}>
        <DiscoveryCard gym={gym} openModal={openModal} />
        <CoachesCard coaches={coaches} openModal={openModal} />
      </div>

      {/* ── QUICK ADMIN ACTIONS ──────────────────────────── */}
      <div style={{ marginBottom: 10 }}>
        <QuickActions openModal={openModal} />
      </div>

      {/* ── RETENTION FOOTER ─────────────────────────────── */}
      <DashCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Retention impact</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
              Gyms with complete profiles and active communities retain members{' '}
              <span style={{ color: C.t2, fontWeight: 600 }}>2.3× longer</span> on average.
            </div>
          </div>
          <Link to={previewUrl} target="_blank" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.cyan, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              See member view <ExternalLink style={{ width: 11, height: 11 }} />
            </span>
          </Link>
        </div>
      </DashCard>

    </div>
  );
}
