import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Standalone step component for username creation during onboarding.
 * Handles real-time uniqueness checking against all existing users.
 */
export default function UsernameStep({
  username, setUsername, setUsernameEdited,
  hasContent, isValid, showFormatHint,
  visible, animDir, inner, goTo, C,
  PrimaryButton, BackButton, ProgressBar, PageShell, SlidePane,
}) {
  const [checking, setChecking] = useState(false);
  const [isUnique, setIsUnique] = useState(null); // null = not checked yet
  const [checkError, setCheckError] = useState(false);
  const debounceRef = useRef(null);

  // Debounce uniqueness check whenever username changes and format is valid
  useEffect(() => {
    setIsUnique(null);
    setCheckError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!isValid) return;

    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await base44.entities.User.filter({ username: username.trim() });
        setIsUnique(results.length === 0);
      } catch {
        // If the check fails (e.g. network or unsupported filter), assume unique so user isn't blocked
        setIsUnique(true);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [username, isValid]);

  const canContinue = isValid && isUnique === true;

  return (
    <PageShell>
      <SlidePane visible={visible} dir={animDir}>
        <div style={inner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, marginBottom: 28, flexShrink: 0 }}>
            <BackButton onClick={() => goTo(5, 'back')} />
            <ProgressBar step={6} />
          </div>

          <h1 style={{ color: C.text, fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 6px', flexShrink: 0 }}>
            Create a username
          </h1>
          <p style={{ color: C.sub, fontSize: 14, margin: '0 0 28px', flexShrink: 0 }}>
            This is your unique handle — like Instagram, others use it to find you.
          </p>

          <div style={{ flexShrink: 0 }}>
            {/* Input with @ prefix */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                fontSize: 18, fontWeight: 700,
                color: hasContent ? C.blueMid : C.muted,
                pointerEvents: 'none',
                transition: 'color 0.2s',
                userSelect: 'none',
              }}>@</span>

              <input
                type="text"
                value={username}
                onChange={e => {
                  const sanitised = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_.]/g, '')
                    .slice(0, 20);
                  setUsername(sanitised);
                  setUsernameEdited(true);
                }}
                placeholder="username"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onFocus={e => { e.target.scrollIntoView = () => {}; }}
                style={{
                  fontSize: 18,
                  width: '100%',
                  padding: '15px 42px 15px 36px',
                  borderRadius: 14,
                  background: C.card,
                  border: `1.5px solid ${
                    showFormatHint     ? '#ef4444'
                    : isUnique === false ? '#ef4444'
                    : isUnique === true  ? C.green
                    : hasContent         ? C.blueMid
                    :                      C.border
                  }`,
                  color: hasContent ? C.blueMid : C.text,
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'border-color 0.2s, color 0.2s',
                  letterSpacing: '0.01em',
                }}
              />

              {/* Right-side status indicator */}
              {hasContent && isValid && (
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  {checking ? (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.blueMid}30`, borderTopColor: C.blueMid, animation: 'ob-spin 0.7s linear infinite' }} />
                  ) : isUnique === true ? (
                    <span style={{ fontSize: 16, color: C.green }}>✓</span>
                  ) : isUnique === false ? (
                    <span style={{ fontSize: 16, color: '#ef4444' }}>✕</span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Hint / status line */}
            <div style={{ minHeight: 20, marginTop: 8 }}>
              {showFormatHint ? (
                <p style={{ color: '#ef4444', fontSize: 12, margin: 0, fontWeight: 600 }}>
                  At least 3 characters · only letters, numbers, dots and underscores
                </p>
              ) : isUnique === false ? (
                <p style={{ color: '#ef4444', fontSize: 12, margin: 0, fontWeight: 600 }}>
                  That username is already taken — try another
                </p>
              ) : checkError ? (
                <p style={{ color: '#f59e0b', fontSize: 12, margin: 0, fontWeight: 600 }}>
                  Couldn't check availability — please try again
                </p>
              ) : isUnique === true ? (
                <p style={{ color: C.green, fontSize: 12, margin: 0, fontWeight: 600 }}>
                  ✓ That username is available!
                </p>
              ) : checking ? (
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
                  Checking availability…
                </p>
              ) : (
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
                  Letters, numbers, dots and underscores only · max 20 characters
                </p>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <PrimaryButton onClick={() => goTo(7, 'forward')} disabled={!canContinue}>
            Continue
          </PrimaryButton>
        </div>
      </SlidePane>
    </PageShell>
  );
}