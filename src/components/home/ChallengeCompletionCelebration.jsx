import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Maps challenge variant IDs → their display assets
const CHALLENGE_REWARD_MAP = {
  // April
  beach: {
    challengeName: 'Discipline Builder',
    month: 'April 2026',
    badgeUrl: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/33bf94a48_beachbadge2.png',
    iconUrl:  'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9766d8d41_BEACH.png',
  },
  spartan: {
    challengeName: 'Witness My Gains',
    month: 'April 2026',
    badgeUrl: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/fa6c9c42e_spartanbadge21.png',
    iconUrl:  'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a72ee034d_spartan.png',
  },
  // May
  mermaid: {
    challengeName: 'Discipline Builder',
    month: 'May 2026',
    badgeUrl: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/50e07054f_mermaidbadge2.png',
    iconUrl:  'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/024cf0fc0_mermaidpose1.png',
  },
  pirate: {
    challengeName: 'Witness My Gains',
    month: 'May 2026',
    badgeUrl: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d96e98fb_piratebadge2.png',
    iconUrl:  'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/a66aac6ab_pirate.png',
  },
};

const SEEN_KEY = 'seenChallengeCompletions';

function getSeenSet() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
  catch { return new Set(); }
}

function markSeen(variantId) {
  try {
    const seen = getSeenSet();
    seen.add(variantId);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {}
}

/**
 * Checks which newly-unlocked variants the user hasn't seen the completion
 * celebration for yet, and returns them in order.
 */
export function getUnseenCompletions(unlockedVariants = []) {
  const seen = getSeenSet();
  return unlockedVariants.filter(v => CHALLENGE_REWARD_MAP[v] && !seen.has(v));
}

// ── 3-D button (same style as StreakCelebration) ─────────────────────────────
function ContinueButton({ onClick, opacity, enabled }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', opacity, transition: 'opacity 0.9s ease' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16,
        background: enabled ? '#1a3fa8' : '#111827',
        transform: pressed ? 'translateY(1px)' : 'translateY(4px)',
        transition: 'transform 0.07s ease',
      }} />
      <button
        disabled={!enabled}
        onMouseDown={() => enabled && setPressed(true)}
        onMouseUp={() => { setPressed(false); if (enabled) onClick?.(); }}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => enabled && setPressed(true)}
        onTouchEnd={e => { e.preventDefault(); setPressed(false); if (enabled) onClick?.(); }}
        onTouchCancel={() => setPressed(false)}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', padding: '13px 0', borderRadius: 16, border: 'none',
          background: enabled
            ? 'linear-gradient(to bottom, #60a5fa, #3b82f6 40%, #1d4ed8)'
            : 'linear-gradient(to bottom, #2d3748, #1a202c 50%, #0f172a)',
          color: enabled ? '#fff' : 'rgba(255,255,255,0.28)',
          fontSize: 16, fontWeight: 900, cursor: enabled ? 'pointer' : 'default',
          letterSpacing: '-0.01em',
          WebkitTapHighlightColor: 'transparent', userSelect: 'none', outline: 'none',
          transform: pressed ? 'translateY(4px)' : 'translateY(0)',
          boxShadow: pressed || !enabled ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.2)',
          transition: 'transform 0.07s ease, box-shadow 0.07s ease',
        }}
      >
        Continue
      </button>
    </div>
  );
}

export default function ChallengeCompletionCelebration({ variantId, onDismiss }) {
  const [showButton, setShowButton] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [exiting, setExiting] = useState(false);

  const reward = CHALLENGE_REWARD_MAP[variantId];

  useEffect(() => {
    if (!reward) return;
    // Button fades in after 2 s, becomes clickable at 2.5 s
    const t1 = setTimeout(() => setShowButton(true), 2000);
    const t2 = setTimeout(() => setButtonEnabled(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reward]);

  const handleContinue = () => {
    if (!buttonEnabled || exiting) return;
    markSeen(variantId);
    setExiting(true);
    setTimeout(() => onDismiss?.(), 600);
  };

  if (!reward) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <>
          {/* Dark backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(0,0,0,0.93)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9001,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px 24px calc(env(safe-area-inset-bottom) + 100px)',
            }}
          >
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
              style={{ textAlign: 'center', marginBottom: 8 }}
            >
              <p style={{
                fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
              }}>
                Challenge Complete
              </p>
              <h1 style={{
                fontSize: 'clamp(22px, 5vw, 30px)',
                fontWeight: 900, color: '#ffffff',
                letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0,
              }}>
                You've Completed<br />
                <span style={{ color: '#60a5fa' }}>{reward.challengeName}</span>
              </h1>
              <p style={{
                fontSize: 14, fontWeight: 600,
                color: 'rgba(255,255,255,0.45)',
                marginTop: 6,
              }}>
                {reward.month}
              </p>
            </motion.div>

            {/* Rewards label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{
                fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', letterSpacing: '0.14em',
                marginBottom: 24, marginTop: 20,
              }}
            >
              Rewards
            </motion.p>

            {/* Badge + Streak Icon side by side */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 32 }}>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.55, ease: [0.34, 1.3, 0.64, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <img
                  src={reward.badgeUrl}
                  alt="Badge"
                  style={{ width: 110, height: 110, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
                />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Badge
                </p>
              </motion.div>

              {/* Streak Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.55, ease: [0.34, 1.3, 0.64, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <img
                  src={reward.iconUrl}
                  alt="Streak Icon"
                  style={{ width: 110, height: 110, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
                />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Streak Icon
                </p>
              </motion.div>
            </div>

            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: showButton ? 1 : 0, y: showButton ? 0 : 16 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                bottom: 'calc(env(safe-area-inset-bottom) + 36px)',
                width: 'min(340px, 88vw)',
              }}
            >
              <ContinueButton
                enabled={buttonEnabled}
                opacity={showButton ? 1 : 0}
                onClick={handleContinue}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}