/**
 * TabGymProfile — redesigned to match ContentPage quality
 * Same color tokens, density, hover patterns, sidebar, and interaction style.
 */
import React, { useState } from 'react';
import {
  Image, ExternalLink, Zap, TrendingUp, BadgeCheck,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
  Instagram, Facebook, Twitter, Globe, MapPin,
  Users, Dumbbell, Star, GraduationCap, UserPlus,
  Plus, Pencil, CheckCircle2, AlertCircle, X,
} from 'lucide-react';
import { createPageUrl } from '../../utils';

/* ─── TOKENS ────────────────────────────────────────────────── */
const C = {
  bg:       '#000000',
  sidebar:  '#0f0f12',
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
const GRAD_BTN = { background: '#2563eb', border: 'none', color: '#fff' };

/* ─── HELPERS ────────────────────────────────────────────────── */
function qualityState(score) {
  if (score >= 75) return { label: 'Strong',          color: C.green, dim: C.greenDim, brd: C.greenBrd };
  if (score >= 40) return { label: 'Needs attention', color: C.amber, dim: C.amberDim, brd: C.amberBrd };
  return           { label: 'Weak',                   color: C.red,   dim: C.redDim,   brd: C.redBrd   };
}
function buildInsight({ communityScore, engScore, postsWeek, hasLogo, hasHero, galleryCount, amenitiesCount, price }) {
  if (!hasLogo && !hasHero) return "Your gym has no photos yet — members won't be able to visualise the space before joining.";
  if (galleryCount < 3 && engScore < 40) return "Your profile is sparse and community activity is low — both reduce a member's confidence before joining.";
  if (communityScore >= 70 && postsWeek < 2) return "Your profile looks solid, but low community activity means members see a quiet gym, not a thriving one.";
  if (communityScore >= 70 && engScore >= 60) return "Your gym is in good shape — a consistent post cadence is the next step to sustaining retention.";
  if (!price && amenitiesCount === 0) return "Pricing and amenities are missing — this creates uncertainty before a member decides to join.";
  return "Your gym is making progress — a few more improvements will noticeably boost member confidence.";
}

/* ─── STATUS BADGE ───────────────────────────────────────────── */
function StatusBadge({ score }) {
  const s = qualityState(score);
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, flexShrink: 0,
      color: s.color, background: s.dim, border: `1px solid ${s.brd}`, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

/* ─── SCORE BAR ──────────────────────────────────────────────── */
function ScoreBar() {
  return null;
}

/* ─── METRIC STAT CARD (matches ContentPage sidebar stat cells) ─ */
function StatCell({ label, value, color, onClick, borderRight }) {
  return (
    <div
      onClick={onClick}
      style={{ padding: '12px 14px', background: C.sidebar, cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s', borderRight: borderRight ? `1px solid ${C.brd}` : 'none' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = C.cyanDim)}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = C.sidebar)}
    >
      <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || C.cyan, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ─── PROFILE ITEM CARD ──────────────────────────────────────── */
function ItemCard({ title, score, microcopy, onClick, children, flex }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${hovered && onClick ? C.cyanBrd : C.brd}`,
        borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: hovered && onClick ? '0 0 8px rgba(77,127,255,0.07)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...(flex ? { flex } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', flexShrink: 0 }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{title}</div>
          {microcopy && <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>{microcopy}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <StatusBadge score={score} />
          {onClick && <Pencil style={{ width: 10, height: 10, color: hovered ? C.cyan : 'transparent', flexShrink: 0, transition: 'color 0.15s' }} />}
        </div>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <ScoreBar score={score} />
    </div>
  );
}

/* ─── COLLAPSIBLE FULL-WIDTH SECTION ─────────────────────────── */
function FullSection({ title, subtitle, score, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const s = qualityState(score);
  return (
    <div style={{ background: C.card, border: `1px solid ${score < 40 ? C.redBrd : C.brd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 9, transition: 'border-color 0.15s' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: open ? `1px solid ${C.brd}` : 'none', cursor: 'pointer', gap: 10, textAlign: 'left', fontFamily: FONT, transition: 'background 0.12s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <StatusBadge score={score} />
        {open
          ? <ChevronUp style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
        }
      </button>
      {open && (
        <>
          {children}
          <ScoreBar score={score} />
        </>
      )}
    </div>
  );
}

/* ─── VISUAL COMPONENTS ──────────────────────────────────────── */
function LogoVisual({ logoUrl }) {
  return (
    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${C.brd}` }}>
      {logoUrl
        ? <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.brd2}` }}>
            <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        : <div style={{ width: 90, height: 90, borderRadius: '50%', background: C.card2, border: `2px dashed ${C.brd2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell style={{ width: 24, height: 24, color: C.t3 }} />
          </div>
      }
    </div>
  );
}

function CoverVisual({ imageUrl }) {
  return (
    <div style={{ height: 140, borderTop: `1px solid ${C.brd}`, overflow: 'hidden' }}>
      {imageUrl
        ? <img src={imageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
            <Image style={{ width: 22, height: 22, color: C.t3 }} />
            <span style={{ fontSize: 11, color: C.t3 }}>No cover image</span>
          </div>
      }
    </div>
  );
}

function GalleryVisual({ gallery, onAdd }) {
  const photos = (gallery || []).slice(0, 8).map(g => g.url || g);
  const needsMore = photos.length < 5;

  if (photos.length === 0) {
    return (
      <div style={{ height: 148, borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.015)' }}>
        <Image style={{ width: 22, height: 22, color: C.t3 }} />
        <span style={{ fontSize: 11, color: C.t3 }}>No photos yet — add some to showcase your space</span>
      </div>
    );
  }

  /* Build tile list: real photos + 1 "add more" tile if < 5 */
  const tiles = [...photos];
  if (needsMore) tiles.push('__add__');

  /* Clamp to 6 display slots max */
  const display = tiles.slice(0, 6);
  const overflow = photos.length > 6 ? photos.length - 6 : 0;

  return (
    <div style={{ height: 148, borderTop: `1px solid ${C.brd}`, overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(display.length, 3)}, 1fr)`, gridTemplateRows: display.length > 3 ? '1fr 1fr' : '1fr', gap: 2, height: '100%' }}>
        {display.map((src, i) => {
          if (src === '__add__') {
            return (
              <div key="add" style={{ background: 'rgba(77,127,255,0.06)', border: `1px dashed rgba(77,127,255,0.22)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Plus style={{ width: 14, height: 14, color: 'rgba(77,127,255,0.5)' }} />
                <span style={{ fontSize: 9.5, color: 'rgba(77,127,255,0.5)', fontWeight: 600 }}>Add photos</span>
              </div>
            );
          }
          return (
            <div key={i} style={{ overflow: 'hidden', background: C.card2, position: 'relative' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {i === 5 && overflow > 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  +{overflow}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapVisual({ gym }) {
  const hasAddress = gym.address || gym.city || gym.postcode;

  /* Deduplicate address parts — gym.address often already contains city/postcode */
  function buildAddress(parts) {
    const seen = new Set();
    return parts.filter(Boolean).filter(p => {
      const key = p.trim().toLowerCase();
      if (seen.has(key)) return false;
      // Skip a part if it's already fully contained in an earlier part
      for (const s of seen) { if (s.includes(key) || key.includes(s)) return false; }
      seen.add(key);
      return true;
    }).join(', ');
  }

  const displayAddress = buildAddress([gym.address, gym.city, gym.postcode]);
  const query = encodeURIComponent([gym.name, gym.address].filter(Boolean).join(', '));

  return (
    <div style={{ borderTop: `1px solid ${C.brd}` }}>
      {hasAddress && (
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayAddress}</span>
        </div>
      )}
      <div style={{ height: 130, overflow: 'hidden', position: 'relative', margin: '0 14px 14px', borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}` }}>
        {hasAddress
          ? <iframe title="map" width="100%" height="100%" style={{ border: 'none', filter: 'grayscale(0.3) invert(0.9) hue-rotate(180deg)', borderRadius: 8 }} loading="lazy" src={`https://maps.google.com/maps?q=${query}&output=embed&z=14`} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <MapPin style={{ width: 18, height: 18, color: C.t3 }} />
              <span style={{ fontSize: 11, color: C.t3 }}>Add address to show map</span>
            </div>
        }
      </div>
    </div>
  );
}

function SocialVisual({ gym }) {
  const links = [
    { key: 'instagram_url', Icon: Instagram, label: 'Instagram', color: '#a855f7' },
    { key: 'facebook_url',  Icon: Facebook,  label: 'Facebook',  color: '#60a5fa' },
    { key: 'twitter_url',   Icon: Twitter,   label: 'Twitter',   color: '#38bdf8' },
    { key: 'website_url',   Icon: Globe,     label: 'Website',   color: C.cyan    },
  ];
  const present = links.filter(l => gym[l.key]);
  const missing = links.filter(l => !gym[l.key]);

  return (
    <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${C.brd}` }}>
      {/* Connected links */}
      {present.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: missing.length > 0 ? 10 : 0 }}>
          {present.map(l => (
            <a key={l.key} href={gym[l.key]} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 7, background: C.card2, border: `1px solid ${C.brd}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.brd2}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
                <l.Icon style={{ width: 12, height: 12, color: l.color }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t2 }}>{l.label}</span>
              </div>
            </a>
          ))}
        </div>
      )}
      {/* Missing networks — shown as muted chips */}
      {missing.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {missing.map(l => (
            <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', border: `1px dashed ${C.brd}`, opacity: 0.6 }}>
              <l.Icon style={{ width: 12, height: 12, color: C.t3 }} />
              <span style={{ fontSize: 11.5, fontWeight: 500, color: C.t3 }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CoachesVisual({ coaches, onManage }) {
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ borderTop: `1px solid ${C.brd}`, padding: '10px 14px 12px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {coaches.map(coach => (
          <div key={coach.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}` }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: `1.5px solid ${C.brd2}`, background: C.brd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: C.cyan }}>
              {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(coach.name)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, whiteSpace: 'nowrap' }}>{coach.name}</div>
              {(coach.specialties?.length > 0 || coach.rating) && (
                <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {coach.specialties?.[0] && <span>{coach.specialties[0]}</span>}
                  {coach.rating && <span style={{ color: C.amber, display: 'flex', alignItems: 'center', gap: 2 }}><Star style={{ width: 9, height: 9 }} />{coach.rating}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        {coaches.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `1.5px dashed ${C.brd2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap style={{ width: 14, height: 14, color: C.t3 }} />
            </div>
            <span style={{ fontSize: 11.5, color: C.t3 }}>No coaches added yet</span>
            <button onClick={onManage} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', flexShrink: 0, ...GRAD_BTN }}>
              + Add
            </button>
          </div>
        ) : (
          <div onClick={onManage} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: `1px dashed ${C.brd2}`, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.background = C.cyanDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.background = 'transparent'; }}>
            <UserPlus style={{ width: 13, height: 13, color: C.t3 }} />
            <span style={{ fontSize: 11, color: C.t3, whiteSpace: 'nowrap' }}>Add coach</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TAGS LIST ──────────────────────────────────────────────── */
function TagsList({ items, emptyText, onClick }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      {(!items || items.length === 0) ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: C.t3 }}>{emptyText}</span>
          <button onClick={onClick} style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 7, fontFamily: FONT, cursor: 'pointer', boxShadow: SHADOW, display: 'flex', alignItems: 'center', gap: 4, ...GRAD_BTN }}>
            <Plus style={{ width: 11, height: 11 }} /> Add
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {items.map((item, i) => (
            <span key={i} style={{ fontSize: 11.5, padding: '4px 11px', borderRadius: 20, background: C.card2, border: `1px solid ${C.brd}`, color: C.t2 }}>
              {typeof item === 'object' ? item.name || item.label : item}
            </span>
          ))}
          <button onClick={onClick} style={{ fontSize: 11.5, padding: '4px 11px', borderRadius: 20, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, color: C.cyan, cursor: 'pointer', fontFamily: FONT, fontWeight: 700 }}>
            + Edit
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── TRUST ROW ──────────────────────────────────────────────── */
function TrustRow({ gym, openModal }) {
  const infoScore    = gym.name  ? 100 : 0;
  const pricingScore = gym.price ? 100 : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
      {[
        { label: 'Gym Info',  score: infoScore,    desc: gym.name  ? 'Name, address, and contact details are present.' : "Core gym details are missing — members can't verify what's on offer.",    action: () => openModal('editInfo') },
        { label: 'Pricing',   score: pricingScore, desc: gym.price ? `Listed at ${gym.price} — visible to members before joining.` : 'Missing pricing creates uncertainty and reduces conversion.', action: () => openModal('pricing')  },
      ].map((item, i) => {
        const s = qualityState(item.score);
        return (
          <div key={i} onClick={item.action} style={{ padding: '13px 18px', cursor: 'pointer', borderRight: i === 0 ? `1px solid ${C.brd}` : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{item.label}</span>
              <StatusBadge score={item.score} />
            </div>
            <div style={{ fontSize: 11, color: C.t3 }}>{item.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
function ProfileSidebar({ communityScore, impressionScore, trustScore, discoveryScore, amenitiesScore, equipmentScore, coachesScore, openModal, gym, activeMembers, totalMembers }) {
  const communityState = qualityState(communityScore);

  const checks = [
    { label: 'Logo / profile photo',  done: !!gym.logo_url,    action: () => openModal('logo')      },
    { label: 'Cover image',           done: !!gym.image_url,   action: () => openModal('heroPhoto') },
    { label: 'Gallery photos (5+)',   done: (gym.gallery?.length || 0) >= 5, action: () => openModal('photos')   },
    { label: 'Address & location',    done: !!(gym.address || gym.city), action: () => openModal('editInfo') },
    { label: 'Social media links',    done: !!(gym.instagram_url || gym.facebook_url || gym.website_url), action: () => openModal('editInfo') },
    { label: 'Membership pricing',    done: !!gym.price,       action: () => openModal('pricing')   },
    { label: 'Amenities listed',      done: (gym.amenities?.length || 0) > 0, action: () => openModal('amenities') },
    { label: 'Equipment listed',      done: (gym.equipment?.length || 0) > 0, action: () => openModal('equipment') },
  ];
  const doneCount = checks.filter(c => c.done).length;

  return (
    <div style={{ width: 244, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', fontFamily: FONT, position: 'sticky', top: 0, maxHeight: '100vh', overflowY: 'auto', scrollbarWidth: 'none' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Profile Overview</div>
      </div>

      {/* Community strength + stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.brd, borderBottom: `1px solid ${C.brd}` }}>
        <StatCell label="Community" value={communityScore + '%'} color={communityState.color} borderRight />
        <StatCell label="First impression" value={impressionScore + '%'} color={qualityState(impressionScore).color} />
        <StatCell label="Trust & clarity" value={trustScore + '%'} color={qualityState(trustScore).color} borderRight />
        <StatCell label="Discovery" value={discoveryScore + '%'} color={qualityState(discoveryScore).color} />
      </div>

      {/* Checklist */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Profile Checklist</span>
          <span style={{ fontSize: 11, color: C.t3 }}>{doneCount}/{checks.length}</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${Math.round((doneCount / checks.length) * 100)}%`, background: doneCount === checks.length ? C.green : C.cyan, transition: 'width 0.6s ease', borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {checks.map((item, i) => (
            <div
              key={i}
              onClick={item.done ? undefined : item.action}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 7, cursor: item.done ? 'default' : 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => { if (!item.done) e.currentTarget.style.background = C.cyanDim; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {item.done
                ? <CheckCircle2 style={{ width: 13, height: 13, color: C.green, flexShrink: 0 }} />
                : <AlertCircle style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
              }
              <span style={{ fontSize: 11.5, color: item.done ? C.t2 : C.t1, fontWeight: item.done ? 400 : 500, flex: 1, textDecoration: item.done ? 'line-through' : 'none', textDecorationColor: C.t3 }}>
                {item.label}
              </span>
              {!item.done && <Plus style={{ width: 10, height: 10, color: C.cyan, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Retention callout */}
      <div style={{ padding: '14px 16px 20px' }}>
        <div style={{ padding: '12px 14px', borderRadius: 9, background: C.cyanDim, border: `1px solid ${C.cyanBrd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <TrendingUp style={{ width: 13, height: 13, color: C.cyan, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.t1 }}>Retention impact</span>
          </div>
          <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.5 }}>
            Complete profiles retain members{' '}
            <span style={{ color: C.t1, fontWeight: 600 }}>2.3× longer</span> on average.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function TabGymProfile({ gym, openModal, coaches = [], onDeleteCoach, checkIns = [], posts = [], allMemberships = [] }) {
  if (!gym) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: C.t3, fontSize: 13, fontFamily: FONT }}>
        No gym selected
      </div>
    );
  }

  /* ── Derived data ─────────────────────────────────────────── */
  const galleryCount   = gym.gallery?.length    || 0;
  const amenitiesCount = gym.amenities?.length   || 0;
  const equipmentCount = gym.equipment?.length   || 0;
  const hasLogo        = !!gym.logo_url;
  const hasHero        = !!gym.image_url;
  const hasPricing     = !!gym.price;
  const hasInfo        = !!gym.name;
  const hasSocial      = !!(gym.instagram_url || gym.facebook_url || gym.twitter_url || gym.website_url);
  const hasAddress     = !!(gym.address || gym.city || gym.postcode);

  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  const weekAgo = Date.now() - MS_WEEK;

  const recentCiUsers = new Set(
    checkIns.filter(c => c.gym_id === gym.id && new Date(c.check_in_date || c.created_date).getTime() > weekAgo).map(c => c.user_id)
  );
  const activeMembers = recentCiUsers.size;

  const postsWeek = posts.filter(p =>
    !p.is_hidden && p.gym_id === gym.id && new Date(p.created_date || p.created_at || 0).getTime() > weekAgo
  ).length;

  const totalMembers = allMemberships.length || gym.members_count || 1;
  const rawEngScore  = Math.round((activeMembers / totalMembers) * 100);

  const impressionScore = Math.round(([hasLogo, hasHero, galleryCount >= 3].filter(Boolean).length / 3) * 100);
  const trustScore      = Math.round(([hasInfo, hasPricing].filter(Boolean).length / 2) * 100);
  const discoveryScore  = Math.round(([hasAddress, hasSocial, coaches.length > 0].filter(Boolean).length / 3) * 100);
  const amenitiesScore  = amenitiesCount >= 4 ? 100 : amenitiesCount > 0 ? 50 : 0;
  const equipmentScore  = equipmentCount >= 5 ? 100 : equipmentCount > 0 ? 50 : 0;
  const coachesScore    = coaches.length >= 2 ? 100 : coaches.length > 0 ? 60 : 0;

  const profileScore   = Math.round((impressionScore + trustScore + discoveryScore) / 3);
  const communityScore = Math.round(profileScore * 0.6 + rawEngScore * 0.4);

  const logoScore    = hasLogo ? 100 : 0;
  const coverScore   = hasHero ? 100 : 0;
  const galleryScore = galleryCount >= 5 ? 100 : galleryCount > 0 ? 50 : 0;
  const mapScore     = hasAddress ? 100 : 0;
  const socialScore  = hasSocial ? 100 : 0;

  const insight = buildInsight({ communityScore, engScore: rawEngScore, postsWeek, hasLogo, hasHero, galleryCount, amenitiesCount, price: hasPricing });
  const previewUrl = createPageUrl('GymCommunity') + '?id=' + gym.id;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>

        {/* Page header */}
        <div style={{ padding: '4px 16px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2 }}>{gym.name}</h1>
              {gym.verified && <BadgeCheck style={{ width: 16, height: 16, color: C.cyan }} />}
            </div>
            <p style={{ fontSize: 12, color: C.t3, margin: '2px 0 0', lineHeight: 1.5 }}>
              How your gym appears and performs for members — strengths, gaps, and what to fix next.
            </p>
          </div>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'opacity 0.15s', ...GRAD_BTN }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <ExternalLink style={{ width: 11, height: 11 }} /> Member View
            </button>
          </a>
        </div>

        {/* Insight bar — matches ContentPage's notification ticker style */}
        <div style={{ margin: '12px 4px 12px 0', padding: '10px 14px', borderRadius: 4, background: 'rgba(77,127,255,0.11)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap style={{ width: 12, height: 12, color: C.cyan, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#93c5fd' }}>{insight}</span>
        </div>

        {/* Main body padding */}
        <div style={{ padding: '0 16px 32px 4px' }}>

          {/* Section label */}
          <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 9 }}>
            Profile Diagnosis
          </div>

          {/* ── 2-col grid: First Impression + Discovery ───── */}
          <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 9, marginBottom: 9, alignItems: 'stretch' }}>

            {/* LEFT: First Impression */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
                First Impression <span style={{ color: C.t3, fontWeight: 400 }}>— What a member sees when they find your gym</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <ItemCard title="Logo / Profile Photo" score={logoScore}
                  microcopy={hasLogo ? 'Shown on your gym card and header.' : 'No logo reduces recognition.'}
                  onClick={() => openModal('logo')}>
                  <LogoVisual logoUrl={gym.logo_url} />
                </ItemCard>
                <ItemCard title="Cover Image" score={coverScore}
                  microcopy={hasHero ? 'Visible across your gym page.' : 'No cover makes your page feel empty.'}
                  onClick={() => openModal('heroPhoto')}>
                  <CoverVisual imageUrl={gym.image_url} />
                </ItemCard>
              </div>
              <ItemCard title="Photo Gallery" score={galleryScore} flex={1}
                microcopy={galleryCount >= 5 ? `Rich gallery with ${galleryCount}+ photos.` : galleryCount > 0 ? `${galleryCount} photos — add ${5 - galleryCount} more for full score.` : "No gallery. Members can't visualise the space."}
                onClick={() => openModal('photos')}>
                <GalleryVisual gallery={gym.gallery} />
              </ItemCard>
            </div>

            {/* RIGHT: Discovery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
                Discovery <span style={{ color: C.t3, fontWeight: 400 }}>— What makes your gym distinct and searchable</span>
              </div>
              <ItemCard title="Location & Hours" score={mapScore}
                microcopy="Address, hours, and location data."
                onClick={() => openModal('editInfo')}>
                <MapVisual gym={gym} />
              </ItemCard>
              <ItemCard title="Social Media Links" score={socialScore}
                microcopy={hasSocial ? 'Social presence increases discoverability.' : 'No social links. Reduces visibility and trust.'}
                onClick={() => openModal('editInfo')}>
                <SocialVisual gym={gym} />
              </ItemCard>
              <ItemCard title="Coaches & Staff" score={coachesScore} flex={1}
                microcopy={coaches.length > 0 ? `${coaches.length} coach${coaches.length !== 1 ? 'es' : ''} on your team.` : 'Add coaches to showcase your team.'}
                onClick={() => openModal('coaches')}>
                <CoachesVisual coaches={coaches} onManage={() => openModal('coaches')} />
              </ItemCard>
            </div>
          </div>

          {/* ── FULL-WIDTH SECTIONS ────────────────────────── */}
          <FullSection title="Trust & Clarity" subtitle="Information members need to feel confident before joining." score={trustScore} defaultOpen={trustScore < 100}>
            <TrustRow gym={gym} openModal={openModal} />
          </FullSection>

          <FullSection title="Amenities" subtitle="Highlight what members can access and enjoy." score={amenitiesScore} defaultOpen={amenitiesScore < 100}>
            <TagsList items={gym.amenities} emptyText="No amenities listed. Members can't compare what you offer." onClick={() => openModal('amenities')} />
          </FullSection>

          <FullSection title="Equipment" subtitle="Help members find the equipment they care about." score={equipmentScore} defaultOpen={equipmentScore < 100}>
            <TagsList items={gym.equipment} emptyText="No equipment listed. A common reason members choose a competitor." onClick={() => openModal('equipment')} />
          </FullSection>

        </div>
      </div>

      {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
      <ProfileSidebar
        communityScore={communityScore}
        impressionScore={impressionScore}
        trustScore={trustScore}
        discoveryScore={discoveryScore}
        amenitiesScore={amenitiesScore}
        equipmentScore={equipmentScore}
        coachesScore={coachesScore}
        openModal={openModal}
        gym={gym}
        activeMembers={activeMembers}
        totalMembers={totalMembers}
      />

    </div>
  );
}