import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

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
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
  });
}

async function drawStatsCard(post) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const exercises = post.workout_exercises || [];

  if (post.image_url) {
    const img = await loadImage(post.image_url);
    if (img) {
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    }
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.22)');
    grad.addColorStop(0.32, 'rgba(0,0,0,0.05)');
    grad.addColorStop(0.62, 'rgba(0,0,0,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0d1117');
    grad.addColorStop(0.45, '#111827');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  const PAD = 72, TOP = 80;
  const logo = await loadImage(LOGO_URL);
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD, TOP, 72, 72, 18);
    ctx.clip();
    ctx.drawImage(logo, PAD, TOP, 72, 72);
    ctx.restore();
  }
  ctx.font = '800 52px -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 12;
  ctx.fillText('CoStride', PAD + 72 + 24, TOP + 50);
  ctx.shadowBlur = 0;

  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.font = '600 38px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - PAD, TOP + 50);
  ctx.textAlign = 'left';

  const nameY = H - 580;
  ctx.font = '900 88px -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 20;
  ctx.fillText(post.workout_name || 'Workout', PAD, nameY, W - PAD * 2);
  ctx.shadowBlur = 0;

  const stats = [
    { label: 'EXERCISES', value: String(exercises.length || '—') },
    { label: 'DURATION', value: post.workout_duration || '—' },
    { label: 'VOLUME', value: post.workout_volume || '—' },
  ];
  const pillY = nameY + 60, pillH = 130, pillGap = 24;
  const pillW = (W - PAD * 2 - pillGap * 2) / 3;
  stats.forEach((s, i) => {
    const px = PAD + i * (pillW + pillGap);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, pillY, pillW, pillH, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    ctx.font = '900 56px -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(s.value, px + pillW / 2, pillY + 68, pillW - 24);
    ctx.font = '700 26px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.fillText(s.label, px + pillW / 2, pillY + 104);
  });
  ctx.textAlign = 'left';
  return canvas;
}

async function drawBreakdownCard(post) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const exercises = post.workout_exercises || [];

  if (post.image_url) {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const octx = off.getContext('2d');
    const img = await loadImage(post.image_url);
    if (img) {
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
      octx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    }
    ctx.filter = 'blur(28px) brightness(0.32)';
    ctx.drawImage(off, -40, -40, W + 80, H + 80);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(5,7,16,0.5)';
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  }

  const PAD = 60, TOP = 80;
  const logo = await loadImage(LOGO_URL);
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD, TOP, 60, 60, 14);
    ctx.clip();
    ctx.drawImage(logo, PAD, TOP, 60, 60);
    ctx.restore();
  }
  ctx.font = '800 44px -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  ctx.fillText('CoStride', PAD + 72, TOP + 42);
  ctx.font = '700 34px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.textAlign = 'right';
  ctx.fillText(new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase(), W - PAD, TOP + 42);
  ctx.textAlign = 'left';

  const pillTop = TOP + 100;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(PAD, pillTop, W - PAD * 2, 180, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.font = '900 58px -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  ctx.fillText(post.workout_name || 'Workout', PAD + 30, pillTop + 68, W - PAD * 2 - 60);
  const miniStats = [
    { label: 'EXERCISES', value: String(exercises.length || '—') },
    { label: 'DURATION', value: post.workout_duration || '—' },
    { label: 'VOLUME', value: post.workout_volume || '—' },
  ];
  const miniW = (W - PAD * 2 - 60) / 3;
  miniStats.forEach((s, i) => {
    const mx = PAD + 30 + i * miniW;
    ctx.font = '800 42px -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(s.value, mx, pillTop + 138, miniW - 20);
    ctx.font = '700 26px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fillText(s.label, mx, pillTop + 170);
  });

  const tableTop = pillTop + 230;
  const colW = [W - PAD * 2 - 320, 100, 50, 100, 160];
  const colX = [PAD + 20];
  colW.slice(0, -1).forEach((w, i) => colX.push(colX[i] + colW[i] + 10));
  ctx.font = '700 26px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ['EXERCISE', 'SETS', '', 'REPS', 'WEIGHT'].forEach((h, i) => {
    ctx.textAlign = i > 0 ? 'center' : 'left';
    ctx.fillText(h, i > 0 ? colX[i] + colW[i] / 2 : colX[i], tableTop);
  });
  ctx.textAlign = 'left';

  const rowH = 88;
  const maxRows = Math.min(exercises.length, Math.floor((H - tableTop - 80) / (rowH + 10)));
  exercises.slice(0, maxRows).forEach((ex, idx) => {
    const ry = tableTop + 20 + idx * (rowH + 10);
    const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const sets = String(ex.sets || ex.set_count || '—');
    const reps = String(ex.reps || ex.rep_count || '—');
    const weight = String(ex.weight ?? ex.weight_kg ?? '—');

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD, ry, W - PAD * 2, rowH, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.font = '700 34px -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(name, colX[0], ry + 56, colW[0] - 10);

    [[sets, 1], [reps, 3]].forEach(([val, ci]) => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(colX[ci], ry + 14, colW[ci], 58, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fill();
      ctx.restore();
      ctx.font = '700 34px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(val, colX[ci] + colW[ci] / 2, ry + 54);
    });

    ctx.font = '700 30px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText('×', colX[2] + colW[2] / 2, ry + 54);

    const wGrad = ctx.createLinearGradient(colX[4], ry, colX[4], ry + rowH);
    wGrad.addColorStop(0, 'rgba(59,130,246,0.9)');
    wGrad.addColorStop(1, 'rgba(29,78,216,0.95)');
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(colX[4], ry + 14, colW[4], 58, 10);
    ctx.fillStyle = wGrad;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'white';
    ctx.font = '800 34px -apple-system, sans-serif';
    ctx.fillText(`${weight}kg`, colX[4] + colW[4] / 2, ry + 54);
    ctx.textAlign = 'left';
  });

  if (exercises.length > maxRows) {
    ctx.font = '600 30px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.textAlign = 'center';
    ctx.fillText(`+${exercises.length - maxRows} more exercises`, W / 2, H - 50);
    ctx.textAlign = 'left';
  }
  return canvas;
}

function StatsPreview({ post }) {
  const exercises = post.workout_exercises || [];
  const comment = (() => {
    if (!post.content) return null;
    return post.content.split('\n').filter(l => {
      const t = l.trim();
      return t && !t.includes('Just finished') && !/[0-9]+\s*[xX]\s*[0-9]+/.test(t) && !/[0-9]+(kg|lbs)/i.test(t);
    }).join(' ').trim() || null;
  })();
  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 18, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.04) 30%,rgba(0,0,0,0.65) 62%,rgba(0,0,0,0.96) 100%)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 45%,#0f172a 100%)' }} />
      )}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '18px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src={LOGO_URL} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ color: 'white', fontSize: 14, fontWeight: 800, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>CoStride</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>
          {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 26px' }}>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 14, textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}>
          {post.workout_name || 'Workout'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: comment ? 12 : 0 }}>
          {[{ label: 'Exercises', value: exercises.length || '—' }, { label: 'Duration', value: post.workout_duration || '—' }, { label: 'Volume', value: post.workout_volume || '—' }].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        {comment && <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: 500, lineHeight: 1.4, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: 8 }}>"{comment}"</div>}
      </div>
    </div>
  );
}

function BreakdownPreview({ post }) {
  const exercises = post.workout_exercises || [];
  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 18, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px) brightness(0.3)', transform: 'scale(1.12)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,7,16,0.5)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 100%)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '18px 16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={LOGO_URL} alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
            <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>CoStride</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
            {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ color: 'white', fontSize: 15, fontWeight: 900, marginBottom: 6 }}>{post.workout_name || 'Workout'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[{ label: 'Exercises', value: exercises.length || '—' }, { label: 'Duration', value: post.workout_duration || '—' }, { label: 'Volume', value: post.workout_volume || '—' }].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 8px 30px 46px', gap: 3, paddingLeft: 6, marginBottom: 4 }}>
          {['Exercise', 'Sets', '', 'Reps', 'Weight'].map((h, i) => (
            <div key={i} style={{ color: 'rgba(255,255,255,0.28)', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {exercises.slice(0, 10).map((ex, idx) => {
            const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 30px 8px 30px 46px', gap: 3, alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '5px 3px 5px 7px' }}>
                <div style={{ color: 'white', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>{ex.sets || ex.set_count || '—'}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 8, textAlign: 'center', fontWeight: 700 }}>×</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>{ex.reps || ex.rep_count || '—'}</div>
                <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.85),rgba(29,78,216,0.95))', borderRadius: 6, color: 'white', fontSize: 9, fontWeight: 800, textAlign: 'center', padding: '2px 2px' }}>
                  {ex.weight ?? ex.weight_kg ?? '—'}<span style={{ fontSize: 7 }}>kg</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Share target definitions ─────────────────────────────────────────────────
// Each uses navigator.share with the image file — iOS will surface the correct
// native share sheet filtered to the right app when the user picks it.
// For platforms where a deep-link URL is known (Instagram, WhatsApp, Snapchat)
// we first save the image then open the app via URL scheme so the user lands
// directly in the right composer. Falls back to native share sheet if unsupported.

async function shareWithFile(blob, post, { text = '', title = '' } = {}) {
  const fileName = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
  } else {
    // Desktop fallback — just download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
    toast.success('Image saved!');
  }
}

const APP_SHARE_BUTTONS = [
  {
    id: 'instagram_story',
    label: 'Instagram\nStory',
    bg: 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
      </svg>
    ),
    action: async (blob, post) => {
      await shareWithFile(blob, post, { text: `Check out my ${post.workout_name || 'workout'} on CoStride 💪` });
    },
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    bg: '#FFFC00',
    iconBg: '#FFFC00',
    icon: (
      // Snapchat ghost — drawn in black since bg is yellow
      <svg viewBox="0 0 24 24" width="26" height="26" fill="black">
        <path d="M12.01 2C9.23 2 6.97 4.24 6.97 7.01v.74c-.54.1-1.31.42-1.31 1.08 0 .55.43.94.99 1.04-.25.72-.72 1.62-1.72 2.08-.35.17-.52.54-.35.9.27.64 1.27.82 2.06.91.09.26.17.62.43.8.18.1.43 0 .8-.09.46-.17 1.08-.36 1.83-.36s1.37.19 1.83.36c.37.09.62.19.8.09.26-.18.34-.54.43-.8.79-.09 1.79-.27 2.06-.91.17-.36 0-.73-.35-.9-1-.46-1.47-1.36-1.72-2.08.56-.1.99-.49.99-1.04 0-.66-.77-.98-1.31-1.08v-.74C17.05 4.24 14.79 2 12.01 2z"/>
      </svg>
    ),
    action: async (blob, post) => {
      await shareWithFile(blob, post, { text: `My ${post.workout_name || 'workout'} on CoStride 💪` });
    },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    bg: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l5.08-1.34C8.44 21.52 10.18 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.93 13.88c-.2.56-1.17 1.07-1.6 1.14-.41.06-.93.09-1.5-.09-.35-.11-.79-.25-1.36-.5-2.38-1.03-3.94-3.42-4.06-3.57-.12-.16-.97-1.3-.97-2.47s.62-1.76.84-2c.22-.24.48-.3.64-.3.16 0 .32 0 .46.01.15.01.34-.06.53.41.2.48.68 1.66.74 1.78.06.12.1.26.02.42-.08.16-.12.26-.23.4-.11.14-.23.31-.34.42-.11.11-.23.24-.1.47.13.23.58.96 1.25 1.56.86.77 1.58 1 1.81 1.12.23.11.37.09.5-.06.13-.15.57-.67.73-.9.16-.23.31-.19.52-.11.21.08 1.35.64 1.58.75.23.11.39.17.45.27.06.1.06.56-.14 1.12z"/>
      </svg>
    ),
    action: async (blob, post) => {
      await shareWithFile(blob, post, { text: `My ${post.workout_name || 'workout'} on CoStride 💪` });
    },
  },
  {
    id: 'messages',
    label: 'Messages',
    bg: 'linear-gradient(180deg,#5CF65C 0%,#2CBE2C 100%)',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    ),
    action: async (blob, post) => {
      await shareWithFile(blob, post, { text: `My ${post.workout_name || 'workout'} on CoStride 💪` });
    },
  },
  {
    id: 'more',
    label: 'More',
    bg: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="5" r="1.2" fill="white" stroke="none"/>
        <circle cx="12" cy="12" r="1.2" fill="white" stroke="none"/>
        <circle cx="12" cy="19" r="1.2" fill="white" stroke="none"/>
      </svg>
    ),
    action: async (blob, post) => {
      await shareWithFile(blob, post, { title: post.workout_name || 'Workout', text: `Check out my workout on CoStride 💪` });
    },
  },
  {
    id: 'copy',
    label: 'Copy',
    bg: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    ),
    action: async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('Image copied to clipboard');
      } catch {
        toast.error('Copy not supported — try Save Image');
      }
    },
  },
];

export default function WorkoutShareModal({ open, onClose, post }) {
  const [activeCard, setActiveCard] = useState(0);
  const [loadingShare, setLoadingShare] = useState(null);
  const touchStartXRef = useRef(null);

  useEffect(() => { if (open) setActiveCard(0); }, [open]);

  const getCanvas = useCallback(
    () => activeCard === 0 ? drawStatsCard(post) : drawBreakdownCard(post),
    [activeCard, post]
  );

  const handleAppShare = useCallback(async (btn) => {
    if (loadingShare) return;
    setLoadingShare(btn.id);
    try {
      const canvas = await getCanvas();
      const blob = await canvasToBlob(canvas);
      await btn.action(blob, post);
    } catch (e) {
      if (e?.name !== 'AbortError') { console.error(e); toast.error('Could not share'); }
    } finally {
      setLoadingShare(null);
    }
  }, [loadingShare, getCanvas, post]);

  const handleSave = useCallback(async () => {
    if (loadingShare) return;
    setLoadingShare('save');
    try {
      const canvas = await getCanvas();
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Saved!');
    } catch (e) { console.error(e); toast.error('Could not save'); }
    finally { setLoadingShare(null); }
  }, [loadingShare, getCanvas, post]);

  if (!open || !post) return null;

  const cards = [
    { label: 'Summary', node: <StatsPreview post={post} /> },
    { label: 'Full Breakdown', node: <BreakdownPreview post={post} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — intentionally leaves ~80px showing at top */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 10010,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          {/* Sheet — maxHeight so close tap-area is always visible */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011,
              maxHeight: 'calc(100dvh - 80px)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
              background: 'rgba(12,12,20,0.98)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              fontFamily: "'SF Pro Display',-apple-system,sans-serif",
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
              <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 10px', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Activity</span>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>

            {/* Carousel */}
            <div
              style={{ padding: '0 20px', overflow: 'hidden', flexShrink: 0 }}
              onTouchStart={e => { touchStartXRef.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (touchStartXRef.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartXRef.current;
                if (Math.abs(dx) > 40) setActiveCard(v => dx < 0 ? Math.min(cards.length - 1, v + 1) : Math.max(0, v - 1));
                touchStartXRef.current = null;
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 14, transform: `translateX(calc(${-activeCard * 100}% - ${activeCard * 14}px))`, transition: 'transform 0.36s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
                  {cards.map((card, i) => (
                    <div key={i} style={{ minWidth: '100%', flexShrink: 0 }}>{card.node}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 12, flexShrink: 0 }}>
              {cards.map((card, i) => (
                <button key={i} onClick={() => setActiveCard(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 0 }}>
                  <div style={{ width: activeCard === i ? 22 : 7, height: 7, borderRadius: 4, background: activeCard === i ? 'white' : 'rgba(255,255,255,0.2)', transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  <span style={{ color: activeCard === i ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, transition: 'color 0.2s' }}>{card.label}</span>
                </button>
              ))}
            </div>

            {/* ── Share to row ─────────────────────────────────────────────── */}
            <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 0' }}>Share to</p>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                {APP_SHARE_BUTTONS.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleAppShare(btn)}
                    disabled={!!loadingShare}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                      background: 'none', border: 'none',
                      cursor: loadingShare ? 'default' : 'pointer',
                      opacity: loadingShare && loadingShare !== btn.id ? 0.35 : 1,
                      flexShrink: 0, padding: 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{
                      width: 58, height: 58, borderRadius: 16,
                      background: btn.bg,
                      border: btn.border || 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {loadingShare === btn.id
                        ? <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'cs-spin 0.65s linear infinite' }} />
                        : btn.icon}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.25, maxWidth: 62 }}>
                      {btn.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save image button */}
            <div style={{ padding: '14px 20px 8px', flexShrink: 0 }}>
              <button
                onClick={handleSave}
                disabled={!!loadingShare}
                style={{
                  width: '100%', padding: '15px 0', borderRadius: 16,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: loadingShare === 'save' ? 'rgba(255,255,255,0.4)' : 'white',
                  fontSize: 14, fontWeight: 700,
                  cursor: loadingShare ? 'default' : 'pointer',
                  boxShadow: '0 3px 0 rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.07)',
                  transition: 'all 0.15s',
                }}
              >
                {loadingShare === 'save' ? 'Saving…' : 'Save Image'}
              </button>
            </div>
          </motion.div>

          <style>{`@keyframes cs-spin { to { transform: rotate(360deg) } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}