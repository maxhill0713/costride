/**
 * TabGymProfile — Forge Fitness Dashboard
 * Layout matches screenshot: 2-col Profile Diagnosis + full-width below.
 * Exact ContentPage colour tokens (#4d7fff).
 */
import React, { useState } from 'react';
import {
  Image, ExternalLink, Zap, TrendingUp, BadgeCheck,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp,
  Instagram, Facebook, Twitter, Globe, MapPin, Tag,
  Users, Dumbbell, Star, Trash2, GraduationCap, UserPlus,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

/* ─── TOKENS ────────────────────────────────────────────────── */
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
  redDim:   'rgba(255,77,109,0.12)',
  redBrd:   'rgba(255,77,109,0.28)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  amberBrd: 'rgba(245,158,11,0.28)',
  green:    '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
  greenBrd: 'rgba(34,197,94,0.28)',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

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
  return       { label: 'Low',     color: C.red   };
}
function buildInsight({ communityScore, engScore, postsWeek, hasLogo, hasHero, galleryCount, amenitiesCount, price }) {
  if (!hasLogo && !hasHero) return "Your gym has no photos yet — members won't be able to visualise the space before joining.";
  if (galleryCount < 3 && engScore < 40) return "Your profile is sparse and community activity is low — both reduce a member's confidence before joining.";
  if (communityScore >= 70 && postsWeek < 2) return "Your profile looks solid, but low community activity means members see a quiet gym, not a thriving one.";
  if (communityScore >= 70 && engScore >= 60) return "Your gym is in good shape — a consistent post cadence is the next step to sustaining retention.";
  if (!price && amenitiesCount === 0) return "Pricing and amenities are missing — this creates uncertainty before a member decides to join.";
  return "Your gym is making progress — a few more improvements will noticeably boost member confidence.";
}

/* ─── METRIC CARD ───────────────────────────────────────────── */
function MetricCard({ label, primary, secondary, color, trend, trendLabel }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;
  const trendColor = trend === 'up' ? C.green : C.red;
  const state = typeof primary === 'string' && primary !== String(parseInt(primary)) ? null : qualityState(parseInt(primary) || 0);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>{primary}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
        {secondary && <span style={{ fontSize: 11, color: C.t2 }}>{secondary}</span>}
        {trend && TrendIcon && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10.5, fontWeight: 700, color: trendColor }}>
            <TrendIcon style={{ width: 10, height: 10 }} />{trendLabel}
          </span>
        )}
      </div>
      {/* Bottom accent bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: (color || C.cyan) + '55' }} />
    </div>
  );
}

/* ─── INSIGHT BAR ───────────────────────────────────────────── */
function InsightBar({ text }) {
  return (
    <div style={{ padding: '10px 15px', borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, borderLeft: `2px solid ${C.cyan}`, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
      <Zap style={{ width: 12, height: 12, color: C.cyan, flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

/* ─── SECTION HEADER CARD ───────────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '13px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: '-0.01em' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

/* ─── ITEM CARD — wraps each visual card ────────────────────── */
function ItemCard({ title, score, microcopy, onClick, children, noPad }) {
  const state = qualityState(score);
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default', position: 'relative',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = C.brd2)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = C.brd)}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{title}</div>
          {microcopy && <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>{microcopy}</div>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, flexShrink: 0, marginLeft: 10, color: state.color, background: state.dim, border: `1px solid ${state.brd}`, whiteSpace: 'nowrap' }}>
          {state.label}
        </span>
      </div>
      {/* Visual content */}
      <div style={{ flex: 1, ...(!noPad && {}) }}>
        {children}
      </div>
      {/* Quality bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${score}%`, background: state.color, opacity: 0.6, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

/* ─── LOGO VISUAL ───────────────────────────────────────────── */
function LogoVisual({ logoUrl }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${C.brd}` }}>
      {logoUrl
        ? <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.brd2}` }}>
            <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        : <div style={{ width: 110, height: 110, borderRadius: '50%', background: C.card2, border: `2px dashed ${C.brd2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell style={{ width: 28, height: 28, color: C.t3 }} />
          </div>
      }
    </div>
  );
}

/* ─── COVER IMAGE VISUAL ────────────────────────────────────── */
function CoverVisual({ imageUrl }) {
  return (
    <div style={{ height: 160, borderTop: `1px solid ${C.brd}`, overflow: 'hidden', position: 'relative' }}>
      {imageUrl
        ? <img src={imageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
            <Image style={{ width: 24, height: 24, color: C.t3 }} />
            <span style={{ fontSize: 11, color: C.t3 }}>No cover image</span>
          </div>
      }
    </div>
  );
}

/* ─── PHOTO GALLERY VISUAL ──────────────────────────────────── */
function GalleryVisual({ gallery }) {
  const photos = (gallery || []).slice(0, 9).map(g => g.url || g);
  if (photos.length === 0) {
    return (
      <div style={{ height: 170, borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.02)' }}>
        <Image style={{ width: 24, height: 24, color: C.t3 }} />
        <span style={{ fontSize: 11, color: C.t3 }}>No photos yet</span>
      </div>
    );
  }
  return (
    <div style={{ height: 170, borderTop: `1px solid ${C.brd}`, overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, height: '100%' }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ overflow: 'hidden', background: C.card2 }}>
            {photos[i]
              ? <img src={photos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)' }} />
            }
          </div>
        ))}
      </div>
      {photos.length > 6 && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: 5 }}>
          +{photos.length - 6} more
        </div>
      )}
    </div>
  );
}

/* ─── MAP / KEYWORDS VISUAL ─────────────────────────────────── */
function MapVisual({ gym }) {
  const hasAddress = gym.address || gym.city || gym.postcode;
  const query = encodeURIComponent([gym.name, gym.address, gym.city, gym.postcode].filter(Boolean).join(', '));
  return (
    <div style={{ borderTop: `1px solid ${C.brd}` }}>
      {hasAddress && (
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.t2 }}>{[gym.address, gym.city, gym.postcode].filter(Boolean).join(', ')}</span>
        </div>
      )}
      <div style={{ height: 140, overflow: 'hidden', position: 'relative', margin: '0 14px 14px', borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}` }}>
        {hasAddress
          ? <iframe
              title="map"
              width="100%" height="100%"
              style={{ border: 'none', filter: 'grayscale(0.3) invert(0.9) hue-rotate(180deg)', borderRadius: 8 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${query}&output=embed&z=14`}
            />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <MapPin style={{ width: 20, height: 20, color: C.t3 }} />
              <span style={{ fontSize: 11, color: C.t3 }}>Add address to show map</span>
            </div>
        }
      </div>
    </div>
  );
}

/* ─── SOCIAL MEDIA VISUAL ───────────────────────────────────── */
function SocialVisual({ gym }) {
  const links = [
    { key: 'instagram_url', Icon: Instagram, label: 'Instagram', color: '#a855f7' },
    { key: 'facebook_url',  Icon: Facebook,  label: 'Facebook',  color: '#3b82f6' },
    { key: 'twitter_url',   Icon: Twitter,   label: 'Twitter',   color: '#38bdf8' },
    { key: 'website_url',   Icon: Globe,     label: 'Website',   color: C.cyan    },
  ];
  const present = links.filter(l => gym[l.key]);
  return (
    <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${C.brd}`, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {present.length > 0 ? present.map((l) => (
        <a key={l.key} href={gym[l.key]} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, background: C.card2, border: `1px solid ${C.brd}`, cursor: 'pointer' }}>
            <l.Icon style={{ width: 12, height: 12, color: l.color }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t2 }}>{l.label}</span>
          </div>
        </a>
      )) : (
        <span style={{ fontSize: 11, color: C.t3 }}>No social links added yet.</span>
      )}
    </div>
  );
}

/* ─── COACHES VISUAL ────────────────────────────────────────── */
function CoachesVisual({ coaches, onManage }) {
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ borderTop: `1px solid ${C.brd}`, padding: '12px 14px 14px' }}>
      {coaches.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
          <GraduationCap style={{ width: 22, height: 22, color: C.t3 }} />
          <span style={{ fontSize: 11, color: C.t3 }}>No coaches added yet.</span>
          <button onClick={onManage} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBrd}`, cursor: 'pointer' }}>
            + Add Coach
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {coaches.map((coach) => (
            <div key={coach.id} style={{ flexShrink: 0, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 6px', borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}` }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.brd2}`, flexShrink: 0, background: C.brd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.cyan }}>
                {coach.avatar_url
                  ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : ini(coach.name)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t1, textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', paddingInline: 4 }}>{coach.name}</div>
              {coach.specialties?.length > 0 && (
                <div style={{ fontSize: 9.5, color: C.t3, textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
          {/* Add coach button */}
          <div onClick={onManage} style={{ flexShrink: 0, width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 6px', borderRadius: 9, background: 'transparent', border: `1px dashed ${C.brd2}`, cursor: 'pointer' }}>
            <UserPlus style={{ width: 18, height: 18, color: C.t3 }} />
            <span style={{ fontSize: 10, color: C.t3, textAlign: 'center' }}>Add coach</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── FULL-WIDTH ROW SECTION (Trust, Amenities, Equipment) ─── */
function FullSection({ title, subtitle, score, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const state = qualityState(score);
  return (
    <div style={{ background: C.card, border: `1px solid ${score < 40 ? C.redBrd : C.brd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '13px 18px', background: 'transparent', border: 'none', borderBottom: open ? `1px solid ${C.brd}` : 'none', cursor: 'pointer', gap: 10, textAlign: 'left' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, color: state.color, background: state.dim, border: `1px solid ${state.brd}`, flexShrink: 0, whiteSpace: 'nowrap' }}>{state.label}</span>
        {open ? <ChevronUp style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} /> : <ChevronDown style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />}
      </button>
      {open && (
        <>
          {children}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ height: '100%', width: `${score}%`, background: state.color, opacity: 0.5, transition: 'width 0.6s ease' }} />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── TRUST ROW (Info + Pricing side by side) ───────────────── */
function TrustRow({ gym, openModal }) {
  const infoScore = gym.name ? 100 : 0;
  const pricingScore = gym.price ? 100 : 0;
  const infoState = qualityState(infoScore);
  const pricingState = qualityState(pricingScore);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
      <div onClick={() => openModal('editInfo')} style={{ padding: '13px 18px', cursor: 'pointer', borderRight: `1px solid ${C.brd}` }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Gym Info</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: infoState.color, background: infoState.dim, border: `1px solid ${infoState.brd}` }}>{infoState.label}</span>
        </div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>
          {gym.name ? 'Name, address, and contact details are present.' : 'Core gym details are missing — members can\'t verify what\'s on offer.'}
        </div>
      </div>
      <div onClick={() => openModal('pricing')} style={{ padding: '13px 18px', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Pricing</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: pricingState.color, background: pricingState.dim, border: `1px solid ${pricingState.brd}` }}>{pricingState.label}</span>
        </div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>
          {gym.price ? `Listed at ${gym.price} — visible to members before joining.` : 'Missing pricing creates uncertainty and reduces conversion.'}
        </div>
      </div>
    </div>
  );
}

/* ─── TAGS LIST (Amenities / Equipment) ─────────────────────── */
function TagsList({ items, emptyText, onClick }) {
  return (
    <div style={{ padding: '12px 18px' }}>
      {(!items || items.length === 0) ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: C.t3 }}>{emptyText}</span>
          <button onClick={onClick} style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 7, background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBrd}`, cursor: 'pointer' }}>+ Add</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {items.map((item, i) => (
            <span key={i} style={{ fontSize: 11.5, padding: '4px 11px', borderRadius: 20, background: C.card2, border: `1px solid ${C.brd}`, color: C.t2 }}>
              {typeof item === 'object' ? item.name || item.label : item}
            </span>
          ))}
          <button onClick={onClick} style={{ fontSize: 11.5, padding: '4px 11px', borderRadius: 20, background: 'transparent', border: `1px dashed ${C.brd2}`, color: C.t3, cursor: 'pointer' }}>+ Edit</button>
        </div>
      )}
    </div>
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

  /* Scores */
  const impressionScore = Math.round(([hasLogo, hasHero, galleryCount >= 3].filter(Boolean).length / 3) * 100);
  const trustScore      = Math.round(([hasInfo, hasPricing].filter(Boolean).length / 2) * 100);
  const discoveryScore  = Math.round(([hasAddress, hasSocial, coaches.length > 0].filter(Boolean).length / 3) * 100);
  const amenitiesScore  = amenitiesCount >= 4 ? 100 : amenitiesCount > 0 ? 50 : 0;
  const equipmentScore  = equipmentCount >= 5 ? 100 : equipmentCount > 0 ? 50 : 0;
  const coachesScore    = coaches.length >= 2 ? 100 : coaches.length > 0 ? 60 : 0;

  const communityScore  = gym.community_strength || Math.round((impressionScore + trustScore + discoveryScore) / 3);
  const communityState  = qualityState(communityScore);
  const eng             = engLabel(rawEngScore);
  const act             = actLabel(postsWeek);

  const actSecondary = postsWeek === 0 ? 'No posts this week' : `${postsWeek}+ posts and comments this week.`;

  const insight = buildInsight({ communityScore, engScore: rawEngScore, postsWeek, hasLogo, hasHero, galleryCount, amenitiesCount, price: hasPricing });

  const logoScore    = hasLogo ? 100 : 0;
  const coverScore   = hasHero ? 100 : 0;
  const galleryScore = galleryCount >= 5 ? 100 : galleryCount > 0 ? 50 : 0;
  const mapScore     = hasAddress ? 100 : 0;
  const socialScore  = hasSocial ? 100 : 0;

  const previewUrl = createPageUrl('GymCommunity') + '?id=' + gym.id;

  return (
    <div style={{ fontFamily: FONT, maxWidth: 1080, padding: '2px 0 40px' }}>

      {/* ── PAGE HEADER ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: '-0.03em' }}>{gym.name}</h2>
            {gym.verified && <BadgeCheck style={{ width: 16, height: 16, color: C.cyan }} />}
          </div>
          <p style={{ fontSize: 12, color: C.t3, margin: 0, lineHeight: 1.5, maxWidth: 480 }}>
            How your gym appears and performs for members — strengths, gaps, and what matters most.
          </p>
        </div>
        <Link to={previewUrl} target="_blank" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: C.card, border: `1px solid ${C.brd}`, color: C.t2, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <ExternalLink style={{ width: 11, height: 11 }} /> Member View
          </button>
        </Link>
      </div>

      {/* ── METRIC CARDS ──────────────────────────────────── */}
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

      {/* ── INSIGHT ───────────────────────────────────────── */}
      <InsightBar text={insight} />

      {/* ── PROFILE DIAGNOSIS LABEL ───────────────────────── */}
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        Profile Diagnosis
      </div>

      {/* ══ TWO-COLUMN GRID ════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 10, marginBottom: 10 }}>

        {/* ── LEFT: FIRST IMPRESSION ──────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionHeader
            title="First Impression"
            subtitle="What a member sees the moment they find your gym."
          />

          {/* Logo + Cover Image — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ItemCard
              title="Logo / Profile Photo"
              score={logoScore}
              microcopy={hasLogo ? 'Shown on your gym card and header.' : 'No logo reduces recognition at first glance.'}
              onClick={() => openModal('logo')}
            >
              <LogoVisual logoUrl={gym.logo_url} />
            </ItemCard>

            <ItemCard
              title="Cover Image"
              score={coverScore}
              microcopy={hasHero ? 'Visible across your gym page.' : 'No cover makes your page feel empty.'}
              onClick={() => openModal('heroPhoto')}
            >
              <CoverVisual imageUrl={gym.image_url} />
            </ItemCard>
          </div>

          {/* Photo Gallery — full width */}
          <ItemCard
            title="Photo Gallery"
            score={galleryScore}
            microcopy={
              galleryCount >= 5 ? `Rich gallery with ${galleryCount}+ photos.`
              : galleryCount > 0 ? `${galleryCount} photo${galleryCount !== 1 ? 's' : ''} — more variety builds confidence.`
              : 'No gallery. Members can\'t visualise the space before visiting.'
            }
            onClick={() => openModal('photos')}
          >
            <GalleryVisual gallery={gym.gallery} />
          </ItemCard>
        </div>

        {/* ── RIGHT: DISCOVERY ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionHeader
            title="Discovery"
            subtitle="What makes your gym distinct — and searchable."
          />

          {/* Keywords & Tags / Map */}
          <ItemCard
            title="Keywords & Tags"
            score={mapScore}
            microcopy="Populates, e.g. hours, address, address."
            onClick={() => openModal('editInfo')}
          >
            <MapVisual gym={gym} />
          </ItemCard>

          {/* Social Media Links */}
          <ItemCard
            title="Social Media Links"
            score={socialScore}
            microcopy={hasSocial ? 'Social presence increases discoverability.' : 'No social links. Reduces visibility and trust.'}
            onClick={() => openModal('editInfo')}
          >
            <SocialVisual gym={gym} />
          </ItemCard>

          {/* Coaches & Staff */}
          <ItemCard
            title="Coaches & Staff"
            score={coachesScore}
            microcopy={coaches.length > 0 ? `${coaches.length} coach${coaches.length !== 1 ? 'es' : ''} on your team.` : 'Add coaches to showcase your team.'}
            onClick={() => openModal('coaches')}
          >
            <CoachesVisual coaches={coaches} onManage={() => openModal('coaches')} />
          </ItemCard>
        </div>
      </div>

      {/* ══ FULL-WIDTH SECTIONS BELOW ══════════════════════ */}

      {/* Trust & Clarity */}
      <FullSection
        title="Trust & Clarity"
        subtitle="Information members need to feel confident before joining."
        score={trustScore}
        defaultOpen={trustScore < 100}
      >
        <TrustRow gym={gym} openModal={openModal} />
      </FullSection>

      {/* Amenities */}
      <FullSection
        title="Amenities"
        subtitle="Highlight what members can access and enjoy."
        score={amenitiesScore}
        defaultOpen={amenitiesScore < 100}
      >
        <TagsList
          items={gym.amenities}
          emptyText="No amenities listed. Members can't compare what you offer."
          onClick={() => openModal('amenities')}
        />
      </FullSection>

      {/* Equipment */}
      <FullSection
        title="Equipment"
        subtitle="Help members find the equipment they care about."
        score={equipmentScore}
        defaultOpen={equipmentScore < 100}
      >
        <TagsList
          items={gym.equipment}
          emptyText="No equipment listed. A common reason members choose a competitor."
          onClick={() => openModal('equipment')}
        />
      </FullSection>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', marginTop: 4, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp style={{ width: 14, height: 14, color: C.cyan }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Retention impact</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
            Gyms with complete profiles and active communities retain members <span style={{ color: C.t2, fontWeight: 600 }}>2.3× longer</span> on average.
          </div>
        </div>
        <Link to={previewUrl} target="_blank" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.cyan, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            See member view <ExternalLink style={{ width: 11, height: 11 }} />
          </span>
        </Link>
      </div>

    </div>
  );
}
