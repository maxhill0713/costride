/**
 * TabGymProfile — Forge Fitness Dashboard
 * Intelligent gym diagnosis. Signal over instructions.
 * Uses exact ContentPage colour tokens (#4d7fff).
 */
import React, { useState } from 'react';
import {
  Image, Camera, Dumbbell, MapPin, Users, Tag,
  ExternalLink, Zap, TrendingUp, TrendingDown,
  Minus, ChevronDown, ChevronUp, BadgeCheck,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

/* ─── TOKENS — exact ContentPage palette ───────────────────── */
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

/* ─── QUALITY STATE ─────────────────────────────────────────── */
function qualityState(score) {
  if (score >= 75) return { label: 'Strong',           color: C.green,  dim: C.greenDim, brd: C.greenBrd };
  if (score >= 40) return { label: 'Needs attention',  color: C.amber,  dim: C.amberDim, brd: C.amberBrd };
  return           { label: 'Weak',                    color: C.red,    dim: C.redDim,   brd: C.redBrd   };
}

function engagementLabel(score) {
  if (score >= 75) return { label: 'High',     color: C.green };
  if (score >= 40) return { label: 'Healthy',  color: C.cyan  };
  return           { label: 'Low',             color: C.red   };
}

function activityLabel(count) {
  if (count >= 5)  return { label: 'High',     color: C.green };
  if (count >= 2)  return { label: 'Moderate', color: C.amber };
  return           { label: 'Low',             color: C.red   };
}

/* ─── METRIC CARD ───────────────────────────────────────────── */
function MetricCard({ label, primary, secondary, color, trend, trendLabel }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? C.green : trend === 'down' ? C.red : C.t3;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {primary}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
        {secondary && <span style={{ fontSize: 11, color: C.t2 }}>{secondary}</span>}
        {trend && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10.5, fontWeight: 700, color: trendColor }}>
            <TrendIcon style={{ width: 10, height: 10 }} />{trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── SUMMARY INSIGHT ───────────────────────────────────────── */
function SummaryInsight({ text }) {
  return (
    <div style={{
      padding: '11px 16px',
      borderRadius: 9,
      background: C.card2,
      border: `1px solid ${C.brd}`,
      borderLeft: `2px solid ${C.cyan}`,
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 18,
    }}>
      <Zap style={{ width: 12, height: 12, color: C.cyan, flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

/* ─── FIELD ROW ─────────────────────────────────────────────── */
function FieldRow({ label, microcopy, score, thumbnail, onClick, last }) {
  const state = qualityState(score);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 18px',
      borderBottom: last ? 'none' : `1px solid ${C.brd}`,
      cursor: onClick ? 'pointer' : 'default',
    }}
      onClick={onClick}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = 'transparent')}
    >
      {/* Thumbnail */}
      {thumbnail !== undefined && (
        <div style={{
          width: 36, height: 36, borderRadius: 7, flexShrink: 0,
          background: C.card2, border: `1px solid ${C.brd}`,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {thumbnail
            ? <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Image style={{ width: 12, height: 12, color: C.t3 }} />
          }
        </div>
      )}

      {/* Label + microcopy */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{label}</div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 2, lineHeight: 1.4 }}>{microcopy}</div>
      </div>

      {/* Quality state */}
      <span style={{
        fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
        color: state.color, background: state.dim, border: `1px solid ${state.brd}`,
        whiteSpace: 'nowrap',
      }}>
        {state.label}
      </span>
    </div>
  );
}

/* ─── SECTION ───────────────────────────────────────────────── */
function Section({ title, subtitle, score, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const state = qualityState(score);

  // Weak sections get a subtle left-border accent
  const needsAttention = score < 40;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${needsAttention ? C.redBrd : C.brd}`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          padding: '13px 18px', background: 'transparent', border: 'none',
          borderBottom: open ? `1px solid ${C.brd}` : 'none',
          cursor: 'pointer', gap: 10, textAlign: 'left',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {/* Score pill */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
          color: state.color, background: state.dim, border: `1px solid ${state.brd}`,
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          {state.label}
        </span>
        {open
          ? <ChevronUp  style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />}
      </button>
      {open && (
        <>
          {children}
          {/* Subtle score bar at bottom */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{
              height: '100%', width: `${score}%`,
              background: state.color, opacity: 0.5,
              transition: 'width 0.6s ease',
              borderRadius: '0 2px 0 0',
            }} />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── SUMMARY COMPUTATION ───────────────────────────────────── */
function buildInsight({ communityScore, engScore, activityCount, hasLogo, hasHero, galleryCount, amenitiesCount, equipmentCount, price }) {
  if (!hasLogo && !hasHero)
    return "Your gym has no photos yet — members won't be able to visualise the space before joining.";
  if (galleryCount < 3 && engScore < 40)
    return "Your profile is sparse and community activity is low — both reduce a member's confidence before joining.";
  if (communityScore >= 70 && activityCount < 2)
    return "Your profile looks solid, but low community activity means members see a quiet gym, not a thriving one.";
  if (communityScore >= 70 && engScore >= 60)
    return "Your gym is in good shape — a consistent post cadence is the next step to sustaining retention.";
  if (!price && amenitiesCount === 0)
    return "Pricing and amenities are missing — this creates uncertainty before a member decides to join.";
  if (engScore >= 60 && communityScore < 50)
    return "Engagement is healthy, but your profile still has gaps that reduce first impressions.";
  return "Your gym is making progress — completing a few more areas will noticeably improve member confidence.";
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function TabGymProfile({ gym, openModal }) {
  if (!gym) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: C.t3, fontSize: 13, fontFamily: FONT }}>
      No gym selected
    </div>
  );

  /* ── Derived values ── */
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

  /* ── Section scores (0–100) ── */
  const impressionScore = Math.round(
    ([hasLogo, hasHero, galleryCount >= 3].filter(Boolean).length / 3) * 100
  );
  const trustScore = Math.round(
    ([hasInfo, hasPricing].filter(Boolean).length / 2) * 100
  );
  const discoveryScore = Math.round(
    ([amenitiesCount > 0, equipmentCount > 0].filter(Boolean).length / 2) * 100
  );

  const communityScore = gym.community_strength || Math.round((impressionScore + trustScore + discoveryScore) / 3);
  const engState       = engagementLabel(rawEngScore);
  const actState       = activityLabel(postsWeek);

  const insight = buildInsight({
    communityScore, engScore: rawEngScore, activityCount: postsWeek,
    hasLogo, hasHero, galleryCount, amenitiesCount, equipmentCount, price: hasPricing,
  });

  const communityState = qualityState(communityScore);
  const previewUrl     = createPageUrl('GymCommunity') + '?id=' + gym.id;

  /* gallery thumbs */
  const galleryThumbs = (gym.gallery || []).slice(0, 3).map(g => g.url || g);

  return (
    <div style={{ fontFamily: FONT, maxWidth: 860, padding: '2px 0 40px' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 12 }}>
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
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 15px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: C.card, border: `1px solid ${C.brd}`, color: C.t2,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <ExternalLink style={{ width: 11, height: 11 }} /> Member View
          </button>
        </Link>
      </div>

      {/* ── METRIC CARDS ────────────────────────────────────── */}
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
          primary={engState.label}
          secondary={rawEngScore > 0 ? `Score ${rawEngScore}` : 'Not enough data'}
          color={engState.color}
          trend={rawEngScore >= 60 ? 'up' : rawEngScore > 0 ? 'down' : null}
          trendLabel={rawEngScore >= 60 ? 'Above average' : rawEngScore > 0 ? 'Below average' : null}
        />

        <MetricCard
          label="Community Activity"
          primary={actState.label}
          secondary={postsWeek === 0 ? 'No posts this week' : postsWeek + ' post' + (postsWeek !== 1 ? 's' : '') + ' this week'}
          color={actState.color}
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

      {/* ── INTELLIGENT SUMMARY ─────────────────────────────── */}
      <SummaryInsight text={insight} />

      {/* ── DIVIDER LABEL ───────────────────────────────────── */}
      <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        Profile Diagnosis
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — FIRST IMPRESSION
      ═══════════════════════════════════════════════════════ */}
      <Section
        title="First Impression"
        subtitle="What a member sees the moment they find your gym."
        score={impressionScore}
      >
        <FieldRow
          label="Logo / Profile Photo"
          microcopy={hasLogo ? 'Shown on your gym card and community header.' : 'No logo reduces recognition and trust at first glance.'}
          score={hasLogo ? 100 : 0}
          thumbnail={gym.logo_url}
          onClick={() => openModal('logo')}
        />
        <FieldRow
          label="Cover Image"
          microcopy={hasHero ? 'Visible across your gym page and discovery.' : 'No cover image makes your gym page feel empty.'}
          score={hasHero ? 100 : 0}
          thumbnail={gym.image_url}
          onClick={() => openModal('heroPhoto')}
        />
        <FieldRow
          last
          label="Photo Gallery"
          microcopy={
            galleryCount >= 5 ? `${galleryCount} photos — gives members a real sense of the space.`
            : galleryCount > 0 ? `${galleryCount} photo${galleryCount !== 1 ? 's' : ''} — more variety builds more confidence.`
            : 'No gallery. Members can\'t visualise the space before visiting.'
          }
          score={galleryCount >= 5 ? 100 : galleryCount > 0 ? 50 : 0}
          thumbnail={galleryThumbs[0] || null}
          onClick={() => openModal('photos')}
        />
      </Section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — TRUST & CLARITY
      ═══════════════════════════════════════════════════════ */}
      <Section
        title="Trust & Clarity"
        subtitle="Information members need to feel confident before joining."
        score={trustScore}
        defaultOpen={trustScore < 80}
      >
        <FieldRow
          label="Gym Info"
          microcopy={hasInfo ? 'Basic info is present — name, address, and contact details visible.' : 'Core gym details are missing. Members can\'t verify what\'s on offer.'}
          score={hasInfo ? 100 : 0}
          onClick={() => openModal('editInfo')}
        />
        <FieldRow
          last
          label="Pricing"
          microcopy={hasPricing ? `Listed at ${gym.price} — visible to members before joining.` : 'Missing pricing creates uncertainty and reduces conversion.'}
          score={hasPricing ? 100 : 0}
          onClick={() => openModal('pricing')}
        />
      </Section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — DISCOVERY
      ═══════════════════════════════════════════════════════ */}
      <Section
        title="Discovery"
        subtitle="What makes your gym distinct — and searchable."
        score={discoveryScore}
        defaultOpen={discoveryScore < 80}
      >
        <FieldRow
          label="Amenities"
          microcopy={
            amenitiesCount >= 4 ? `${amenitiesCount} amenities listed — strong signal for prospective members.`
            : amenitiesCount > 0 ? `${amenitiesCount} amenit${amenitiesCount === 1 ? 'y' : 'ies'} — add more to stand out from nearby gyms.`
            : 'No amenities listed. Members can\'t compare what you offer.'
          }
          score={amenitiesCount >= 4 ? 100 : amenitiesCount > 0 ? 50 : 0}
          onClick={() => openModal('amenities')}
        />
        <FieldRow
          last
          label="Equipment"
          microcopy={
            equipmentCount >= 5 ? `${equipmentCount} items listed — helps members plan before they arrive.`
            : equipmentCount > 0 ? `${equipmentCount} item${equipmentCount !== 1 ? 's' : ''} — members want to know exactly what\'s available.`
            : 'No equipment listed. A common reason members choose a competitor.'
          }
          score={equipmentCount >= 5 ? 100 : equipmentCount > 0 ? 50 : 0}
          onClick={() => openModal('equipment')}
        />
      </Section>

      {/* ── FOOTER CALLOUT ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 18px', marginTop: 6,
        background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
      }}>
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
