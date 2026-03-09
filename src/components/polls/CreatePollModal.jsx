import React, { useState } from 'react';
import { X, Plus, BarChart2 } from 'lucide-react';

const S = `
  .pl-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px);z-index:50;display:flex;align-items:flex-end;justify-content:center;}
  @media(min-width:640px){.pl-overlay{align-items:center;}}
  .pl-modal{width:100%;max-width:480px;max-height:92vh;display:flex;flex-direction:column;background:linear-gradient(145deg,rgba(10,16,44,0.98),rgba(5,8,24,0.99));border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);border-radius:24px 24px 0 0;overflow:hidden;}
  @media(min-width:640px){.pl-modal{border-radius:24px;max-height:90vh;}}
  .pl-inp{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;}
  .pl-inp:focus{border-color:rgba(59,130,246,0.5);}
  .pl-inp::placeholder{color:rgba(148,163,184,0.4);}
  .pl-sel{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;appearance:none;}
  .pl-sel option{background:#0a1628;color:#fff;}
  .pl-label{font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.5);margin-bottom:6px;display:block;}
`;

const CATEGORIES = [
  { value: 'equipment_replacement', label: '🔧 Most Popular Gym Equipment Replacement' },
  { value: 'favorite_equipment', label: '💪 Favorite Pieces of Equipment' },
  { value: 'rewards', label: '🎁 What Rewards Would You Like?' },
  { value: 'playlist', label: '🎵 Songs for Gym Playlist' }
];

function Btn({ onClick, disabled, children, secondary }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => !disabled && setP(true)} onMouseUp={() => setP(false)}
      onMouseLeave={() => setP(false)} onTouchStart={() => !disabled && setP(true)} onTouchEnd={() => setP(false)}
      style={{
        flex:1,padding:'12px 0',borderRadius:13,fontSize:13,fontWeight:900,
        color: secondary ? 'rgba(148,163,184,0.8)' : '#fff',
        background: disabled ? 'rgba(255,255,255,0.05)' : secondary ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg,#3b82f6 0%,#2563eb 50%,#1d4ed8 100%)',
        border: secondary ? '1px solid rgba(255,255,255,0.08)' : disabled ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.18)',
        borderBottom: secondary || disabled ? '3px solid rgba(0,0,0,0.3)' : p ? '1px solid #1e3a8a' : '4px solid #1e3a8a',
        boxShadow: !secondary && !disabled && !p ? '0 3px 0 rgba(0,0,0,0.4),0 6px 20px rgba(59,130,246,0.3),inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
        transform: p ? 'translateY(3px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: p ? 'transform 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1)',
        cursor: disabled ? 'default' : 'pointer',
      }}>{children}</button>
  );
}

export default function CreatePollModal({ open, onClose, onSave, isLoading }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !category || options.filter(o => o.trim()).length < 2) {
      alert('Please fill in all fields with at least 2 options');
      return;
    }
    onSave({
      title, description, category,
      options: options.filter(o => o.trim()).map(text => ({ id: Math.random().toString(36).substr(2, 9), text: text.trim(), votes: 0 }))
    });
    setTitle(''); setDescription(''); setCategory(''); setOptions(['', '']);
  };

  if (!open) return null;

  return (
    <>
      <style>{S}</style>
      <div className="pl-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="pl-modal">

          {/* Header */}
          <div style={{ flexShrink:0,padding:'20px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(109,40,217,0.15))',border:'1px solid rgba(139,92,246,0.3)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <BarChart2 style={{ width:17,height:17,color:'#a78bfa' }}/>
                </div>
                <div>
                  <h2 style={{ fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:0 }}>Create Poll</h2>
                  <p style={{ fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600 }}>Ask your members what they think</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer' }}>
                <X style={{ width:15,height:15,color:'rgba(255,255,255,0.6)' }}/>
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14 }}>

            <div>
              <span className="pl-label">Poll Type</span>
              <select className="pl-sel" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="" disabled>Select a poll type</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <span className="pl-label">Question *</span>
              <input className="pl-inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Which equipment should we replace?"/>
            </div>

            <div>
              <span className="pl-label">Details (Optional)</span>
              <input className="pl-inp" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any additional context..."/>
            </div>

            <div>
              <span className="pl-label">Options</span>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display:'flex',gap:8,alignItems:'center' }}>
                    <input className="pl-inp" style={{ flex:1 }} value={opt} onChange={e => { const n = [...options]; n[idx] = e.target.value; setOptions(n); }} placeholder={`Option ${idx + 1}`}/>
                    {options.length > 2 && (
                      <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} style={{ width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',cursor:'pointer',flexShrink:0 }}>
                        <X style={{ width:13,height:13,color:'#f87171' }}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setOptions([...options, ''])} style={{ marginTop:8,width:'100%',padding:'9px',borderRadius:11,background:'rgba(59,130,246,0.07)',border:'1px dashed rgba(59,130,246,0.25)',color:'rgba(147,197,253,0.7)',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                <Plus style={{ width:13,height:13 }}/>Add Option
              </button>
            </div>

          </div>

          {/* Footer */}
          <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:10 }}>
            <Btn onClick={onClose} secondary>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Poll'}</Btn>
          </div>
        </div>
      </div>
    </>
  );
}