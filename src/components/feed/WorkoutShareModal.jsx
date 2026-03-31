import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

// ─── Canvas helpers ───────────────────────────────────────────────────────────
async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function canvasToBlob(canvas) {
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png')
  );
}

// ─── Stats Card Canvas ────────────────────────────────────────────────────────
// Layout:
//   TOP:    gym · date   (centred, near top)
//   MIDDLE: workout name + stat pills  (shifted lower, smaller)
//   BOTTOM: CoStride logo + wordmark  (centred at bottom)
async function drawStatsCard(post, gymName) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const exercises = post.workout_exercises || [];

  // ── Background ────────────────────────────────────────────────────────────
  if (post.image_url) {
    const img = await loadImage(post.image_url);
    if (img) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(0.25, 'rgba(0,0,0,0.10)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0.97)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0d1117'); g.addColorStop(0.45, '#111827'); g.addColorStop(1, '#0f172a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  const PAD = 72;

  // ── TOP: gym · date ───────────────────────────────────────────────────────
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const topLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;
  ctx.font = '600 36px -apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 10;
  ctx.fillText(topLine, W / 2, 110);
  ctx.shadowBlur = 0;

  // ── MIDDLE: workout name + stat pills ─────────────────────────────────────
  // Pushed to ~60% down the image so it's noticeably below centre
  const contentY = H * 0.60;

  ctx.font = '900 74px -apple-system,sans-serif';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18;
  ctx.textAlign = 'center';
  ctx.fillText(post.workout_name || 'Workout', W / 2, contentY, W - PAD * 2);
  ctx.shadowBlur = 0;

  // Stat pills
  const stats = [
    { l: 'EXERCISES', v: String(exercises.length || '—') },
    { l: 'DURATION', v: post.workout_duration || '—' },
    { l: 'VOLUME', v: post.workout_volume || '—' },
  ];
  const pH = 112, pG = 20, pW = (W - PAD * 2 - pG * 2) / 3;
  const pY = contentY + 28;
  stats.forEach((s, i) => {
    const px = PAD + i * (pW + pG);
    ctx.save(); ctx.beginPath(); ctx.roundRect(px, pY, pW, pH, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    ctx.font = '900 48px -apple-system,sans-serif';
    ctx.fillStyle = 'white'; ctx.textAlign = 'center';
    ctx.fillText(s.v, px + pW / 2, pY + 58, pW - 20);
    ctx.font = '700 24px -apple-system,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.fillText(s.l, px + pW / 2, pY + 92);
  });

  // ── BOTTOM: CoStride logo + wordmark ──────────────────────────────────────
  const logo = await loadImage(LOGO_URL);
  const logoSize = 60;
  const wordmark = 'CoStride';
  ctx.font = '800 48px -apple-system,sans-serif';
  const wm = ctx.measureText(wordmark);
  const totalW = logoSize + 14 + wm.width;
  const logoX = (W - totalW) / 2;
  const bottomY = H - 90;

  if (logo) {
    ctx.save(); ctx.beginPath();
    ctx.roundRect(logoX, bottomY - logoSize + 10, logoSize, logoSize, 14);
    ctx.clip(); ctx.drawImage(logo, logoX, bottomY - logoSize + 10, logoSize, logoSize); ctx.restore();
  }
  ctx.font = '800 48px -apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
  ctx.fillText(wordmark, logoX + logoSize + 14, bottomY);
  ctx.shadowBlur = 0; ctx.textAlign = 'left';

  return canvas;
}

// ─── Breakdown Card Canvas ────────────────────────────────────────────────────
async function drawBreakdownCard(post, gymName) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const exercises = post.workout_exercises || [];

  // ── Background ────────────────────────────────────────────────────────────
  if (post.image_url) {
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const oc = off.getContext('2d');
    const img = await loadImage(post.image_url);
    if (img) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      oc.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    }
    ctx.filter = 'blur(28px) brightness(0.30)'; ctx.drawImage(off, -40, -40, W + 80, H + 80); ctx.filter = 'none';
    ctx.fillStyle = 'rgba(5,7,16,0.52)'; ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
  }

  const PAD = 60;

  // ── TOP: gym · date ───────────────────────────────────────────────────────
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  const topLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;
  ctx.font = '700 34px -apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(topLine, W / 2, 90);
  ctx.textAlign = 'left';

  // ── Workout summary panel (shifted down from top) ─────────────────────────
  const pTop = 148;
  ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, pTop, W - PAD * 2, 170, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();

  ctx.font = '900 52px -apple-system,sans-serif';
  ctx.fillStyle = 'white'; ctx.textAlign = 'left';
  ctx.fillText(post.workout_name || 'Workout', PAD + 30, pTop + 62, W - PAD * 2 - 60);

  const mS = [
    { l: 'EXERCISES', v: String(exercises.length || '—') },
    { l: 'DURATION', v: post.workout_duration || '—' },
    { l: 'VOLUME', v: post.workout_volume || '—' },
  ];
  const mW = (W - PAD * 2 - 60) / 3;
  mS.forEach((s, i) => {
    const mx = PAD + 30 + i * mW;
    ctx.font = '800 38px -apple-system,sans-serif'; ctx.fillStyle = 'white';
    ctx.fillText(s.v, mx, pTop + 124, mW - 20);
    ctx.font = '700 24px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.36)';
    ctx.fillText(s.l, mx, pTop + 158);
  });

  // ── Exercise rows ─────────────────────────────────────────────────────────
  const tTop = pTop + 218;
  const colW = [W - PAD * 2 - 320, 100, 50, 100, 160];
  const colX = [PAD + 20];
  colW.slice(0, -1).forEach((w, i) => colX.push(colX[i] + colW[i] + 10));

  ctx.font = '700 26px -apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ['EXERCISE', 'SETS', '', 'REPS', 'WEIGHT'].forEach((h, i) => {
    ctx.textAlign = i > 0 ? 'center' : 'left';
    ctx.fillText(h, i > 0 ? colX[i] + colW[i] / 2 : colX[i], tTop);
  });
  ctx.textAlign = 'left';

  const rH = 88;
  const maxR = Math.min(exercises.length, Math.floor((H - tTop - 160) / (rH + 10)));
  exercises.slice(0, maxR).forEach((ex, idx) => {
    const ry = tTop + 20 + idx * (rH + 10);
    const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`)
      .replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, ry, W - PAD * 2, rH, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    ctx.font = '700 34px -apple-system,sans-serif'; ctx.fillStyle = 'white';
    ctx.fillText(name, colX[0], ry + 56, colW[0] - 10);
    [[String(ex.sets || ex.set_count || '—'), 1], [String(ex.reps || ex.rep_count || '—'), 3]].forEach(([v, ci]) => {
      ctx.save(); ctx.beginPath(); ctx.roundRect(colX[ci], ry + 14, colW[ci], 58, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill(); ctx.restore();
      ctx.font = '700 34px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center'; ctx.fillText(v, colX[ci] + colW[ci] / 2, ry + 54);
    });
    ctx.font = '700 30px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText('×', colX[2] + colW[2] / 2, ry + 54);
    const wG = ctx.createLinearGradient(colX[4], ry, colX[4], ry + rH);
    wG.addColorStop(0, 'rgba(59,130,246,0.9)'); wG.addColorStop(1, 'rgba(29,78,216,0.95)');
    ctx.save(); ctx.beginPath(); ctx.roundRect(colX[4], ry + 14, colW[4], 58, 10);
    ctx.fillStyle = wG; ctx.fill(); ctx.restore();
    ctx.fillStyle = 'white'; ctx.font = '800 34px -apple-system,sans-serif';
    ctx.fillText(`${String(ex.weight ?? ex.weight_kg ?? '—')}kg`, colX[4] + colW[4] / 2, ry + 54);
    ctx.textAlign = 'left';
  });
  if (exercises.length > maxR) {
    ctx.font = '600 28px -apple-system,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.textAlign = 'center';
    ctx.fillText(`+${exercises.length - maxR} more exercises`, W / 2, H - 160);
    ctx.textAlign = 'left';
  }

  // ── BOTTOM: CoStride logo + wordmark ──────────────────────────────────────
  const logo = await loadImage(LOGO_URL);
  const logoSize = 54;
  const wordmark = 'CoStride';
  ctx.font = '800 44px -apple-system,sans-serif';
  const wm = ctx.measureText(wordmark);
  const totalW = logoSize + 12 + wm.width;
  const logoX = (W - totalW) / 2;
  const bottomY = H - 72;

  if (logo) {
    ctx.save(); ctx.beginPath();
    ctx.roundRect(logoX, bottomY - logoSize + 8, logoSize, logoSize, 12);
    ctx.clip(); ctx.drawImage(logo, logoX, bottomY - logoSize + 8, logoSize, logoSize); ctx.restore();
  }
  ctx.font = '800 44px -apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
  ctx.fillText(wordmark, logoX + logoSize + 12, bottomY);
  ctx.shadowBlur = 0; ctx.textAlign = 'left';

  return canvas;
}

// ─── React Preview: Stats card ────────────────────────────────────────────────
function StatsPreview({ post, gymName }) {
  const exercises = post.workout_exercises || [];
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const topLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;

  const comment = (() => {
    if (!post.content) return null;
    return post.content.split('\n').filter(l => {
      const t = l.trim();
      return t && !t.includes('Just finished') && !/[0-9]+\s*[xX]\s*[0-9]+/.test(t) && !/[0-9]+(kg|lbs)/i.test(t);
    }).join(' ').trim() || null;
  })();

  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Background */}
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.28) 0%,rgba(0,0,0,0.05) 20%,rgba(0,0,0,0.52) 55%,rgba(0,0,0,0.96) 100%)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 45%,#0f172a 100%)' }} />
      )}

      {/* TOP: gym · date */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 10px 0', textAlign: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.7)', letterSpacing: '0.02em' }}>
          {topLine}
        </span>
      </div>

      {/* MIDDLE: workout name + stats — lower down */}
      <div style={{ position: 'absolute', bottom: '22%', left: 0, right: 0, padding: '0 10px' }}>
        <div style={{ color: 'white', fontSize: 15, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>
          {post.workout_name || 'Workout'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          {[
            { label: 'Exercises', value: exercises.length || '—' },
            { label: 'Duration', value: post.workout_duration || '—' },
            { label: 'Volume', value: post.workout_volume || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '6px 3px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        {comment && <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: 500, lineHeight: 1.4, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.28)', paddingLeft: 7 }}>"{comment}"</div>}
      </div>

      {/* BOTTOM: CoStride logo */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <img src={LOGO_URL} alt="" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }} />
        <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: 800, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>CoStride</span>
      </div>
    </div>
  );
}

// ─── React Preview: Breakdown card ───────────────────────────────────────────
function BreakdownPreview({ post, gymName }) {
  const exercises = post.workout_exercises || [];
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  const topLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;

  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {/* Background */}
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.28)', transform: 'scale(1.08)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,7,16,0.45)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 100%)' }} />
      )}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '8px 10px 8px' }}>
        {/* TOP: gym · date — centred */}
        <div style={{ textAlign: 'center', marginBottom: 7 }}>
          <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {topLine}
          </span>
        </div>

        {/* Workout summary panel */}
        <div style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, padding: '7px 9px', marginBottom: 5 }}>
          <div style={{ color: 'white', fontSize: 11, fontWeight: 900, marginBottom: 4 }}>{post.workout_name || 'Workout'}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Exercises', value: exercises.length || '—' },
              { label: 'Duration', value: post.workout_duration || '—' },
              { label: 'Volume', value: post.workout_volume || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.36)', fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 8px 28px 42px', gap: 3, paddingLeft: 4, marginBottom: 3 }}>
          {['Exercise', 'Sets', '', 'Reps', 'Wt'].map((h, i) => (
            <div key={i} style={{ color: 'rgba(255,255,255,0.28)', fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Exercise rows */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {exercises.slice(0, 8).map((ex, idx) => {
            const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`)
              .replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 28px 8px 28px 42px', gap: 3, alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 5, padding: '3px 2px 3px 5px' }}>
                <div style={{ color: 'white', fontSize: 8, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 3, color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: '1.5px 0' }}>{ex.sets || ex.set_count || '—'}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 6.5, textAlign: 'center', fontWeight: 700 }}>×</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 3, color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: '1.5px 0' }}>{ex.reps || ex.rep_count || '—'}</div>
                <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.85),rgba(29,78,216,0.95))', borderRadius: 4, color: 'white', fontSize: 7.5, fontWeight: 800, textAlign: 'center', padding: '1.5px 0' }}>
                  {ex.weight ?? ex.weight_kg ?? '—'}<span style={{ fontSize: 5.5 }}>kg</span>
                </div>
              </div>
            );
          })}
          {exercises.length > 8 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7.5, textAlign: 'center', paddingTop: 2 }}>+{exercises.length - 8} more</div>}
        </div>

        {/* BOTTOM: CoStride logo — centred */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 6 }}>
          <img src={LOGO_URL} alt="" style={{ width: 15, height: 15, borderRadius: 3, objectFit: 'cover' }} />
          <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: 10, fontWeight: 800 }}>CoStride</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sharing logic ────────────────────────────────────────────────────────────
async function getImageFile(blob, name) {
  return new File([blob], name, { type: 'image/png' });
}

async function shareImageNative(blob, post, extraText = '') {
  const name = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
  const file = await getImageFile(blob, name);
  const shareData = {
    files: [file],
    text: extraText || `Check out my ${post.workout_name || 'workout'} on CoStride 💪`,
  };
  if (navigator.share && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    toast.success('Image saved!');
  }
}

async function shareToAppWithScheme(blob, post, urlScheme) {
  const name = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
  const file = await getImageFile(blob, name);
  const shareData = { files: [file], text: `My ${post.workout_name || 'workout'} on CoStride 💪` };

  if (navigator.share && navigator.canShare?.(shareData)) {
    navigator.share(shareData).catch(() => {});
    setTimeout(() => { try { window.location.href = urlScheme; } catch (_) {} }, 600);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    toast.info('Image saved — open the app and share from your camera roll');
  }
}

// ─── App button definitions ───────────────────────────────────────────────────
const APP_BUTTONS = [
  {
    id: 'instagram_story',
    label: 'Instagram\nStory',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <defs>
          <radialGradient id="ig1" cx="30%" cy="107%" r="120%">
            <stop offset="0%" stopColor="#ffd600"/>
            <stop offset="50%" stopColor="#ff6f00"/>
            <stop offset="100%" stopColor="#ff6f00" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="ig2" cx="10%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#ff4081"/>
            <stop offset="60%" stopColor="#ff4081" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="ig3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6f00" stopOpacity="0"/>
            <stop offset="40%" stopColor="#e040fb"/>
            <stop offset="100%" stopColor="#7c4dff"/>
          </linearGradient>
        </defs>
        <rect width="60" height="60" rx="14" fill="#000"/>
        <rect width="60" height="60" rx="14" fill="url(#ig1)"/>
        <rect width="60" height="60" rx="14" fill="url(#ig2)"/>
        <rect width="60" height="60" rx="14" fill="url(#ig3)"/>
        <rect x="14" y="14" width="32" height="32" rx="8" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="41.5" cy="18.5" r="2.5" fill="white"/>
      </svg>
    ),
    action: (blob, post) => shareToAppWithScheme(blob, post, 'instagram-stories://share'),
  },
  {
    id: 'instagram_dm',
    label: 'Instagram\nMessages',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <defs>
          <radialGradient id="igdm1" cx="30%" cy="107%" r="120%">
            <stop offset="0%" stopColor="#ffd600"/>
            <stop offset="50%" stopColor="#ff6f00"/>
            <stop offset="100%" stopColor="#ff6f00" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="igdm2" cx="10%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#ff4081"/>
            <stop offset="60%" stopColor="#ff4081" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="igdm3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6f00" stopOpacity="0"/>
            <stop offset="40%" stopColor="#e040fb"/>
            <stop offset="100%" stopColor="#7c4dff"/>
          </linearGradient>
        </defs>
        <rect width="60" height="60" rx="14" fill="#000"/>
        <rect width="60" height="60" rx="14" fill="url(#igdm1)"/>
        <rect width="60" height="60" rx="14" fill="url(#igdm2)"/>
        <rect width="60" height="60" rx="14" fill="url(#igdm3)"/>
        <path d="M14 30 L46 18 L38 46 L28 36 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M28 36 L26 44 L32 38" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M28 36 L46 18" fill="none" stroke="white" strokeWidth="2.5"/>
      </svg>
    ),
    action: (blob, post) => shareImageNative(blob, post, `My ${post.workout_name || 'workout'} on CoStride 💪`),
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <rect width="60" height="60" rx="14" fill="#FFFC00"/>
        <path d="M30 13c-5.5 0-10 4.5-10 10v1.5c-1 .2-2.5.8-2.5 2 0 1 .8 1.8 1.9 2-.5 1.4-1.4 3-3.3 3.9-.7.3-1 1-.7 1.7.5 1.2 2.4 1.6 3.9 1.7.2.5.3 1.2.8 1.5.3.2.8 0 1.5-.2.9-.3 2.1-.7 3.4-.7s2.5.4 3.4.7c.7.2 1.2.4 1.5.2.5-.3.6-1 .8-1.5 1.5-.1 3.4-.5 3.9-1.7.3-.7 0-1.4-.7-1.7-1.9-.9-2.8-2.5-3.3-3.9 1.1-.2 1.9-.9 1.9-2 0-1.2-1.5-1.8-2.5-2V23c0-5.5-4.5-10-10-10z" fill="black"/>
      </svg>
    ),
    action: (blob, post) => shareToAppWithScheme(blob, post, 'snapchat://'),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <rect width="60" height="60" rx="14" fill="#25D366"/>
        <path d="M30 13C20.6 13 13 20.6 13 30c0 3.7 1.2 7.1 3.2 9.9L14 46l6.4-2.1C23 45.5 26.4 47 30 47c9.4 0 17-7.6 17-17S39.4 13 30 13zm8.9 23.8c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.8.2-2.9-.2-.7-.2-1.6-.5-2.7-1-4.7-2.1-7.8-6.9-8-7.2-.2-.3-1.9-2.5-1.9-4.8s1.2-3.4 1.6-3.9c.4-.5.9-.6 1.2-.6h.9c.3 0 .7-.1 1 .8.4.9 1.3 3.2 1.4 3.4.1.2.2.5 0 .8-.2.3-.2.5-.4.8-.2.3-.4.6-.6.8-.2.2-.4.5-.2.9.3.5 1.1 1.9 2.4 3 1.7 1.5 3 2 3.5 2.2.5.2.7.2 1-.1.3-.3 1.1-1.3 1.4-1.7.3-.5.6-.4 1-.2.4.2 2.6 1.2 3.1 1.4.5.2.8.3.9.5.1.2.1 1.1-.3 2.2z" fill="white"/>
      </svg>
    ),
    action: (blob, post) => shareImageNative(blob, post, `My ${post.workout_name || 'workout'} on CoStride 💪`),
  },
  {
    id: 'messages',
    label: 'Message',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <defs>
          <linearGradient id="msg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5BF75B"/>
            <stop offset="100%" stopColor="#27C227"/>
          </linearGradient>
        </defs>
        <rect width="60" height="60" rx="14" fill="url(#msg)"/>
        <path d="M30 14C20.6 14 13 20.6 13 28.5c0 4.3 2 8.2 5.2 10.9L17 46l6.5-3.2c2 .7 4.2 1.2 6.5 1.2 9.4 0 17-6.5 17-14.5S39.4 14 30 14z" fill="white"/>
      </svg>
    ),
    action: (blob, post) => shareImageNative(blob, post, `My ${post.workout_name || 'workout'} on CoStride 💪`),
  },
  {
    id: 'more',
    label: 'More',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <rect width="60" height="60" rx="14" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <circle cx="18" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/>
        <circle cx="30" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/>
        <circle cx="42" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/>
      </svg>
    ),
    action: (blob, post) => shareImageNative(blob, post),
  },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function WorkoutShareModal({ open, onClose, post, gymName }) {
  const [activeCard, setActiveCard] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const touchStartXRef = useRef(null);

  useEffect(() => { if (open) setActiveCard(0); }, [open]);

  const getCanvas = useCallback(
    () => activeCard === 0 ? drawStatsCard(post, gymName) : drawBreakdownCard(post, gymName),
    [activeCard, post, gymName]
  );

  const handleBtn = useCallback(async (btn) => {
    if (loadingId) return;
    setLoadingId(btn.id);
    try {
      const canvas = await getCanvas();
      const blob = await canvasToBlob(canvas);
      await btn.action(blob, post);
    } catch (e) {
      if (e?.name !== 'AbortError') { console.error(e); toast.error('Could not share'); }
    } finally { setLoadingId(null); }
  }, [loadingId, getCanvas, post]);

  const handleSave = useCallback(async () => {
    if (loadingId) return;
    setLoadingId('save');
    try {
      const canvas = await getCanvas();
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Saved!');
    } catch (e) { console.error(e); toast.error('Could not save'); }
    finally { setLoadingId(null); }
  }, [loadingId, getCanvas, post]);

  if (!open || !post) return null;

  const cards = [
    { label: 'Summary', node: <StatsPreview post={post} gymName={gymName} /> },
    { label: 'Full Breakdown', node: <BreakdownPreview post={post} gymName={gymName} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011,
              maxHeight: 'calc(100dvh - 80px)',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(12,12,20,0.98)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              paddingBottom: 'max(env(safe-area-inset-bottom,0px),12px)',
              fontFamily: "'SF Pro Display',-apple-system,sans-serif",
              overflow: 'hidden',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 8px', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Activity</span>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            {/* Portrait card preview */}
            <div style={{ padding: '0 18px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{ width: 'min(52vw, 220px)', flexShrink: 0 }}
                  onTouchStart={e => { touchStartXRef.current = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    if (touchStartXRef.current === null) return;
                    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
                    if (Math.abs(dx) > 30) setActiveCard(v => dx < 0 ? Math.min(cards.length - 1, v + 1) : Math.max(0, v - 1));
                    touchStartXRef.current = null;
                  }}
                >
                  <div style={{ overflow: 'hidden', borderRadius: 14 }}>
                    <div style={{ display: 'flex', transition: 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)', transform: `translateX(calc(-${activeCard * 100}%))` }}>
                      {cards.map((card, i) => (
                        <div key={i} style={{ minWidth: '100%', flexShrink: 0 }}>{card.node}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 8, flexShrink: 0 }}>
              {cards.map((card, i) => (
                <button key={i} onClick={() => setActiveCard(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0 }}>
                  <div style={{ width: activeCard === i ? 18 : 6, height: 6, borderRadius: 3, background: activeCard === i ? 'white' : 'rgba(255,255,255,0.2)', transition: 'all 0.24s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  <span style={{ color: activeCard === i ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: 700, transition: 'color 0.2s' }}>{card.label}</span>
                </button>
              ))}
            </div>

            {/* Share to */}
            <div style={{ padding: '12px 18px 0', flexShrink: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px 0' }}>Share to</p>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                {APP_BUTTONS.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleBtn(btn)}
                    disabled={!!loadingId}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      background: 'none', border: 'none',
                      cursor: loadingId ? 'default' : 'pointer',
                      opacity: loadingId && loadingId !== btn.id ? 0.3 : 1,
                      flexShrink: 0, padding: 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{ position: 'relative', width: 60, height: 60 }}>
                      {loadingId === btn.id
                        ? <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'cs-spin 0.65s linear infinite' }} />
                          </div>
                        : btn.icon}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2, maxWidth: 64 }}>
                      {btn.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Image */}
            <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
              <button
                onClick={handleSave}
                disabled={!!loadingId}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: loadingId === 'save' ? 'rgba(255,255,255,0.3)' : 'white',
                  fontSize: 14, fontWeight: 700,
                  cursor: loadingId ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {loadingId === 'save' ? 'Saving…' : 'Save Image'}
              </button>
            </div>
          </motion.div>

          <style>{`@keyframes cs-spin{to{transform:rotate(360deg)}}`}</style>
        </>
      )}
    </AnimatePresence>
  );
}