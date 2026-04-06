import React, { useRef, useEffect, useState } from 'react';

/**
 * PageTransition
 *
 * Strava / Duolingo-style page transitions:
 *  • Tab switch  → horizontal slide + fade (direction-aware: left or right)
 *  • Deep nav    → vertical lift (slide up from below) + fade
 *  • Back nav    → reverse vertical lift + fade
 *
 * Props
 * ─────
 *  children       – page content
 *  pageKey        – unique key that triggers a new transition (e.g. currentPageName)
 *  direction      – 'left' | 'right' | 'up' | 'down'  (default: 'up')
 *  duration       – ms  (default: 280)
 */

const VARIANTS = {
  // entering — where the new page starts before animating in
  enterFrom: {
    left:  { transform: 'translateX(28px)',  opacity: 0 },
    right: { transform: 'translateX(-28px)', opacity: 0 },
    up:    { transform: 'translateY(22px)',  opacity: 0 },
    down:  { transform: 'translateY(-22px)', opacity: 0 },
  },
  // exiting — where the old page moves to while leaving
  exitTo: {
    left:  { transform: 'translateX(-22px)', opacity: 0 },
    right: { transform: 'translateX(22px)',  opacity: 0 },
    up:    { transform: 'translateY(-14px)', opacity: 0 },
    down:  { transform: 'translateY(14px)',  opacity: 0 },
  },
};

// Easing curves that match Strava/Duolingo feel
const EASE_IN  = 'cubic-bezier(0.3, 0, 0.6, 0)';    // quick exit
const EASE_OUT = 'cubic-bezier(0.25, 0.85, 0.3, 1)'; // bouncy entrance

export default function PageTransition({
  children,
  pageKey,
  direction = 'up',
  duration = 280,
}) {
  // We keep TWO slots: the "outgoing" page and the "incoming" page.
  // This lets us animate both simultaneously (cross-fade/slide).
  const [slots, setSlots] = useState([
    { id: 0, node: children, dir: direction, phase: 'idle' },
  ]);
  const nextId = useRef(1);
  const prevKey = useRef(pageKey);

  useEffect(() => {
    if (pageKey === prevKey.current) return;
    prevKey.current = pageKey;

    const incomingId = nextId.current++;

    // 1. Mark the current (outgoing) slot as exiting
    setSlots(prev =>
      prev.map(s => s.phase === 'idle' ? { ...s, phase: 'exit' } : s)
    );

    // 2. Add the incoming slot, starting off-screen
    setSlots(prev => [
      ...prev,
      { id: incomingId, node: children, dir: direction, phase: 'enter' },
    ]);

    // 3. After one frame, let the incoming slot animate to its resting state
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlots(prev =>
          prev.map(s => s.id === incomingId ? { ...s, phase: 'idle' } : s)
        );
      });
    });

    // 4. After the animation completes, destroy the outgoing slot
    const cleanupTimer = setTimeout(() => {
      setSlots(prev => prev.filter(s => s.id === incomingId));
    }, duration + 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(cleanupTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  // Keep the active slot's children in sync when no transition is happening
  useEffect(() => {
    setSlots(prev => {
      if (prev.length !== 1) return prev;
      return [{ ...prev[0], node: children }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }}>
      {slots.map(slot => {
        const fromStyle = VARIANTS.enterFrom[slot.dir] ?? VARIANTS.enterFrom.up;
        const toStyle   = VARIANTS.exitTo[slot.dir]   ?? VARIANTS.exitTo.up;

        let style = {};
        if (slot.phase === 'enter') {
          // Start position (off-screen)
          style = {
            ...fromStyle,
            transition: 'none',
            position: slots.length > 1 ? 'absolute' : 'relative',
            inset: 0,
            willChange: 'transform, opacity',
          };
        } else if (slot.phase === 'idle') {
          // Resting / arrived position
          style = {
            transform: 'translate(0, 0) scale(1)',
            opacity: 1,
            transition: `transform ${duration}ms ${EASE_OUT}, opacity ${duration}ms ${EASE_OUT}`,
            position: slots.length > 1 ? 'absolute' : 'relative',
            inset: 0,
            willChange: 'transform, opacity',
          };
        } else if (slot.phase === 'exit') {
          // Exit position
          style = {
            ...toStyle,
            transition: `transform ${Math.round(duration * 0.8)}ms ${EASE_IN}, opacity ${Math.round(duration * 0.8)}ms ${EASE_IN}`,
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            willChange: 'transform, opacity',
          };
        }

        return (
          <div key={slot.id} style={style}>
            {slot.node}
          </div>
        );
      })}
    </div>
  );
}
