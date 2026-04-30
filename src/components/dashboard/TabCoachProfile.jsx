/**
 * TabCoachProfile — mirrors TabGymProfile design quality, tailored for coaches.
 * Same color tokens, density, hover patterns, sidebar, and interaction style.
 * Every section remapped to coach context: bio, pricing, specialties,
 * certifications, availability, gallery, client retention, and online presence.
 */
import React, { useState } from 'react';
import {
  Image, ExternalLink, Zap, TrendingUp, BadgeCheck,
  ChevronDown, ChevronUp,
  Instagram, Facebook, Twitter, Globe, MapPin,
  Star, GraduationCap, Plus, Pencil,
  CheckCircle2, AlertCircle, Lightbulb, Bell,
  Camera, Award, MessageCircle, Dumbbell, Clock,
  FileText, Target, Activity, Shield, CreditCard,
  Users, UserCheck, Flame,
} from 'lucide-react';
import { createPageUrl } from '../../utils';

/* ─── TOKENS (identical to TabGymProfile) ───────────────────────── */
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
const FONT     = "'DM Sans','Segoe UI',system-ui,sans-serif";
const SHADOW   = '0 0 10px rgba(77,127,255,0.22), 0 2px 6px rgba(77,127,255,0.12)';
const GRAD_BTN = { background: '#2563eb', border: 'none', color: '#fff' };

/* ─── HELPERS ────────────────────────────────────────────────────── */
function qualityState(score) {
  if (score >= 75) return { label: 'Strong',          color: C.green, dim: C.greenDim, brd: C.greenBrd };
  if (score >= 40) return { label: 'Needs attention', color: C.amber, dim: C.amberDim, brd: C.amberBrd };
  return           { label: 'Weak',                   color: C.red,   dim: C.redDim,   brd: C.redBrd   };
}

function buildInsight({
  profileScore, retentionScore, sessionsWeek, hasBio, hasPhoto,
  hasCover, galleryCount, hasPricing, certCount,
  activeClients, totalClients,
}) {
  const signals = [
    { cond: !hasPhoto && !hasCover,
      msg: "No photos added yet — clients are far less likely to book a coach they can't see." },
    { cond: !hasBio && !hasPricing,
      msg: "No bio and no pricing — clients can't understand who you are or what working with you costs." },
    { cond: !hasBio,
      msg: "Your bio is missing — clients want to know your story and approach before they commit." },
    { cond: !hasPricing,
      msg: "Pricing is missing — the #1 reason potential clients don't enquire." },
    { cond: galleryCount < 3 && retentionScore < 40,
      msg: `Only ${galleryCount} photo${galleryCount !== 1 ? 's' : ''} and ${retentionScore}% client retention — both your profile and client engagement need attention.` },
    { cond: certCount === 0,
      msg: "No certifications listed — credentials are a top trust signal for new clients scanning your profile." },
    { cond: sessionsWeek === 0 && retentionScore < 50,
      msg: `No sessions logged this week and ${retentionScore}% client retention — consider reaching out to inactive clients now.` },
    { cond: profileScore >= 70 && sessionsWeek < 3,
      msg: `Your profile looks solid at ${profileScore}%, but session volume is low — active coaches retain clients 2× longer.` },
    { cond: profileScore >= 70 && retentionScore >= 60,
      msg: `Your coaching profile is in strong shape — ${activeClients} of ${totalClients} clients active this week. Consistency is the only lever left.` },
    { cond: true,
      msg: "A few more improvements across your photos, bio, and credentials will noticeably boost client confidence." },
  ];
  return (signals.find(s => s.cond) || signals[signals.length - 1]).msg;
}

/* ─── STATUS BADGE ──────────────────────────────────────────────── */
function StatusBadge({ score }) {
  const s = qualityState(score);
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 9px',
      borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap',
      color: s.color, background: s.dim, border: `1px solid ${s.brd}`,
    }}>
      {s.label}
    </span>
  );
}

function ScoreBar() { return null; }

/* ─── STAT CELL ─────────────────────────────────────────────────── */
function StatCell({ label, value, color, onClick, borderRight }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', background: C.sidebar,
        cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s',
        borderRight: borderRight ? `1px solid ${C.brd}` : 'none',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = C.cyanDim)}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = C.sidebar)}
    >
      <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || C.cyan, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ─── ITEM CARD ─────────────────────────────────────────────────── */
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
          {onClick && (
            <Pencil style={{ width: 10, height: 10, color: hovered ? C.cyan : 'transparent', flexShrink: 0, transition: 'color 0.15s' }} />
          )}
        </div>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <ScoreBar score={score} />
    </div>
  );
}

/* ─── FULL-WIDTH COLLAPSIBLE SECTION ────────────────────────────── */
function FullSection({ title, subtitle, score, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 9 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', padding: '12px 16px',
          background: 'transparent', border: 'none',
          borderBottom: open ? `1px solid ${C.brd}` : 'none',
          cursor: 'pointer', gap: 10, textAlign: 'left',
          fontFamily: FONT, transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <StatusBadge score={score} />
        {open
          ? <ChevronUp  style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
        }
      </button>
      {open && children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VISUAL COMPONENTS (coach-specific)
═══════════════════════════════════════════════════════════════ */

/* Profile photo — prominent circular avatar */
function CoachPhotoVisual({ avatarUrl }) {
  return (
    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${C.brd}` }}>
      {avatarUrl
        ? (
          <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.brd2}`, boxShadow: '0 0 0 5px rgba(77,127,255,0.07)' }}>
            <img src={avatarUrl} alt="Coach" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: C.card2, border: `2px dashed ${C.brd2}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Camera style={{ width: 20, height: 20, color: C.t3 }} />
            <span style={{ fontSize: 9, color: C.t3, fontWeight: 600 }}>Add photo</span>
          </div>
        )
      }
    </div>
  );
}

/* Cover / banner image */
function CoverVisual({ imageUrl }) {
  return (
    <div style={{ height: 140, borderTop: `1px solid ${C.brd}`, overflow: 'hidden' }}>
      {imageUrl
        ? <img src={imageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Image style={{ width: 22, height: 22, color: C.t3 }} />
            <span style={{ fontSize: 11, color: C.t3 }}>No cover image</span>
          </div>
        )
      }
    </div>
  );
}

/* Results & training photo gallery */
function GalleryVisual({ gallery }) {
  const photos   = (gallery || []).slice(0, 8).map(g => g.url || g);
  const needsMore = photos.length < 3;
  const tiles    = [...photos];
  if (needsMore) tiles.push('__add__');
  const display  = tiles.slice(0, 6);
  const overflow = photos.length > 6 ? photos.length - 6 : 0;

  if (photos.length === 0) {
    return (
      <div style={{ height: 148, borderTop: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.015)' }}>
        <Camera style={{ width: 22, height: 22, color: C.t3 }} />
        <span style={{ fontSize: 11, color: C.t3 }}>Add training & transformation photos</span>
      </div>
    );
  }

  return (
    <div style={{ height: 148, borderTop: `1px solid ${C.brd}`, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(display.length, 3)}, 1fr)`, gridTemplateRows: display.length > 3 ? '1fr 1fr' : '1fr', gap: 2, height: '100%' }}>
        {display.map((src, i) => {
          if (src === '__add__') {
            return (
              <div key="add" style={{ background: 'rgba(77,127,255,0.06)', border: '1px dashed rgba(77,127,255,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
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

/* Location + weekly availability grid */
function AvailabilityVisual({ coach }) {
  const hasLocation   = coach.location || coach.city || coach.gym_name;
  const availability  = coach.availability || {};
  const hasSchedule   = Object.keys(availability).length > 0;
  const DAYS          = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SLOTS         = ['morning', 'afternoon', 'evening'];
  const SLOT_COLORS   = { morning: '#60a5fa', afternoon: C.cyan, evening: '#818cf8' };
  const displayAddr   = [coach.gym_name, coach.city || coach.location].filter(Boolean).join(' · ');

  return (
    <div style={{ borderTop: `1px solid ${C.brd}` }}>
      {hasLocation && (
        <div style={{ padding: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayAddr}
          </span>
        </div>
      )}
      <div style={{ padding: '10px 14px 14px' }}>
        {hasSchedule ? (
          <>
            <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
              {DAYS.map(day => {
                const key   = day.toLowerCase();
                const slots = availability[key] || [];
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ fontSize: 8, color: C.t3, fontWeight: 600, marginBottom: 1 }}>{day}</div>
                    {SLOTS.map(slot => (
                      <div key={slot}
                        title={`${day} ${slot}`}
                        style={{
                          width: '100%', height: 13, borderRadius: 3,
                          background: slots.includes(slot) ? SLOT_COLORS[slot] : C.card2,
                          border: `1px solid ${slots.includes(slot) ? SLOT_COLORS[slot] + '60' : C.brd}`,
                          opacity: slots.includes(slot) ? 0.85 : 0.35,
                          transition: 'opacity 0.15s',
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {Object.entries(SLOT_COLORS).map(([slot, color]) => (
                <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity: 0.8 }} />
                  <span style={{ fontSize: 9, color: C.t3, textTransform: 'capitalize' }}>{slot}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ height: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px dashed ${C.brd}` }}>
            <Clock style={{ width: 16, height: 16, color: C.t3 }} />
            <span style={{ fontSize: 10.5, color: C.t3 }}>Add your availability schedule</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* Certifications preview — horizontal chip scroll */
function CertificationsPreview({ certifications, onManage }) {
  const certs = certifications || [];
  return (
    <div style={{ borderTop: `1px solid ${C.brd}`, padding: '10px 14px 12px' }}>
      {certs.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `1.5px dashed ${C.brd2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap style={{ width: 14, height: 14, color: C.t3 }} />
          </div>
          <span style={{ fontSize: 11.5, color: C.t3 }}>No certifications added yet</span>
          <button onClick={onManage} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', flexShrink: 0, ...GRAD_BTN }}>
            + Add
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
          {certs.slice(0, 4).map((cert, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}`, flexShrink: 0 }}>
              <Award style={{ width: 11, height: 11, color: C.amber, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t1, whiteSpace: 'nowrap' }}>
                {typeof cert === 'object' ? cert.name || cert.label : cert}
              </span>
            </div>
          ))}
          {certs.length > 4 && (
            <span style={{ fontSize: 11, color: C.t3 }}>+{certs.length - 4} more</span>
          )}
          <div
            onClick={onManage}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: `1px dashed ${C.brd2}`, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.background = C.cyanDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.background = 'transparent'; }}
          >
            <Plus style={{ width: 11, height: 11, color: C.t3 }} />
            <span style={{ fontSize: 11, color: C.t3, whiteSpace: 'nowrap' }}>Add</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Social links — same pattern as gym profile */
function SocialVisual({ coach }) {
  const links = [
    { key: 'instagram_url', Icon: Instagram, label: 'Instagram', color: '#a855f7' },
    { key: 'facebook_url',  Icon: Facebook,  label: 'Facebook',  color: '#60a5fa' },
    { key: 'twitter_url',   Icon: Twitter,   label: 'Twitter',   color: '#38bdf8' },
    { key: 'website_url',   Icon: Globe,     label: 'Website',   color: C.cyan    },
  ];
  const present = links.filter(l => coach[l.key]);
  const missing  = links.filter(l => !coach[l.key]);

  return (
    <div style={{ padding: '10px 14px 14px' }}>
      {present.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: missing.length > 0 ? 10 : 0 }}>
          {present.map(l => (
            <a key={l.key} href={coach[l.key]} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 7, background: C.card2, border: `1px solid ${C.brd}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.brd2}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}
              >
                <l.Icon style={{ width: 12, height: 12, color: l.color }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t2 }}>{l.label}</span>
              </div>
            </a>
          ))}
        </div>
      )}
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

/* Generic tag list (specialties, certifications full list) */
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

/* ─── TRUST ROW: Bio + Pricing ──────────────────────────────────── */
function TrustRow({ coach, openModal }) {
  const bioScore     = coach.bio ? 100 : 0;
  const pricingScore = (coach.hourly_rate || coach.pricing) ? 100 : 0;

  const pricingDisplay = coach.hourly_rate
    ? `£${coach.hourly_rate}/hr`
    : coach.pricing || null;

  const items = [
    {
      label: 'Bio & Story',
      score: bioScore,
      desc:  coach.bio
        ? `${coach.bio.slice(0, 90)}${coach.bio.length > 90 ? '…' : ''}`
        : "No bio — clients want to know who you are and your philosophy before they commit.",
      action: () => openModal('editBio'),
      Icon: FileText,
    },
    {
      label: 'Pricing & Rates',
      score: pricingScore,
      desc:  pricingDisplay
        ? `Listed at ${pricingDisplay} — visible before clients enquire.`
        : 'Missing pricing creates uncertainty and reduces enquiry conversion.',
      action: () => openModal('pricing'),
      Icon: CreditCard,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
      {items.map((item, i) => {
        const s  = qualityState(item.score);
        const Ic = item.Icon;
        return (
          <div
            key={i}
            onClick={item.action}
            style={{ padding: '13px 18px', cursor: 'pointer', borderRight: i === 0 ? `1px solid ${C.brd}` : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Ic style={{ width: 12, height: 12, color: C.t3 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{item.label}</span>
              </div>
              <StatusBadge score={item.score} />
            </div>
            <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55 }}>{item.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── EXPERIENCE ROW: Years + Rating ───────────────────────────── */
function ExperienceRow({ coach, openModal }) {
  const expScore    = coach.years_experience ? 100 : 0;
  const ratingScore = coach.rating ? 100 : 0;

  const items = [
    {
      label: 'Years of Experience',
      score: expScore,
      desc:  coach.years_experience
        ? `${coach.years_experience} year${coach.years_experience !== 1 ? 's' : ''} coaching — adds depth to your profile.`
        : 'Add your years of experience to establish authority.',
      action: () => openModal('editBio'),
      Icon: Shield,
    },
    {
      label: 'Rating & Reviews',
      score: ratingScore,
      desc:  coach.rating
        ? `${coach.rating}/5 avg from ${coach.review_count || 0} review${(coach.review_count || 0) !== 1 ? 's' : ''} — social proof drives bookings.`
        : 'No reviews yet — ask your most satisfied clients to leave one.',
      action: () => openModal('reviews'),
      Icon: Star,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderTop: `1px solid ${C.brd}` }}>
      {items.map((item, i) => {
        const Ic = item.Icon;
        return (
          <div
            key={i}
            onClick={item.action}
            style={{ padding: '13px 18px', cursor: 'pointer', borderRight: i === 0 ? `1px solid ${C.brd}` : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Ic style={{ width: 12, height: 12, color: C.t3 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{item.label}</span>
              </div>
              <StatusBadge score={item.score} />
            </div>
            <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55 }}>{item.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── TIPS PANEL ────────────────────────────────────────────────── */
const ALL_TIPS = [
  {
    id: 't1',
    icon: Bell,
    color: '#4d7fff',
    category: 'Retention',
    title: 'Re-engage inactive clients with a personal check-in',
    summary: 'Clients who receive a check-in within 7 days of going quiet return at 3× the rate.',
    detail: `Filter your client list by "Last active > 7 days" and send a short personal message — use their name and reference their specific goal. Avoid templates. A genuine "Hey {name}, just checking in — how's your progress feeling?" outperforms a template by 40%. Set aside 10 minutes every Monday morning to do this consistently.`,
    relevantIf: (coach, ctx) => ctx ? (ctx.activeClients / Math.max(ctx.totalClients, 1)) < 0.5 : true,
  },
  {
    id: 't2',
    icon: Camera,
    color: '#a855f7',
    category: 'First Impression',
    title: 'Add transformation & action photos to your gallery',
    summary: 'Coaches with 3+ gallery photos receive 60% more profile enquiries.',
    detail: `Upload a mix: a clear headshot, action shots of you coaching, and (with client permission) transformation results. Before/after photos are the single most persuasive asset for new client conversion. Phone photos in good light work perfectly well. Aim for at least 6 total. Update your gallery seasonally to keep the profile feeling current and active.`,
    relevantIf: (coach) => (coach.gallery?.length || 0) < 3,
  },
  {
    id: 't3',
    icon: Award,
    color: '#f59e0b',
    category: 'Trust',
    title: 'List your certifications to establish credibility fast',
    summary: 'Certifications increase booking conversion by up to 45% for new clients.',
    detail: `Add every relevant qualification: PT certification body (e.g. NASM, REPS, ACE), nutrition, mobility, sport-specific, or specialist disciplines. Include the issuing body for maximum credibility — "NASM CPT" is more trustworthy than just "Personal Trainer". Even older certs are worth listing. Clients use credentials as a shortcut to trust before they've met you.`,
    relevantIf: (coach) => (coach.certifications?.length || 0) < 2,
  },
  {
    id: 't4',
    icon: MessageCircle,
    color: '#22c55e',
    category: 'Community',
    title: 'Post training content at least twice a week',
    summary: 'Coaches who post regularly retain clients 2× longer than those who rarely post.',
    detail: `You don't need polished video — a well-written training tip, a form cue with a short clip, or a client milestone post outperforms hours of produced content. Aim for 2–3 posts per week. Mix education, social proof, and motivation. Consistency matters more than production quality, especially in the early stages of building your profile.`,
    relevantIf: (coach, ctx) => ctx ? ctx.sessionsWeek < 2 : true,
  },
  {
    id: 't5',
    icon: Target,
    color: '#14b8a6',
    category: 'Conversion',
    title: 'Set your pricing to remove client hesitation',
    summary: 'Missing pricing is the #1 reason potential clients leave a coach profile without enquiring.',
    detail: `Add your session rate to your profile. Even a range (e.g. "£50–£80/session") builds confidence. Clients who see pricing before enquiring are far more likely to book because they've already self-qualified. If you offer packages (5-session block, monthly retainer, online plans), list those too — it signals structure and reduces the friction of the first conversation.`,
    relevantIf: (coach) => !coach.hourly_rate && !coach.pricing,
  },
  {
    id: 't6',
    icon: FileText,
    color: '#8b5cf6',
    category: 'Trust',
    title: 'Write a compelling bio to connect before they meet you',
    summary: 'A personal bio increases enquiry rates by 38% vs profiles with no bio.',
    detail: `Your bio should answer: Who are you? What's your training philosophy? Who do you work best with? What results do your clients achieve? Keep it under 200 words — clients want to feel like they know you, not read an essay. Lead with your strongest credential or personal story. End with who your ideal client is. Write the way you'd speak to a new client in person, not how you'd write a CV.`,
    relevantIf: (coach) => !coach.bio,
  },
  {
    id: 't7',
    icon: Star,
    color: '#f59e0b',
    category: 'Social Proof',
    title: 'Ask your best clients to leave a review',
    summary: 'Profiles with 3+ reviews receive 52% more first enquiries than those without.',
    detail: `Reach out to your 3–5 most satisfied clients directly and ask for a short review. Make it easy — send them a direct link and suggest they focus on: what their goal was, what changed, and what they'd tell a friend considering working with you. Timing matters: ask immediately after a milestone, not at a random moment. One genuine review is worth more than ten generic ones.`,
    relevantIf: (coach) => !coach.rating || (coach.review_count || 0) < 3,
  },
  {
    id: 't8',
    icon: Activity,
    color: '#ff4d6d',
    category: 'Profile',
    title: 'List your specialties to attract the right clients',
    summary: 'Specific specialties reduce "wrong fit" churn by helping clients self-select before booking.',
    detail: `Add everything you coach: strength training, HIIT, mobility, nutrition, pre/postnatal, sports-specific, body composition. Be specific — "Olympic weightlifting" is more compelling than "strength training". Clients with niche goals search for specialists. A complete specialties list reduces disappointment from clients who expected something different, which is one of the most common causes of early cancellation.`,
    relevantIf: (coach) => (coach.specialties?.length || 0) < 3,
  },
];

const TIP_BASE_SCORES = { t1: 70, t2: 80, t3: 75, t4: 65, t5: 90, t6: 85, t7: 72, t8: 68 };

function TipsPanel({ profileScore, trustScore, coach, activeClients, totalClients, sessionsWeek }) {
  const [expanded, setExpanded]   = useState(false);
  const [openTipId, setOpenTipId] = useState(null);

  const tips = ALL_TIPS.slice().sort((a, b) => {
    const aR = a.relevantIf(coach, { activeClients, totalClients, sessionsWeek }) ? 1.5 : 1.0;
    const bR = b.relevantIf(coach, { activeClients, totalClients, sessionsWeek }) ? 1.5 : 1.0;
    return (TIP_BASE_SCORES[b.id] * bR) - (TIP_BASE_SCORES[a.id] * aR);
  });

  const shown = expanded ? tips : tips.slice(0, 3);

  return (
    <div style={{ padding: '14px 16px 24px', borderTop: `1px solid ${C.brd}`, marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Lightbulb style={{ width: 13, height: 13, color: C.amber, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, flex: 1 }}>Tips & Recommendations</span>
        <span style={{ fontSize: 10, color: C.t3 }}>{tips.length} tips</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {shown.map(tip => {
          const isOpen     = openTipId === tip.id;
          const isRelevant = tip.relevantIf(coach, { activeClients, totalClients, sessionsWeek });
          return (
            <div
              key={tip.id}
              style={{
                borderRadius: 9,
                background: isOpen ? 'rgba(255,255,255,0.03)' : C.card,
                border: `1px solid ${isOpen ? tip.color + '40' : C.brd}`,
                overflow: 'hidden', transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <button
                onClick={() => setOpenTipId(isOpen ? null : tip.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 11px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: `${tip.color}14`, border: `1px solid ${tip.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <tip.icon style={{ width: 12, height: 12, color: tip.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: C.t1, lineHeight: 1.3 }}>{tip.title}</span>
                    {isRelevant && (
                      <span style={{ fontSize: 8.5, fontWeight: 700, color: tip.color, background: `${tip.color}14`, border: `1px solid ${tip.color}30`, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Relevant
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.t3, lineHeight: 1.4 }}>{tip.summary}</div>
                </div>
                <ChevronDown style={{ width: 11, height: 11, color: C.t3, flexShrink: 0, marginTop: 2, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {isOpen && (
                <div style={{ padding: '0 11px 12px 46px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: `${tip.color}cc`, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {tip.category}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.7 }}>
                    {tip.detail}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', marginTop: 8, padding: '8px 0', background: 'transparent', border: `1px solid ${C.brd}`, borderRadius: 8, color: C.t3, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'border-color 0.15s, color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.cyan; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}
      >
        {expanded ? 'Show fewer tips' : `Show ${tips.length - 3} more tips`}
        <ChevronDown style={{ width: 11, height: 11, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
    </div>
  );
}

/* ─── RIGHT SIDEBAR ─────────────────────────────────────────────── */
function ProfileSidebar({
  profileScore, retentionScore, trustScore, discoveryScore,
  openModal, coach, activeClients, totalClients,
  sessionsWeek, retentionTrend, coachSessions,
}) {
  const retentionState = qualityState(retentionScore);

  const galleryCount = coach.gallery?.length || 0;
  const allChecks = [
    { label: 'Profile photo',         done: !!coach.avatar_url,                              action: () => openModal('photo'),          impact: 10 },
    { label: 'Cover image',           done: !!coach.cover_url,                               action: () => openModal('cover'),          impact: 7  },
    { label: 'Gallery photos (3+)',   done: galleryCount >= 3,                               action: () => openModal('photos'),         impact: galleryCount === 0 ? 12 : 6 },
    { label: 'Bio written',           done: !!coach.bio,                                     action: () => openModal('editBio'),        impact: 9  },
    { label: 'Pricing / rates set',   done: !!(coach.hourly_rate || coach.pricing),          action: () => openModal('pricing'),        impact: 13 },
    { label: 'Specialties listed',    done: (coach.specialties?.length || 0) > 0,            action: () => openModal('specialties'),    impact: 6  },
    { label: 'Certifications added',  done: (coach.certifications?.length || 0) > 0,         action: () => openModal('certifications'), impact: 8  },
  ];

  const checks = [
    ...allChecks.filter(c => !c.done).sort((a, b) => b.impact - a.impact),
    ...allChecks.filter(c =>  c.done).sort((a, b) => a.label.localeCompare(b.label)),
  ];
  const doneCount = allChecks.filter(c => c.done).length;

  const avgSessionsPerClient = coachSessions.length >= 5 && totalClients >= 3
    ? Math.round(coachSessions.length / totalClients)
    : null;
  const profileComplete = profileScore >= 70;

  return (
    <div style={{ width: 244, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', fontFamily: FONT, position: 'sticky', top: 0, maxHeight: '100vh', overflowY: 'auto', scrollbarWidth: 'none' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Profile Overview</div>
      </div>

      {/* Stat grid — 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.brd, borderBottom: `1px solid ${C.brd}` }}>

        {/* Retention */}
        <div style={{ padding: '12px 14px', background: C.sidebar, borderRight: `1px solid ${C.brd}` }}>
          <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Retention</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: retentionState.color, lineHeight: 1 }}>{retentionScore}%</div>
          {Math.abs(retentionTrend) > 0 && (
            <div style={{ fontSize: 9.5, fontWeight: 700, color: retentionTrend > 0 ? C.green : C.red, marginTop: 3 }}>
              {retentionTrend > 0 ? `+${retentionTrend}` : retentionTrend} this week
            </div>
          )}
        </div>

        {/* Sessions this week */}
        <div style={{ padding: '12px 14px', background: C.sidebar }}>
          <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Sessions / wk</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: sessionsWeek >= 5 ? C.green : sessionsWeek >= 2 ? C.amber : C.red, lineHeight: 1 }}>
            {sessionsWeek}
          </div>
        </div>

        <StatCell label="Trust & clarity" value={trustScore + '%'}   color={qualityState(trustScore).color}     borderRight />
        <StatCell label="Discovery"       value={discoveryScore + '%'} color={qualityState(discoveryScore).color} />
      </div>

      {/* Profile Checklist */}
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
                : <AlertCircle  style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
              }
              <span style={{ fontSize: 11.5, color: item.done ? C.t2 : C.t1, fontWeight: item.done ? 400 : 500, flex: 1, textDecoration: item.done ? 'line-through' : 'none', textDecorationColor: C.t3 }}>
                {item.label}
              </span>
              {!item.done && <Plus style={{ width: 10, height: 10, color: C.cyan, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Client impact callout */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ padding: '12px 14px', borderRadius: 9, background: C.cyanDim, border: `1px solid ${C.cyanBrd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <TrendingUp style={{ width: 13, height: 13, color: C.cyan, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.t1 }}>Client impact</span>
          </div>
          <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.5 }}>
            {avgSessionsPerClient !== null ? (
              <>
                Your clients average{' '}
                <span style={{ color: C.t1, fontWeight: 600 }}>
                  {avgSessionsPerClient} session{avgSessionsPerClient !== 1 ? 's' : ''}
                </span>{' '}
                — {profileComplete
                  ? 'your complete profile is helping drive consistent bookings.'
                  : 'completing your profile could meaningfully increase this number.'}
              </>
            ) : (
              <>
                Complete profiles attract new clients{' '}
                <span style={{ color: C.t1, fontWeight: 600 }}>2.4× faster</span> on average.
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tips & Recommendations */}
      <TipsPanel
        profileScore={profileScore}
        trustScore={trustScore}
        coach={coach}
        activeClients={activeClients}
        totalClients={totalClients}
        sessionsWeek={sessionsWeek}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function TabCoachProfile({
  coach,
  openModal,
  clients    = [],
  sessions   = [],
  posts      = [],
}) {
  if (!coach) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: C.t3, fontSize: 13, fontFamily: FONT }}>
        No coach selected
      </div>
    );
  }

  /* ── Derived data ─────────────────────────────────────────────── */
  const galleryCount     = coach.gallery?.length       || 0;
  const specialtiesCount = coach.specialties?.length   || 0;
  const certCount        = coach.certifications?.length || 0;
  const hasPhoto         = !!coach.avatar_url;
  const hasCover         = !!coach.cover_url;
  const hasBio           = !!coach.bio;
  const hasPricing       = !!(coach.hourly_rate || coach.pricing);
  const hasLocation      = !!(coach.location || coach.city);
  const socialPlatforms  = [coach.instagram_url, coach.facebook_url, coach.twitter_url, coach.website_url].filter(Boolean).length;
  const hasAvailability  = coach.availability && Object.keys(coach.availability).length > 0;

  const MS_WEEK    = 7  * 24 * 60 * 60 * 1000;
  const now        = Date.now();
  const weekAgo     = now - MS_WEEK;
  const twoWeeksAgo = now - 2 * MS_WEEK;

  const coachSessions = sessions.filter(s => s.coach_id === coach.id);

  /* Active clients — had a session in the last 7 days */
  const recentClientIds = new Set(
    coachSessions
      .filter(s => new Date(s.session_date || s.created_date).getTime() > weekAgo)
      .map(s => s.client_id || s.user_id)
  );
  const activeClients = recentClientIds.size;

  /* Previous week */
  const prevWeekClientIds = new Set(
    coachSessions
      .filter(s => {
        const t = new Date(s.session_date || s.created_date).getTime();
        return t > twoWeeksAgo && t <= weekAgo;
      })
      .map(s => s.client_id || s.user_id)
  );
  const retentionTrend = activeClients - prevWeekClientIds.size;

  const sessionsWeek = coachSessions.filter(s =>
    new Date(s.session_date || s.created_date || 0).getTime() > weekAgo
  ).length;

  const totalClients = clients.length || 1;

  /* Trend-adjusted retention score */
  let retentionScore = Math.round((activeClients / totalClients) * 100);
  if (retentionTrend < 0) retentionScore = Math.max(0, retentionScore - Math.min(10, Math.abs(retentionTrend) * 2));
  else if (retentionTrend > 0) retentionScore = Math.min(100, retentionScore + Math.min(5, retentionTrend));

  /* ── Graduated profile scores ─────────────────────────────────── */
  const photoScore      = hasPhoto ? 100 : 0;
  const coverScore      = hasCover ? 100 : 0;
  const galleryScore    = galleryCount >= 6 ? 100 : galleryCount >= 3 ? 75 : galleryCount >= 1 ? 40 : 0;
  const bioScore        = hasBio    ? 100 : 0;
  const pricingScore    = hasPricing ? 100 : 0;
  const availScore      = (hasLocation || hasAvailability) ? (hasLocation && hasAvailability ? 100 : 60) : 0;
  const certScore       = certCount  >= 4 ? 100 : certCount  === 3 ? 80 : certCount  === 2 ? 60 : certCount  >= 1 ? 35 : 0;
  const specialtiesScore = specialtiesCount >= 8 ? 100 : specialtiesCount >= 5 ? 80 : specialtiesCount >= 3 ? 60 : specialtiesCount >= 1 ? 30 : 0;
  const socialScore     = socialPlatforms >= 3 ? 100 : socialPlatforms === 2 ? 70 : socialPlatforms === 1 ? 40 : 0;

  const impressionScore = Math.round((photoScore + coverScore + galleryScore) / 3);
  const trustScore      = Math.round((bioScore + pricingScore) / 2);
  const discoveryScore  = Math.round((availScore + socialScore + certScore) / 3);
  const profileScore    = Math.round((impressionScore + trustScore + discoveryScore) / 3);

  /* Blended coach score (profile-weighted when client base is small) */
  const profileWeight = totalClients < 5 ? 0.85 : totalClients < 20 ? 0.70 : 0.55;
  const engWeight     = 1 - profileWeight;
  const overallScore  = Math.round(profileScore * profileWeight + retentionScore * engWeight);

  const insight = buildInsight({
    profileScore, retentionScore, sessionsWeek, hasBio, hasPhoto,
    hasCover, galleryCount, hasPricing, certCount,
    activeClients, totalClients,
  });

  const previewUrl = createPageUrl('CoachProfile') + '?id=' + coach.id;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>

        {/* Page header */}
        <div style={{ padding: '4px 16px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                {coach.name}
              </h1>
              {coach.verified && <BadgeCheck style={{ width: 16, height: 16, color: C.cyan }} />}
            </div>
            <p style={{ fontSize: 12, color: C.t3, margin: '2px 0 0', lineHeight: 1.5 }}>
              How your coaching profile appears and performs — strengths, gaps, and what to fix next.
            </p>
          </div>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'opacity 0.15s', ...GRAD_BTN }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <ExternalLink style={{ width: 11, height: 11 }} /> Client View
            </button>
          </a>
        </div>

        {/* Insight bar */}
        <div style={{ margin: '12px 4px 12px 0', padding: '10px 14px', borderRadius: 4, background: 'rgba(77,127,255,0.11)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap style={{ width: 12, height: 12, color: C.cyan, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#93c5fd' }}>{insight}</span>
        </div>

        {/* Body */}
        <div style={{ padding: '0 16px 32px 4px' }}>

          <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 9 }}>
            Profile Diagnosis
          </div>

          {/* ── 2-col grid: First Impression + Credibility ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 9, marginBottom: 9, alignItems: 'stretch' }}>

            {/* LEFT — First Impression */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
                First Impression <span style={{ color: C.t3, fontWeight: 400 }}>— What a client sees when they find your profile</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <ItemCard
                  title="Profile Photo"
                  score={photoScore}
                  microcopy={hasPhoto ? 'Your face is your brand — looking great.' : 'Clients are less likely to book without seeing you.'}
                  onClick={() => openModal('photo')}
                >
                  <CoachPhotoVisual avatarUrl={coach.avatar_url} />
                </ItemCard>

                <ItemCard
                  title="Cover Image"
                  score={coverScore}
                  microcopy={hasCover ? 'A strong banner sets the tone for your page.' : 'A cover image makes your profile feel professional.'}
                  onClick={() => openModal('cover')}
                >
                  <CoverVisual imageUrl={coach.cover_url} />
                </ItemCard>
              </div>

              <ItemCard
                title="Results & Training Gallery"
                score={galleryScore}
                flex={1}
                microcopy={
                  galleryCount >= 6 ? `${galleryCount} photos — great visual proof of your work.`
                  : galleryCount >= 3 ? `${galleryCount} photos — aim for 6+ to maximise trust.`
                  : galleryCount > 0 ? `${galleryCount} photo${galleryCount !== 1 ? 's' : ''} — add more to showcase your results.`
                  : 'No gallery. Add training and transformation photos to build trust.'
                }
                onClick={() => openModal('photos')}
              >
                <GalleryVisual gallery={coach.gallery} />
              </ItemCard>
            </div>

            {/* RIGHT — Credibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>
                Credibility <span style={{ color: C.t3, fontWeight: 400 }}>— What sets you apart and makes you findable</span>
              </div>

              <ItemCard
                title="Location & Availability"
                score={availScore}
                microcopy="Where you work and when you're available."
                onClick={() => openModal('editInfo')}
              >
                <AvailabilityVisual coach={coach} />
              </ItemCard>

              <ItemCard
                title="Certifications & Credentials"
                score={certScore}
                flex={1}
                microcopy={
                  certCount > 0
                    ? `${certCount} qualification${certCount !== 1 ? 's' : ''} listed — builds client trust before enquiry.`
                    : 'Add certifications to prove your expertise.'
                }
                onClick={() => openModal('certifications')}
              >
                <CertificationsPreview
                  certifications={coach.certifications}
                  onManage={() => openModal('certifications')}
                />
              </ItemCard>
            </div>
          </div>

          {/* ── FULL-WIDTH SECTIONS ───────────────────────────── */}

          <FullSection
            title="Trust & Clarity"
            subtitle="What clients need to feel confident before booking you."
            score={trustScore}
            defaultOpen={trustScore < 100}
          >
            <TrustRow coach={coach} openModal={openModal} />
            <ExperienceRow coach={coach} openModal={openModal} />
          </FullSection>

          <FullSection
            title="Training Specialties"
            subtitle="The disciplines and methods you specialise in — helps clients self-select."
            score={specialtiesScore}
            defaultOpen={specialtiesScore < 100}
          >
            <TagsList
              items={coach.specialties}
              emptyText="No specialties listed. Clients filter coaches by discipline — make sure you show up."
              onClick={() => openModal('specialties')}
            />
          </FullSection>

          <FullSection
            title="Certifications & Qualifications"
            subtitle="Your full credentials list — a top trust signal for new clients."
            score={certScore}
            defaultOpen={certScore < 100}
          >
            <TagsList
              items={coach.certifications}
              emptyText="No certifications listed. A key trust signal for prospective clients scanning your profile."
              onClick={() => openModal('certifications')}
            />
          </FullSection>

          <FullSection
            title="Online Presence"
            subtitle="Social links and external profiles that extend your reach and credibility."
            score={socialScore}
            defaultOpen={socialScore < 70}
          >
            <SocialVisual coach={coach} />
          </FullSection>

        </div>
      </div>

      {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
      <ProfileSidebar
        profileScore={profileScore}
        retentionScore={retentionScore}
        trustScore={trustScore}
        discoveryScore={discoveryScore}
        openModal={openModal}
        coach={coach}
        activeClients={activeClients}
        totalClients={totalClients}
        sessionsWeek={sessionsWeek}
        retentionTrend={retentionTrend}
        coachSessions={coachSessions}
      />
    </div>
  );
}