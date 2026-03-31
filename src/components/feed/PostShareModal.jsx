import React, { useState, useRef, useCallback } from 'react';
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

async function drawPostCard(post) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  if (post.image_url) {
    const img = await loadImage(post.image_url);
    if (img) {
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    }
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.25, 'rgba(0,0,0,0.1)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0d1117');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  const PAD = 72;

  // Avatar + name top-left
  if (post.member_avatar) {
    const av = await loadImage(post.member_avatar);
    if (av) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(PAD + 44, 92, 44, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(av, PAD, 48, 88, 88);
      ctx.restore();
    }
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(PAD + 44, 92, 44, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.restore();
    ctx.font = '700 48px -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText((post.member_name || '?').charAt(0).toUpperCase(), PAD + 44, 108);
    ctx.textAlign = 'left';
  }
  ctx.font = '800 46px -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 10;
  ctx.fillText(post.member_name || 'CoStride User', PAD + 88 + 20, 84);
  ctx.font = '600 34px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(new Date(post.created_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }), PAD + 88 + 20, 128);
  ctx.shadowBlur = 0;

  // Post content bottom
  if (post.content) {
    const content = post.content.length > 200 ? post.content.substring(0, 200) + '…' : post.content;
    ctx.font = '600 52px -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 14;
    // Simple word wrap
    const words = content.split(' ');
    let line = '', lines = [], maxW = W - PAD * 2;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    const lineH = 68;
    const textY = H - 220 - lines.length * lineH;
    lines.forEach((l, i) => ctx.fillText(l, PAD, textY + i * lineH));
    ctx.shadowBlur = 0;
  }

  // CoStride logo bottom
  const logo = await loadImage(LOGO_URL);
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD, H - 130, 50, 50, 12);
    ctx.clip();
    ctx.drawImage(logo, PAD, H - 130, 50, 50);
    ctx.restore();
  }
  ctx.font = '800 36px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('CoStride', PAD + 60, H - 96);

  return canvas;
}

function PostCardPreview({ post }) {
  return (
    <div style={{ width:'100%', aspectRatio:'9/16', position:'relative', overflow:'hidden', borderRadius:18, background:'#0a0a0f', fontFamily:"'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.08) 25%,rgba(0,0,0,0.08) 55%,rgba(0,0,0,0.88) 100%)' }} />
      </>) : (
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0d1117 0%,#111827 100%)' }} />
      )}
      {/* Author */}
      <div style={{ position:'absolute', top:0, left:0, right:0, padding:'16px 16px 0', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', overflow:'hidden', flexShrink:0, border:'2px solid rgba(255,255,255,0.25)' }}>
          {post.member_avatar
            ? <img src={post.member_avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:14 }}>{(post.member_name || '?').charAt(0).toUpperCase()}</div>
          }
        </div>
        <div>
          <div style={{ color:'white', fontSize:13, fontWeight:800, textShadow:'0 1px 6px rgba(0,0,0,0.7)' }}>{post.member_name || 'CoStride User'}</div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:10, fontWeight:600 }}>
            {new Date(post.created_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
          </div>
        </div>
      </div>
      {/* Content + logo bottom */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 16px 22px' }}>
        {post.content && (
          <div style={{ color:'white', fontSize:14, fontWeight:600, lineHeight:1.45, marginBottom:16, textShadow:'0 1px 8px rgba(0,0,0,0.7)' }}>
            {post.content.length > 160 ? post.content.substring(0, 160) + '…' : post.content}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <img src={LOGO_URL} alt="" style={{ width:20, height:20, borderRadius:5, objectFit:'cover' }} />
          <span style={{ color:'rgba(255,255,255,0.6)', fontSize:10, fontWeight:800, letterSpacing:'0.04em', textTransform:'uppercase' }}>CoStride</span>
        </div>
      </div>
    </div>
  );
}

export default function PostShareModal({ open, onClose, post }) {
  const [isCapturing, setIsCapturing] = useState(false);

  const doShare = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await drawPostCard(post);
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], 'costride-post.png', { type:'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files:[file] })) {
        await navigator.share({ files:[file], title:'CoStride Post', text: post.content ? post.content.substring(0, 100) : 'Check this out on CoStride 💪' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'costride-post.png'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Image saved!');
      }
    } catch (e) {
      if (e.name !== 'AbortError') { console.error(e); toast.error('Could not share'); }
    } finally { setIsCapturing(false); }
  }, [isCapturing, post]);

  const doSave = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await drawPostCard(post);
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'costride-post.png'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Saved!');
    } catch (e) { console.error(e); toast.error('Could not save'); }
    finally { setIsCapturing(false); }
  }, [isCapturing, post]);

  if (!open || !post) return null;

  return (
    <AnimatePresence>
      {open && (<>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
          style={{ position:'fixed', inset:0, zIndex:10010, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)' }} />
        <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }} transition={{ type:'spring', damping:30, stiffness:300 }}
          style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:10011, background:'rgba(10,10,18,0.99)', borderTop:'1px solid rgba(255,255,255,0.1)', borderTopLeftRadius:26, borderTopRightRadius:26, paddingBottom:'env(safe-area-inset-bottom, 16px)', fontFamily:"'SF Pro Display',-apple-system,sans-serif" }}>

          <div style={{ display:'flex', justifyContent:'center', paddingTop:10 }}>
            <div style={{ width:38, height:4, borderRadius:2, background:'rgba(255,255,255,0.2)' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px 10px' }}>
            <span style={{ color:'white', fontSize:17, fontWeight:800, letterSpacing:'-0.03em' }}>Share Post</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.7)', cursor:'pointer' }}>
              <X size={15} />
            </button>
          </div>

          <div style={{ padding:'0 20px' }}>
            <PostCardPreview post={post} />
          </div>

          <div style={{ display:'flex', gap:12, padding:'12px 20px 16px' }}>
            <button onClick={doSave} disabled={isCapturing} style={{ flex:1, padding:'15px 0', borderRadius:16, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.14)', color:'white', fontSize:14, fontWeight:700, cursor: isCapturing ? 'default' : 'pointer', opacity: isCapturing ? 0.5 : 1, boxShadow:'0 3px 0 rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.07)' }}>
              Save Image
            </button>
            <button onClick={doShare} disabled={isCapturing} style={{ flex:2, padding:'15px 0', borderRadius:16, background: isCapturing ? 'rgba(59,130,246,0.45)' : 'linear-gradient(180deg,#3b82f6 0%,#1d4ed8 60%,#1e3a8a 100%)', border:'none', color:'white', fontSize:15, fontWeight:800, letterSpacing:'-0.02em', cursor: isCapturing ? 'default' : 'pointer', boxShadow: isCapturing ? 'none' : '0 3px 0 #1e3a8a,0 6px 20px rgba(59,130,246,0.35),inset 0 1px 0 rgba(255,255,255,0.2)', transition:'all 0.15s' }}>
              {isCapturing ? 'Preparing…' : 'Share'}
            </button>
          </div>
        </motion.div>
      </>)}
    </AnimatePresence>
  );
}