import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// ─── Shared: glass pill ──────────────────────────────────────────────────────
function drawGlassPill(ctx, x, y, w, h, r = 16) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w - 4, Math.min(h * 0.36, 28), [r - 1, r - 1, 0, 0]);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();
  ctx.restore();
}

// ─── Shared: centred CoStride wordmark ───────────────────────────────────────
async function drawCentredBrand(ctx, W, y, logoSize, fontSize) {
  const logo = await loadImage(LOGO_URL);
  ctx.font = `800 ${fontSize}px -apple-system,sans-serif`;
  const wmW = ctx.measureText('CoStride').width;
  const totalW = logoSize + Math.round(fontSize * 0.28) + wmW;
  const startX = (W - totalW) / 2;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(startX, y - logoSize + Math.round(logoSize * 0.14), logoSize, logoSize, Math.round(logoSize * 0.22));
    ctx.clip();
    ctx.drawImage(logo, startX, y - logoSize + Math.round(logoSize * 0.14), logoSize, logoSize);
    ctx.restore();
  }
  ctx.font = `800 ${fontSize}px -apple-system,sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 14;
  ctx.fillText('CoStride', startX + logoSize + Math.round(fontSize * 0.28), y);
  ctx.shadowBlur = 0;
}

// ─── STATS CARD ──────────────────────────────────────────────────────────────
async function drawStatsCard(post, gymName) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const exercises = post.workout_exercises || [];
  const PAD = 72;

  // Background
  if (post.image_url) {
    const img = await loadImage(post.image_url);
    if (img) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    'rgba(0,0,0,0.30)');
    g.addColorStop(0.14, 'rgba(0,0,0,0.0)');
    g.addColorStop(0.50, 'rgba(0,0,0,0.0)');
    g.addColorStop(0.68, 'rgba(0,0,0,0.80)');
    g.addColorStop(1,    'rgba(0,0,0,0.97)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0a0d16'); g.addColorStop(0.5, '#111827'); g.addColorStop(1, '#0d1320');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // TOP LEFT: CoStride logo + wordmark
  const topLogo = await loadImage(LOGO_URL);
  const brandLogoSz = 60, brandFontSz = 54, brandX = PAD, brandY = 136;
  if (topLogo) {
    ctx.save(); ctx.beginPath();
    ctx.roundRect(brandX, brandY - brandLogoSz + Math.round(brandLogoSz * 0.14), brandLogoSz, brandLogoSz, Math.round(brandLogoSz * 0.22));
    ctx.clip(); ctx.drawImage(topLogo, brandX, brandY - brandLogoSz + Math.round(brandLogoSz * 0.14), brandLogoSz, brandLogoSz); ctx.restore();
  }
  ctx.font = `800 ${brandFontSz}px -apple-system,sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 14;
  ctx.fillText('CoStride', brandX + brandLogoSz + 16, brandY); ctx.shadowBlur = 0;

  // Footer: gym · date — centred
  const bottomY = H - 160;
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const footerLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;
  ctx.font = '500 32px -apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.textAlign = 'center';
  ctx.fillText(footerLine.toUpperCase(), W / 2, bottomY);

  // ── Inline stat row — centred ──
  const valFont = '900 68px -apple-system,sans-serif';
  const lblFont = '700 30px -apple-system,sans-serif';
  const statItems = [
    { v: String(exercises.length || '—'), l: 'EXERCISES' },
    { v: post.workout_duration || '—',    l: 'DURATION'  },
  ];

  ctx.font = valFont;
  const itemW = statItems.map(s => {
    const vW = ctx.measureText(s.v).width;
    ctx.font = lblFont;
    const lW = ctx.measureText(s.l).width;
    ctx.font = valFont;
    return Math.max(vW, lW);
  });

  const divW = 2, sideGap = 64;
  const totalStatRowW = itemW[0] + sideGap + divW + sideGap + itemW[1];
  const statRowY = bottomY - 58;
  let curX = (W - totalStatRowW) / 2;

  statItems.forEach((s, i) => {
    const cx = curX + itemW[i] / 2;
    ctx.font = valFont;
    ctx.fillStyle = 'white'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
    ctx.fillText(s.v, cx, statRowY - 10);
    ctx.shadowBlur = 0;
    ctx.font = lblFont;
    ctx.fillStyle = 'rgba(255,255,255,0.48)';
    ctx.fillText(s.l, cx, statRowY + 32);
    curX += itemW[i];
    if (i < statItems.length - 1) {
      curX += sideGap;
      ctx.beginPath();
      ctx.moveTo(curX + divW / 2, statRowY - 48);
      ctx.lineTo(curX + divW / 2, statRowY + 36);
      ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = divW;
      ctx.stroke();
      curX += divW + sideGap;
    }
  });

  // Thin horizontal divider above stats
  const dividerY = statRowY - 48 - 44;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, dividerY); ctx.lineTo(W - PAD, dividerY); ctx.stroke();

  // ── Title centred above divider ──
  const titleText = post.workout_name || 'Workout';
  let titleFontSize = 108;
  ctx.font = `900 ${titleFontSize}px -apple-system,sans-serif`;
  while (ctx.measureText(titleText).width > W - PAD * 2 && titleFontSize > 56) {
    titleFontSize -= 4;
    ctx.font = `900 ${titleFontSize}px -apple-system,sans-serif`;
  }
  const titleY = dividerY - 56;
  ctx.fillStyle = 'white'; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 32;
  ctx.fillText(titleText, W / 2, titleY);
  ctx.shadowBlur = 0;

  return canvas;
}

// ─── BREAKDOWN CARD ───────────────────────────────────────────────────────────
async function drawBreakdownCard(post, gymName) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const exercises = post.workout_exercises || [];
  const PAD = 64;

  if (post.image_url) {
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const oc = off.getContext('2d');
    const img = await loadImage(post.image_url);
    if (img) { const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); oc.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s); }
    ctx.filter = 'blur(32px) brightness(0.28)'; ctx.drawImage(off, -48, -48, W + 96, H + 96); ctx.filter = 'none';
    ctx.fillStyle = 'rgba(4,6,14,0.55)'; ctx.fillRect(0, 0, W, H);
  } else { ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H); }

  await drawCentredBrand(ctx, W, 108, 52, 46);

  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  const topLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;
  ctx.font = '600 26px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.36)'; ctx.textAlign = 'center';
  ctx.fillText(topLine, W / 2, 165);

  const titleText = post.workout_name || 'Workout';
  let titleSz = 80; ctx.font = `900 ${titleSz}px -apple-system,sans-serif`;
  while (ctx.measureText(titleText).width > W - PAD * 2 && titleSz > 48) { titleSz -= 4; ctx.font = `900 ${titleSz}px -apple-system,sans-serif`; }
  ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 20;
  ctx.fillText(titleText, W / 2, 260); ctx.shadowBlur = 0; ctx.textAlign = 'left';

  // 3 stat pills
  const statTop = 310, numStats = 3, pillH = 100, pillGap = 18;
  const pillW = (W - PAD * 2 - pillGap * (numStats - 1)) / numStats;
  [{ l: 'EXERCISES', v: String(exercises.length || '—') }, { l: 'DURATION', v: post.workout_duration || '—' }, { l: 'VOLUME', v: post.workout_volume || '—' }].forEach((s, i) => {
    const px = PAD + i * (pillW + pillGap);
    drawGlassPill(ctx, px, statTop, pillW, pillH, 18);
    ctx.font = '900 50px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.fillText(s.v, px + pillW / 2, statTop + 60, pillW - 24); ctx.shadowBlur = 0;
    ctx.font = '600 20px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.40)'; ctx.fillText(s.l, px + pillW / 2, statTop + 87);
  }); ctx.textAlign = 'left';

  const divTop = statTop + pillH + 40;
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, divTop); ctx.lineTo(W - PAD, divTop); ctx.stroke();

  const colHY = divTop + 44;
  const colW = [W - PAD * 2 - 290, 88, 44, 88, 150];
  const colX = [PAD + 16];
  colW.slice(0, -1).forEach((w, i) => colX.push(colX[i] + colW[i] + 10));
  ctx.font = '700 24px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.26)';
  ['EXERCISE', 'SETS', '', 'REPS', 'WEIGHT'].forEach((h, i) => { ctx.textAlign = i === 0 ? 'left' : 'center'; ctx.fillText(h, i === 0 ? colX[i] : colX[i] + colW[i] / 2, colHY); }); ctx.textAlign = 'left';

  const rH = 86, rowGap = 12, tableStart = colHY + 24;
  const maxFit = Math.floor((H - 36 - tableStart) / (rH + rowGap));
  const showCount = Math.min(exercises.length, maxFit > 0 ? maxFit : exercises.length);

  exercises.slice(0, showCount).forEach((ex, idx) => {
    const ry = tableStart + idx * (rH + rowGap);
    const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, ry, W - PAD * 2, rH, 16); ctx.fillStyle = 'rgba(255,255,255,0.055)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    ctx.font = '700 34px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.fillText(name, colX[0], ry + 54, colW[0] - 10);
    ctx.save(); ctx.beginPath(); ctx.roundRect(colX[1], ry + 18, colW[1], 52, 10); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.restore();
    ctx.font = '700 32px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.textAlign = 'center'; ctx.fillText(String(ex.sets || ex.set_count || '—'), colX[1] + colW[1] / 2, ry + 52);
    ctx.font = '700 28px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.26)'; ctx.fillText('×', colX[2] + colW[2] / 2, ry + 52);
    ctx.save(); ctx.beginPath(); ctx.roundRect(colX[3], ry + 18, colW[3], 52, 10); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.restore();
    ctx.font = '700 32px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.textAlign = 'center'; ctx.fillText(String(ex.reps || ex.rep_count || '—'), colX[3] + colW[3] / 2, ry + 52);
    const wG = ctx.createLinearGradient(colX[4], ry, colX[4], ry + rH); wG.addColorStop(0, 'rgba(37,99,235,0.85)'); wG.addColorStop(1, 'rgba(29,78,216,0.95)');
    ctx.save(); ctx.beginPath(); ctx.roundRect(colX[4], ry + 18, colW[4], 52, 10); ctx.fillStyle = wG; ctx.fill(); ctx.beginPath(); ctx.roundRect(colX[4] + 1, ry + 19, colW[4] - 2, 18, [9, 9, 0, 0]); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.restore();
    ctx.font = '800 32px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.fillText(`${String(ex.weight ?? ex.weight_kg ?? '—')}kg`, colX[4] + colW[4] / 2, ry + 52); ctx.textAlign = 'left';
  });

  if (exercises.length > showCount) {
    ctx.font = '600 26px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.textAlign = 'center';
    ctx.fillText(`+${exercises.length - showCount} more`, W / 2, tableStart + showCount * (rH + rowGap) + 28); ctx.textAlign = 'left';
  }

  return canvas;
}

// ─── CLEAN CARD ───────────────────────────────────────────────────────────────
async function drawCleanCard(post, gymName) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  if (post.image_url) {
    const img = await loadImage(post.image_url);
    if (img) { const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s); }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0.40)'); g.addColorStop(0.25, 'rgba(0,0,0,0.0)'); g.addColorStop(0.65, 'rgba(0,0,0,0.0)'); g.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0d1117'); g.addColorStop(0.45, '#111827'); g.addColorStop(1, '#0f172a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

  // Top centred branding
  await drawCentredBrand(ctx, W, 140, 68, 58);

  // Bottom block — all centred
  const titleText = post.workout_name || 'Workout';
  let titleSz = 108; ctx.font = `900 ${titleSz}px -apple-system,sans-serif`;
  while (ctx.measureText(titleText).width > W - 144 && titleSz > 60) { titleSz -= 4; ctx.font = `900 ${titleSz}px -apple-system,sans-serif`; }
  ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 32;
  ctx.fillText(titleText, W / 2, H - 248); ctx.shadowBlur = 0;

  if (gymName) {
    ctx.font = '600 38px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.70)'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 10; ctx.fillText(gymName, W / 2, H - 192); ctx.shadowBlur = 0;
  }

  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.font = '500 30px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.textAlign = 'center';
  ctx.fillText(dateStr.toUpperCase(), W / 2, gymName ? H - 150 : H - 192);

  return canvas;
}

// ─── React Preview: Stats ─────────────────────────────────────────────────────
function StatsPreview({ post, gymName }) {
  const exercises = post.workout_exercises || [];
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const footerLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;

  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0d16', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.28) 0%,rgba(0,0,0,0) 16%,rgba(0,0,0,0) 50%,rgba(0,0,0,0.82) 68%,rgba(0,0,0,0.97) 100%)' }} />
      </>) : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0a0d16,#111827,#0d1320)' }} />}

      {/* TOP LEFT: CoStride branding */}
      <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px 11px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
        <img src={LOGO_URL} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
        <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>CoStride</span>
      </div>

      {/* BOTTOM BLOCK */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Title centred */}
        <div style={{ color: 'white', fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 2px 16px rgba(0,0,0,0.7)', marginBottom: 7, textAlign: 'center', width: '100%' }}>
          {post.workout_name || 'Workout'}
        </div>

        {/* Thin divider */}
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.13)', marginBottom: 9 }} />

        {/* Inline stat row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          {[
            { label: 'Exercises', value: exercises.length || '—' },
            { label: 'Duration',  value: post.workout_duration || '—' },
          ].map(({ label, value }, i, arr) => (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 14px' }}>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 900, lineHeight: 1, marginBottom: 3 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.20)', flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
          {footerLine}
        </div>
      </div>
    </div>
  );
}

// ─── React Preview: Breakdown ─────────────────────────────────────────────────
function BreakdownPreview({ post, gymName }) {
  const exercises = post.workout_exercises || [];
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  const topLine = gymName ? `${gymName}  ·  ${dateStr}` : dateStr;

  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.26)', transform: 'scale(1.08)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,14,0.50)' }} />
      </>) : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117,#111827)' }} />}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '8px 10px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
          <img src={LOGO_URL} alt="" style={{ width: 13, height: 13, borderRadius: 3, objectFit: 'cover' }} />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 800, letterSpacing: '-0.01em' }}>CoStride</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 3 }}>
          <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{topLine}</span>
        </div>
        <div style={{ color: 'white', fontSize: 14, fontWeight: 900, textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 6, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>{post.workout_name || 'Workout'}</div>

        {/* 3 stat pills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3.5, marginBottom: 6 }}>
          {[{ label: 'Exercises', value: exercises.length || '—' }, { label: 'Duration', value: post.workout_duration || '—' }, { label: 'Volume', value: post.workout_volume || '—' }].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 6, padding: '4px 3px', textAlign: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09)' }}>
              <div style={{ color: 'white', fontSize: 9.5, fontWeight: 900, lineHeight: 1 }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 5.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 8px 24px 38px', gap: 2.5, paddingLeft: 4, marginBottom: 3 }}>
          {['Exercise', 'Sets', '', 'Reps', 'Wt'].map((h, i) => (
            <div key={i} style={{ color: 'rgba(255,255,255,0.26)', fontSize: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Exercise rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, overflow: 'hidden' }}>
          {exercises.map((ex, idx) => {
            const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 24px 8px 24px 38px', gap: 2.5, alignItems: 'center', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 6, padding: '3px 4px 3px 6px', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <div style={{ color: 'white', fontSize: 7, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 4, color: 'rgba(255,255,255,0.88)', fontSize: 7, fontWeight: 700, textAlign: 'center', padding: '1.5px 0', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}>{ex.sets || ex.set_count || '—'}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 6.5, textAlign: 'center', fontWeight: 700 }}>×</div>
                <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 4, color: 'rgba(255,255,255,0.88)', fontSize: 7, fontWeight: 700, textAlign: 'center', padding: '1.5px 0', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}>{ex.reps || ex.rep_count || '—'}</div>
                <div style={{ background: 'linear-gradient(180deg,rgba(59,130,246,0.9),rgba(29,78,216,0.95))', borderRadius: 5, color: 'white', fontSize: 6.5, fontWeight: 800, textAlign: 'center', padding: '1.5px 0', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}>{ex.weight ?? ex.weight_kg ?? '—'}<span style={{ fontSize: 5 }}>kg</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── React Preview: Clean ─────────────────────────────────────────────────────
function CleanPreview({ post, gymName }) {
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.38) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,0) 65%,rgba(0,0,0,0.90) 100%)' }} />
      </>) : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117,#111827,#0f172a)' }} />}

      {/* Top centred */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '11px 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <img src={LOGO_URL} alt="" style={{ width: 15, height: 15, borderRadius: 3.5, objectFit: 'cover', flexShrink: 0 }} />
        <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, fontWeight: 900, textShadow: '0 1px 6px rgba(0,0,0,0.8)', letterSpacing: '-0.02em' }}>CoStride</span>
      </div>

      {/* Bottom block */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: 21, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 2px 20px rgba(0,0,0,0.85)', textAlign: 'center', marginBottom: 5 }}>
          {post.workout_name || 'Workout'}
        </div>
        {gymName && (
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 8, fontWeight: 700, textAlign: 'center', marginBottom: 3, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{gymName}</div>
        )}
        <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 7, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>{dateStr}</div>
      </div>
    </div>
  );
}

// ─── Sharing helpers ──────────────────────────────────────────────────────────
async function getImageFile(blob, name) { return new File([blob], name, { type: 'image/png' }); }
async function shareImageNative(blob, post, extraText = '') {
  const name = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
  const file = await getImageFile(blob, name);
  const shareData = { files: [file], text: extraText || `Check out my ${post.workout_name || 'workout'} on CoStride 💪` };
  if (navigator.share && navigator.canShare?.(shareData)) { await navigator.share(shareData); }
  else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); toast.success('Image saved!'); }
}
async function shareToAppWithScheme(blob, post, urlScheme) {
  const name = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
  const file = await getImageFile(blob, name);
  const shareData = { files: [file], text: `My ${post.workout_name || 'workout'} on CoStride 💪` };
  if (navigator.share && navigator.canShare?.(shareData)) { navigator.share(shareData).catch(() => {}); setTimeout(() => { try { window.location.href = urlScheme; } catch (_) {} }, 600); }
  else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); toast.info('Image saved — open the app and share from your camera roll'); }
}

// ─── App buttons ──────────────────────────────────────────────────────────────
const APP_BUTTONS = [
  { id: 'instagram_story', label: 'Instagram\nStory', icon: (<svg viewBox="0 0 60 60" width="60" height="60"><defs><radialGradient id="ig1" cx="30%" cy="107%" r="120%"><stop offset="0%" stopColor="#ffd600"/><stop offset="50%" stopColor="#ff6f00"/><stop offset="100%" stopColor="#ff6f00" stopOpacity="0"/></radialGradient><radialGradient id="ig2" cx="10%" cy="100%" r="100%"><stop offset="0%" stopColor="#ff4081"/><stop offset="60%" stopColor="#ff4081" stopOpacity="0"/></radialGradient><linearGradient id="ig3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ff6f00" stopOpacity="0"/><stop offset="40%" stopColor="#e040fb"/><stop offset="100%" stopColor="#7c4dff"/></linearGradient></defs><rect width="60" height="60" rx="14" fill="#000"/><rect width="60" height="60" rx="14" fill="url(#ig1)"/><rect width="60" height="60" rx="14" fill="url(#ig2)"/><rect width="60" height="60" rx="14" fill="url(#ig3)"/><rect x="14" y="14" width="32" height="32" rx="8" fill="none" stroke="white" strokeWidth="3"/><circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="3"/><circle cx="41.5" cy="18.5" r="2.5" fill="white"/></svg>), action: (blob, post) => shareToAppWithScheme(blob, post, 'instagram-stories://share') },
  { id: 'instagram_dm', label: 'Instagram\nMessages', icon: (<svg viewBox="0 0 60 60" width="60" height="60"><defs><radialGradient id="igdm1" cx="30%" cy="107%" r="120%"><stop offset="0%" stopColor="#ffd600"/><stop offset="50%" stopColor="#ff6f00"/><stop offset="100%" stopColor="#ff6f00" stopOpacity="0"/></radialGradient><radialGradient id="igdm2" cx="10%" cy="100%" r="100%"><stop offset="0%" stopColor="#ff4081"/><stop offset="60%" stopColor="#ff4081" stopOpacity="0"/></radialGradient><linearGradient id="igdm3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ff6f00" stopOpacity="0"/><stop offset="40%" stopColor="#e040fb"/><stop offset="100%" stopColor="#7c4dff"/></linearGradient></defs><rect width="60" height="60" rx="14" fill="#000"/><rect width="60" height="60" rx="14" fill="url(#igdm1)"/><rect width="60" height="60" rx="14" fill="url(#igdm2)"/><rect width="60" height="60" rx="14" fill="url(#igdm3)"/><path d="M14 30 L46 18 L38 46 L28 36 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/><path d="M28 36 L26 44 L32 38" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/><path d="M28 36 L46 18" fill="none" stroke="white" strokeWidth="2.5"/></svg>), action: (blob, post) => shareImageNative(blob, post, `My ${post.workout_name || 'workout'} on CoStride 💪`) },
  { id: 'snapchat', label: 'Snapchat', icon: (<svg viewBox="0 0 60 60" width="60" height="60"><rect width="60" height="60" rx="14" fill="#FFFC00"/><path d="M30 13c-5.5 0-10 4.5-10 10v1.5c-1 .2-2.5.8-2.5 2 0 1 .8 1.8 1.9 2-.5 1.4-1.4 3-3.3 3.9-.7.3-1 1-.7 1.7.5 1.2 2.4 1.6 3.9 1.7.2.5.3 1.2.8 1.5.3.2.8 0 1.5-.2.9-.3 2.1-.7 3.4-.7s2.5.4 3.4.7c.7.2 1.2.4 1.5.2.5-.3.6-1 .8-1.5 1.5-.1 3.4-.5 3.9-1.7.3-.7 0-1.4-.7-1.7-1.9-.9-2.8-2.5-3.3-3.9 1.1-.2 1.9-.9 1.9-2 0-1.2-1.5-1.8-2.5-2V23c0-5.5-4.5-10-10-10z" fill="black"/></svg>), action: (blob, post) => shareToAppWithScheme(blob, post, 'snapchat://') },
  { id: 'whatsapp', label: 'WhatsApp', icon: (<svg viewBox="0 0 60 60" width="60" height="60"><rect width="60" height="60" rx="14" fill="#25D366"/><path d="M30 13C20.6 13 13 20.6 13 30c0 3.7 1.2 7.1 3.2 9.9L14 46l6.4-2.1C23 45.5 26.4 47 30 47c9.4 0 17-7.6 17-17S39.4 13 30 13zm8.9 23.8c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.8.2-2.9-.2-.7-.2-1.6-.5-2.7-1-4.7-2.1-7.8-6.9-8-7.2-.2-.3-1.9-2.5-1.9-4.8s1.2-3.4 1.6-3.9c.4-.5.9-.6 1.2-.6h.9c.3 0 .7-.1 1 .8.4.9 1.3 3.2 1.4 3.4.1.2.2.5 0 .8-.2.3-.2.5-.4.8-.2.3-.4.6-.6.8-.2.2-.4.5-.2.9.3.5 1.1 1.9 2.4 3 1.7 1.5 3 2 3.5 2.2.5.2.7.2 1-.1.3-.3 1.1-1.3 1.4-1.7.3-.5.6-.4 1-.2.4.2 2.6 1.2 3.1 1.4.5.2.8.3.9.5.1.2.1 1.1-.3 2.2z" fill="white"/></svg>), action: (blob, post) => shareImageNative(blob, post, `My ${post.workout_name || 'workout'} on CoStride 💪`) },
  { id: 'messages', label: 'Message', icon: (<svg viewBox="0 0 60 60" width="60" height="60"><defs><linearGradient id="msg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#5BF75B"/><stop offset="100%" stopColor="#27C227"/></linearGradient></defs><rect width="60" height="60" rx="14" fill="url(#msg)"/><path d="M30 14C20.6 14 13 20.6 13 28.5c0 4.3 2 8.2 5.2 10.9L17 46l6.5-3.2c2 .7 4.2 1.2 6.5 1.2 9.4 0 17-6.5 17-14.5S39.4 14 30 14z" fill="white"/></svg>), action: (blob, post) => shareImageNative(blob, post, `My ${post.workout_name || 'workout'} on CoStride 💪`) },
  { id: 'more', label: 'More', icon: (<svg viewBox="0 0 60 60" width="60" height="60"><rect width="60" height="60" rx="14" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/><circle cx="18" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/><circle cx="30" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/><circle cx="42" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/></svg>), action: (blob, post) => shareImageNative(blob, post) },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function WorkoutShareModal({ open, onClose, post, gymName }) {
  const [activeCard, setActiveCard] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => { if (open) setActiveCard(0); }, [open]);

  const cards = [
    { label: 'Summary',   drawFn: drawStatsCard,     node: <StatsPreview post={post || {}} gymName={gymName} /> },
    { label: 'Breakdown', drawFn: drawBreakdownCard,  node: <BreakdownPreview post={post || {}} gymName={gymName} /> },
    { label: 'Clean',     drawFn: drawCleanCard,      node: <CleanPreview post={post || {}} gymName={gymName} /> },
  ];

  const getCanvas = useCallback(() => cards[activeCard].drawFn(post, gymName), [activeCard, post, gymName]);

  const handleBtn = useCallback(async (btn) => {
    if (loadingId) return; setLoadingId(btn.id);
    try { const canvas = await getCanvas(); const blob = await canvasToBlob(canvas); await btn.action(blob, post); }
    catch (e) { if (e?.name !== 'AbortError') { console.error(e); toast.error('Could not share'); } }
    finally { setLoadingId(null); }
  }, [loadingId, getCanvas, post]);

  const handleSave = useCallback(async () => {
    if (loadingId) return; setLoadingId('save');
    try {
      const canvas = await getCanvas(); const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
      a.click(); URL.revokeObjectURL(url); toast.success('Saved!');
    } catch (e) { console.error(e); toast.error('Could not save'); }
    finally { setLoadingId(null); }
  }, [loadingId, getCanvas, post]);

  const handleTouchStart = useCallback((e) => { touchStartXRef.current = e.touches[0].clientX; touchStartYRef.current = e.touches[0].clientY; setIsDragging(false); setDragOffset(0); }, []);
  const handleTouchMove = useCallback((e) => {
    if (touchStartXRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = Math.abs(e.touches[0].clientY - (touchStartYRef.current || 0));
    if (Math.abs(dx) > dy && Math.abs(dx) > 5) {
      setIsDragging(true);
      const atStart = activeCard === 0 && dx > 0, atEnd = activeCard === cards.length - 1 && dx < 0;
      setDragOffset(dx * ((atStart || atEnd) ? 0.25 : 1)); e.preventDefault();
    }
  }, [activeCard, cards.length]);
  const handleTouchEnd = useCallback((e) => {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartYRef.current || 0));
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      if (dx < 0 && activeCard < cards.length - 1) setActiveCard(v => v + 1);
      else if (dx > 0 && activeCard > 0) setActiveCard(v => v - 1);
    }
    touchStartXRef.current = null; touchStartYRef.current = null; setIsDragging(false); setDragOffset(0);
  }, [activeCard, cards.length]);

  if (!open || !post) return null;

  const cardWidthPercent = 100 / cards.length;
  const baseTranslate = -(activeCard * cardWidthPercent);
  const containerWidth = containerRef.current?.offsetWidth || 220;
  const dragPercent = (dragOffset / (containerWidth * cards.length)) * 100;
  const translateX = isDragging ? `${baseTranslate + dragPercent}%` : `${baseTranslate}%`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} />

          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011, maxHeight: 'calc(100dvh - 80px)', display: 'flex', flexDirection: 'column', background: 'rgba(10,10,18,0.98)', borderTop: '1px solid rgba(255,255,255,0.09)', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 'max(env(safe-area-inset-bottom,0px),12px)', fontFamily: "'SF Pro Display',-apple-system,sans-serif", overflow: 'hidden' }}>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.22)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 18px 8px', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Activity</span>
            </div>

            <div style={{ padding: '0 18px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div ref={containerRef} style={{ width: 'min(57.2vw, 242px)', flexShrink: 0, overflow: 'hidden', borderRadius: 14, touchAction: 'pan-y', boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 16px 40px rgba(0,0,0,0.6)' }}
                  onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                  <div style={{ display: 'flex', width: `${cards.length * 100}%`, transform: `translateX(${translateX})`, transition: isDragging ? 'none' : 'transform 0.36s cubic-bezier(0.25,0.46,0.45,0.94)', willChange: 'transform' }}>
                    {cards.map((card, i) => (
                      <div key={i} style={{ width: `${100 / cards.length}%`, flexShrink: 0 }}>{card.node}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, flexShrink: 0 }}>
              {cards.map((_, i) => (
                <button key={i} onClick={() => setActiveCard(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                  <div style={{ width: activeCard === i ? 18 : 6, height: 6, borderRadius: 3, background: activeCard === i ? 'white' : 'rgba(255,255,255,0.18)', transition: 'all 0.24s cubic-bezier(0.34,1.56,0.64,1)' }} />
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 4, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em', flexShrink: 0 }}>{cards[activeCard].label}</div>

            <div style={{ padding: '12px 18px 0', flexShrink: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px 0' }}>Share to</p>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                {APP_BUTTONS.map((btn) => (
                  <button key={btn.id} onClick={() => handleBtn(btn)} disabled={!!loadingId}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: loadingId ? 'default' : 'pointer', opacity: loadingId && loadingId !== btn.id ? 0.28 : 1, flexShrink: 0, padding: 0, transition: 'opacity 0.15s' }}>
                    <div style={{ position: 'relative', width: 60, height: 60 }}>
                      {loadingId === btn.id ? (
                        <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.18)', borderTopColor: 'white', borderRadius: '50%', animation: 'cs-spin 0.65s linear infinite' }} />
                        </div>
                      ) : btn.icon}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.58)', fontSize: 10, fontWeight: 600, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2, maxWidth: 64 }}>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={!!loadingId}
                style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: loadingId === 'save' ? 'rgba(255,255,255,0.28)' : 'white', fontSize: 14, fontWeight: 700, cursor: loadingId ? 'default' : 'pointer', transition: 'all 0.15s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                {loadingId === 'save' ? 'Saving…' : 'Save Image'}
              </button>
            </div>
          </motion.div>

          <style>{`@keyframes cs-spin { to { transform: rotate(360deg) } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}