import React, { useState, useRef } from 'react';
import { X, MessageSquarePlus, Image, Send, Smile } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const N = {
  950: '#060d1f', 900: '#0a1628', 850: '#0d1e35', 800: '#112040',
  750: '#152649', 700: '#1a2f57', 600: '#213a6b',
};

function SaveBtn({ onClick, disabled, label = 'Post Update' }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        padding: '12px 24px', borderRadius: 13, fontSize: 13, fontWeight: 900,
        letterSpacing: '-0.01em', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg,#3b82f6 0%,#2563eb 50%,#1d4ed8 100%)',
        border: disabled ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.18)',
        borderBottom: disabled ? '3px solid rgba(0,0,0,0.3)' : pressed ? '1px solid #1e3a8a' : '4px solid #1e3a8a',
        boxShadow: disabled ? 'none' : pressed ? 'none' : '0 3px 0 rgba(0,0,0,0.4),0 8px 24px rgba(59,130,246,0.3),inset 0 1px 0 rgba(255,255,255,0.2)',
        transform: pressed ? 'translateY(4px) scale(0.98)' : 'translateY(0)',
        transition: pressed ? 'transform 0.06s,box-shadow 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1),box-shadow 0.18s',
        cursor: disabled ? 'default' : 'pointer', minWidth: 140,
      }}
    >
      <Send style={{ width: 14, height: 14 }} />{label}
    </button>
  );
}

const EMOJI_QUICK = ['💪', '🔥', '🏋️', '🏆', '⚡', '🎯', '✅', '🚀'];

export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImg, setShowImg] = useState(false);
  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: () => base44.entities.Post.create({
      content,
      image_url: imageUrl || undefined,
      gym_id: gym?.id,
      gym_name: gym?.name,
      member_name: gym?.name,
      allow_gym_repost: true,
      likes: 0,
      comments: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent(''); setImageUrl(''); setShowImg(false);
      onSuccess?.();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(6,13,31,0.85)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:'100%',maxWidth:520,background:`linear-gradient(145deg,${N[900]},${N[950]})`,border:'1px solid rgba(59,130,246,0.18)',borderTop:'1px solid rgba(59,130,246,0.3)',borderRadius:22,overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>

        {/* Top shimmer */}
        <div style={{ height:1.5,background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)',margin:'0 10%' }}/>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 14px',borderBottom:`1px solid rgba(59,130,246,0.1)` }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:11,background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.28)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <MessageSquarePlus style={{ width:17,height:17,color:'#60a5fa' }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15,fontWeight:900,color:'#fff',margin:0,letterSpacing:'-0.02em' }}>New Post</h2>
              <p style={{ fontSize:11,color:'rgba(59,130,246,0.5)',margin:0,fontWeight:600 }}>{gym?.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:N[800],border:`1px solid rgba(59,130,246,0.15)`,cursor:'pointer' }}>
            <X style={{ width:15,height:15,color:'#6b87b8' }}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'16px 20px 20px' }}>

          {/* Gym avatar + textarea */}
          <div style={{ display:'flex',gap:12,marginBottom:14 }}>
            <div style={{ width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,color:'#fff',flexShrink:0 }}>
              {gym?.name?.charAt(0)?.toUpperCase()}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Share an update with ${gym?.name} members…`}
              rows={5}
              style={{ flex:1,padding:'12px 14px',borderRadius:13,background:N[800],border:`1px solid rgba(59,130,246,0.15)`,color:'#fff',fontSize:13,fontWeight:500,lineHeight:1.6,resize:'none',outline:'none',fontFamily:'inherit' }}
            />
          </div>

          {/* Quick emojis */}
          <div style={{ display:'flex',gap:6,marginBottom:14,flexWrap:'wrap' }}>
            {EMOJI_QUICK.map(e => (
              <button key={e} onClick={() => setContent(c => c + e)}
                style={{ padding:'4px 10px',borderRadius:99,fontSize:15,background:N[800],border:`1px solid rgba(59,130,246,0.12)`,cursor:'pointer',transition:'background 0.15s' }}>
                {e}
              </button>
            ))}
          </div>

          {/* Image URL toggle */}
          {showImg ? (
            <div style={{ marginBottom:14 }}>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Paste image URL…"
                style={{ width:'100%',padding:'10px 13px',borderRadius:11,background:N[800],border:`1px solid rgba(59,130,246,0.18)`,color:'#fff',fontSize:12,outline:'none',boxSizing:'border-box' }}
              />
              {imageUrl && <img src={imageUrl} alt="" style={{ marginTop:8,width:'100%',height:140,objectFit:'cover',borderRadius:10,border:`1px solid rgba(59,130,246,0.15)` }} onError={e => e.target.style.display='none'}/>}
            </div>
          ) : null}

          {/* Footer */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:8,borderTop:`1px solid rgba(59,130,246,0.08)` }}>
            <button onClick={() => setShowImg(v => !v)}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:10,fontSize:12,fontWeight:700,color:showImg?'#60a5fa':'#6b87b8',background:showImg?'rgba(59,130,246,0.12)':'transparent',border:`1px solid ${showImg?'rgba(59,130,246,0.3)':'transparent'}`,cursor:'pointer' }}>
              <Image style={{ width:14,height:14 }}/>Add Image
            </button>
            <SaveBtn
              onClick={() => postMutation.mutate()}
              disabled={!content.trim() || postMutation.isPending}
              label={postMutation.isPending ? 'Posting…' : 'Post Update'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
