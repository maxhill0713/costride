import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

// ── Canvas helpers ────────────────────────────────────────────────────────────
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
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  );
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
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0d1117'); grad.addColorStop(0.45, '#111827'); grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  }
  const PAD = 72, TOP = 80;
  const logo = await loadImage(LOGO_URL);
  if (logo) { ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, TOP, 72, 72, 18); ctx.clip(); ctx.drawImage(logo, PAD, TOP, 72, 72); ctx.restore(); }
  ctx.font = '800 52px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
  ctx.fillText('CoStride', PAD + 72 + 24, TOP + 50); ctx.shadowBlur = 0;
  ctx.font = '600 38px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right';
  ctx.fillText(new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - PAD, TOP + 50);
  ctx.textAlign = 'left';
  const nameY = H - 580;
  ctx.font = '900 88px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20;
  ctx.fillText(post.workout_name || 'Workout', PAD, nameY, W - PAD * 2); ctx.shadowBlur = 0;
  const stats = [{ label: 'EXERCISES', value: String(exercises.length || '—') }, { label: 'DURATION', value: post.workout_duration || '—' }, { label: 'VOLUME', value: post.workout_volume || '—' }];
  const pillY = nameY + 60, pillH = 130, pillGap = 24, pillW = (W - PAD * 2 - pillGap * 2) / 3;
  stats.forEach((s, i) => {
    const px = PAD + i * (pillW + pillGap);
    ctx.save(); ctx.beginPath(); ctx.roundRect(px, pillY, pillW, pillH, 28); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    ctx.font = '900 56px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.fillText(s.value, px + pillW / 2, pillY + 68, pillW - 24);
    ctx.font = '700 26px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.52)'; ctx.fillText(s.label, px + pillW / 2, pillY + 104);
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
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const octx = off.getContext('2d');
    const img = await loadImage(post.image_url);
    if (img) { const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight); const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale; octx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh); }
    ctx.filter = 'blur(28px) brightness(0.32)'; ctx.drawImage(off, -40, -40, W + 80, H + 80); ctx.filter = 'none';
    ctx.fillStyle = 'rgba(5,7,16,0.5)'; ctx.fillRect(0, 0, W, H);
  } else { ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H); }
  const PAD = 60, TOP = 80;
  const logo = await loadImage(LOGO_URL);
  if (logo) { ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, TOP, 60, 60, 14); ctx.clip(); ctx.drawImage(logo, PAD, TOP, 60, 60); ctx.restore(); }
  ctx.font = '800 44px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.fillText('CoStride', PAD + 72, TOP + 42);
  ctx.font = '700 34px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.textAlign = 'right';
  ctx.fillText(new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase(), W - PAD, TOP + 42); ctx.textAlign = 'left';
  const pillTop = TOP + 100;
  ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, pillTop, W - PAD * 2, 180, 28); ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  ctx.font = '900 58px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.fillText(post.workout_name || 'Workout', PAD + 30, pillTop + 68, W - PAD * 2 - 60);
  const miniStats = [{ label: 'EXERCISES', value: String(exercises.length || '—') }, { label: 'DURATION', value: post.workout_duration || '—' }, { label: 'VOLUME', value: post.workout_volume || '—' }];
  const miniW = (W - PAD * 2 - 60) / 3;
  miniStats.forEach((s, i) => { const mx = PAD + 30 + i * miniW; ctx.font = '800 42px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.fillText(s.value, mx, pillTop + 138, miniW - 20); ctx.font = '700 26px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fillText(s.label, mx, pillTop + 170); });
  const tableTop = pillTop + 230;
  const colW = [W - PAD * 2 - 320, 100, 50, 100, 160]; const colX = [PAD + 20];
  colW.slice(0, -1).forEach((w, i) => colX.push(colX[i] + colW[i] + 10));
  ctx.font = '700 26px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ['EXERCISE', 'SETS', '', 'REPS', 'WEIGHT'].forEach((h, i) => { ctx.textAlign = i > 0 ? 'center' : 'left'; ctx.fillText(h, i > 0 ? colX[i] + colW[i] / 2 : colX[i], tableTop); }); ctx.textAlign = 'left';
  const rowH = 88; const maxRows = Math.min(exercises.length, Math.floor((H - tableTop - 80) / (rowH + 10)));
  exercises.slice(0, maxRows).forEach((ex, idx) => {
    const ry = tableTop + 20 + idx * (rowH + 10);
    const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    ctx.save(); ctx.beginPath(); ctx.roundRect(PAD, ry, W - PAD * 2, rowH, 18); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    ctx.font = '700 34px -apple-system,sans-serif'; ctx.fillStyle = 'white'; ctx.fillText(name, colX[0], ry + 56, colW[0] - 10);
    [[String(ex.sets || ex.set_count || '—'), 1], [String(ex.reps || ex.rep_count || '—'), 3]].forEach(([val, ci]) => {
      ctx.save(); ctx.beginPath(); ctx.roundRect(colX[ci], ry + 14, colW[ci], 58, 10); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill(); ctx.restore();
      ctx.font = '700 34px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'center'; ctx.fillText(val, colX[ci] + colW[ci] / 2, ry + 54);
    });
    ctx.font = '700 30px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillText('×', colX[2] + colW[2] / 2, ry + 54);
    const wGrad = ctx.createLinearGradient(colX[4], ry, colX[4], ry + rowH); wGrad.addColorStop(0, 'rgba(59,130,246,0.9)'); wGrad.addColorStop(1, 'rgba(29,78,216,0.95)');
    ctx.save(); ctx.beginPath(); ctx.roundRect(colX[4], ry + 14, colW[4], 58, 10); ctx.fillStyle = wGrad; ctx.fill(); ctx.restore();
    ctx.fillStyle = 'white'; ctx.font = '800 34px -apple-system,sans-serif'; ctx.fillText(`${String(ex.weight ?? ex.weight_kg ?? '—')}kg`, colX[4] + colW[4] / 2, ry + 54); ctx.textAlign = 'left';
  });
  if (exercises.length > maxRows) { ctx.font = '600 30px -apple-system,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.textAlign = 'center'; ctx.fillText(`+${exercises.length - maxRows} more exercises`, W / 2, H - 50); ctx.textAlign = 'left'; }
  return canvas;
}

// ── Compact card previews (16:9-ish height, not full 9:16) ────────────────────
// aspectRatio changed to 1.6 (landscape-ish story card feel) so it fits
// on screen with room for the share row underneath without scrolling.
function StatsPreview({ post }) {
  const exercises = post.workout_exercises || [];
  const comment = (() => {
    if (!post.content) return null;
    return post.content.split('\n').filter(l => { const t = l.trim(); return t && !t.includes('Just finished') && !/[0-9]+\s*[xX]\s*[0-9]+/.test(t) && !/[0-9]+(kg|lbs)/i.test(t); }).join(' ').trim() || null;
  })();
  return (
    <div style={{ width: '100%', aspectRatio: '3/2', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.02) 25%,rgba(0,0,0,0.55) 55%,rgba(0,0,0,0.92) 100%)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 45%,#0f172a 100%)' }} />
      )}
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <img src={LOGO_URL} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover' }} />
          <span style={{ color: 'white', fontSize: 11, fontWeight: 800, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>CoStride</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 600 }}>
          {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      {/* Bottom content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 14px' }}>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}>
          {post.workout_name || 'Workout'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          {[{ label: 'Exercises', value: exercises.length || '—' }, { label: 'Duration', value: post.workout_duration || '—' }, { label: 'Volume', value: post.workout_volume || '—' }].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
        {comment && <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 500, lineHeight: 1.4, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: 6 }}>"{comment}"</div>}
      </div>
    </div>
  );
}

function BreakdownPreview({ post }) {
  const exercises = post.workout_exercises || [];
  return (
    <div style={{ width: '100%', aspectRatio: '3/2', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0a0f', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.28)', transform: 'scale(1.08)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,7,16,0.45)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 100%)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <img src={LOGO_URL} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
            <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>CoStride</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
            {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '7px 10px', marginBottom: 6 }}>
          <div style={{ color: 'white', fontSize: 11, fontWeight: 900, marginBottom: 4 }}>{post.workout_name || 'Workout'}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ label: 'Exercises', value: exercises.length || '—' }, { label: 'Duration', value: post.workout_duration || '—' }, { label: 'Volume', value: post.workout_volume || '—' }].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 7, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {exercises.slice(0, 6).map((ex, idx) => {
            const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 26px 8px 26px 40px', gap: 3, alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 6, padding: '3px 3px 3px 6px' }}>
                <div style={{ color: 'white', fontSize: 8, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: '1px 0' }}>{ex.sets || ex.set_count || '—'}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 7, textAlign: 'center', fontWeight: 700 }}>×</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: 700, textAlign: 'center', padding: '1px 0' }}>{ex.reps || ex.rep_count || '—'}</div>
                <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.85),rgba(29,78,216,0.95))', borderRadius: 5, color: 'white', fontSize: 8, fontWeight: 800, textAlign: 'center', padding: '1px 0' }}>
                  {ex.weight ?? ex.weight_kg ?? '—'}<span style={{ fontSize: 6 }}>kg</span>
                </div>
              </div>
            );
          })}
          {exercises.length > 6 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, textAlign: 'center', paddingTop: 2 }}>+{exercises.length - 6} more</div>}
        </div>
      </div>
    </div>
  );
}

// ── Deep-link share helpers ───────────────────────────────────────────────────
// Save image to a temporary object URL, then open the app's URL scheme.
// iOS will open the app. The user then picks the image from their camera roll
// (or the app prompts them). This is exactly how Strava works — they save the
// image first then launch the URL scheme so the app opens ready to post.

async function saveBlobToObjectURL(blob) {
  return URL.createObjectURL(blob);
}

async function triggerNativeShare(blob, post, { text = '', title = '' } = {}) {
  const fileName = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
  } else {
    // Desktop fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
    toast.success('Image saved!');
  }
}

async function saveToPhotosAndOpen(blob, post, urlScheme) {
  // 1. Trigger Save Image to camera roll via native share if possible,
  //    otherwise download. Then open the app URL scheme.
  const fileName = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  // Try clipboard write so user can paste — works on most iOS browsers
  try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); } catch (_) {}

  // Save to camera roll using native share sheet (download action)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    // On iOS we directly open the native share with the file — this lets user
    // tap "Save Image" then switch to their chosen app with the image in Photos.
    // We DON'T await this — we fire it and also open the URL scheme immediately
    // so both happen in parallel.
    navigator.share({ files: [file] }).catch(() => {});
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  }

  // 2. Open the app via URL scheme (after short delay so share sheet renders first)
  if (urlScheme) {
    setTimeout(() => { window.location.href = urlScheme; }, 400);
  }
}

// App definitions — icon + deep link URL scheme
const APP_BUTTONS = [
  {
    id: 'instagram_story',
    label: 'Instagram\nStory',
    bg: 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    // instagram://story — launches Instagram camera/story creation
    urlScheme: 'instagram-stories://share',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
      </svg>
    ),
    action: async (blob, post) => {
      await saveToPhotosAndOpen(blob, post, 'instagram-stories://share');
    },
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    bg: '#FFFC00',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="black">
        <path d="M12.01 2C9.23 2 6.97 4.24 6.97 7.01v.74c-.54.1-1.31.42-1.31 1.08 0 .55.43.94.99 1.04-.25.72-.72 1.62-1.72 2.08-.35.17-.52.54-.35.9.27.64 1.27.82 2.06.91.09.26.17.62.43.8.18.1.43 0 .8-.09.46-.17 1.08-.36 1.83-.36s1.37.19 1.83.36c.37.09.62.19.8.09.26-.18.34-.54.43-.8.79-.09 1.79-.27 2.06-.91.17-.36 0-.73-.35-.9-1-.46-1.47-1.36-1.72-2.08.56-.1.99-.49.99-1.04 0-.66-.77-.98-1.31-1.08v-.74C17.05 4.24 14.79 2 12.01 2z"/>
      </svg>
    ),
    action: async (blob, post) => {
      await saveToPhotosAndOpen(blob, post, 'snapchat://');
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
      // WhatsApp doesn't accept image via URL scheme directly — use native share
      await triggerNativeShare(blob, post, { text: `My ${post.workout_name || 'workout'} on CoStride 💪` });
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
      await triggerNativeShare(blob, post, { text: `My ${post.workout_name || 'workout'} on CoStride 💪` });
    },
  },
  {
    id: 'more',
    label: 'More',
    bg: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
      </svg>
    ),
    action: async (blob, post) => {
      // Opens full iOS native share sheet
      await triggerNativeShare(blob, post, { title: post.workout_name || 'Workout', text: 'Check out my workout on CoStride 💪' });
    },
  },
];

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function WorkoutShareModal({ open, onClose, post }) {
  const [activeCard, setActiveCard] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const touchStartXRef = useRef(null);

  useEffect(() => { if (open) setActiveCard(0); }, [open]);

  const getCanvas = useCallback(
    () => activeCard === 0 ? drawStatsCard(post) : drawBreakdownCard(post),
    [activeCard, post]
  );

  const handleAppBtn = useCallback(async (btn) => {
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
    { label: 'Summary', node: <StatsPreview post={post} /> },
    { label: 'Full Breakdown', node: <BreakdownPreview post={post} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          />

          {/* Sheet — fixed height so nothing scrolls */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011,
              // Never taller than viewport minus 80px safe tap zone at top
              maxHeight: 'calc(100dvh - 80px)',
              background: 'rgba(12,12,20,0.98)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
              fontFamily: "'SF Pro Display',-apple-system,sans-serif",
              display: 'flex', flexDirection: 'column',
              // No overflow scroll — content is intentionally compact enough to fit
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 8px', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Activity</span>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            {/* ── Card carousel — compact 3:2 ratio ── */}
            <div
              style={{ padding: '0 18px', flexShrink: 0 }}
              onTouchStart={e => { touchStartXRef.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (touchStartXRef.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartXRef.current;
                if (Math.abs(dx) > 40) setActiveCard(v => dx < 0 ? Math.min(cards.length - 1, v + 1) : Math.max(0, v - 1));
                touchStartXRef.current = null;
              }}
            >
              <div style={{ overflow: 'hidden', borderRadius: 16 }}>
                <div style={{ display: 'flex', gap: 12, transform: `translateX(calc(${-activeCard * 100}% - ${activeCard * 12}px))`, transition: 'transform 0.34s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
                  {cards.map((card, i) => (
                    <div key={i} style={{ minWidth: '100%', flexShrink: 0 }}>{card.node}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8, marginBottom: 2, flexShrink: 0 }}>
              {cards.map((card, i) => (
                <button key={i} onClick={() => setActiveCard(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0 }}>
                  <div style={{ width: activeCard === i ? 20 : 6, height: 6, borderRadius: 3, background: activeCard === i ? 'white' : 'rgba(255,255,255,0.2)', transition: 'all 0.26s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  <span style={{ color: activeCard === i ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: 700, transition: 'color 0.2s' }}>{card.label}</span>
                </button>
              ))}
            </div>

            {/* ── Share to row ── */}
            <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 2px' }}>Share to</p>
              <div style={{ display: 'flex', gap: 14 }}>
                {APP_BUTTONS.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleAppBtn(btn)}
                    disabled={!!loadingId}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      background: 'none', border: 'none',
                      cursor: loadingId ? 'default' : 'pointer',
                      opacity: loadingId && loadingId !== btn.id ? 0.3 : 1,
                      flexShrink: 0, padding: 0, transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: btn.bg, border: btn.border || 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {loadingId === btn.id
                        ? <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'cs-spin 0.65s linear infinite' }} />
                        : btn.icon}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2, maxWidth: 56 }}>
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
                  width: '100%', padding: '13px 0', borderRadius: 14,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.13)',
                  color: loadingId === 'save' ? 'rgba(255,255,255,0.35)' : 'white',
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