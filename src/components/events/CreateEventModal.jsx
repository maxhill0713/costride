import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const S = `
  .ev-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px);z-index:50;display:flex;align-items:flex-end;justify-content:center;}
  @media(min-width:640px){.ev-overlay{align-items:center;}}
  .ev-modal{width:100%;max-width:500px;max-height:90vh;display:flex;flex-direction:column;background:linear-gradient(145deg,rgba(10,16,44,0.98),rgba(5,8,24,0.99));border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);border-radius:24px 24px 0 0;overflow:hidden;}
  @media(min-width:640px){.ev-modal{border-radius:24px;}}
  .ev-inp{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;}
  .ev-inp:focus{border-color:rgba(59,130,246,0.5);}
  .ev-inp::placeholder{color:rgba(148,163,184,0.4);}
  .ev-ta{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;resize:none;}
  .ev-ta:focus{border-color:rgba(59,130,246,0.5);}
  .ev-ta::placeholder{color:rgba(148,163,184,0.4);}
  .ev-label{font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.5);margin-bottom:6px;display:flex;align-items:center;gap:5px;}
`;

function Btn({ onClick, disabled, children, secondary }) {
  const [p, setP] = useState(false);
  const green = !secondary && !disabled;
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
        boxShadow: green && !p ? '0 3px 0 rgba(0,0,0,0.4),0 6px 20px rgba(59,130,246,0.3),inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
        transform: p ? 'translateY(3px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: p ? 'transform 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1)',
        cursor: disabled ? 'default' : 'pointer',
      }}>{children}</button>
  );
}

export default function CreateEventModal({ open, onClose, onSave, gym, isLoading }) {
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '', image_url: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) { toast.error('Please fill in title and date'); return; }
    onSave(formData);
    setFormData({ title: '', description: '', event_date: '', image_url: '' });
  };

  if (!open) return null;

  return (
    <>
      <style>{S}</style>
      <div className="ev-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="ev-modal">

          {/* Header */}
          <div style={{ flexShrink:0,padding:'20px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(6,95,70,0.15))',border:'1px solid rgba(16,185,129,0.3)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Calendar style={{ width:17,height:17,color:'#34d399' }}/>
                </div>
                <div>
                  <h2 style={{ fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:0 }}>Create Event</h2>
                  <p style={{ fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600 }}>{gym?.name}</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer' }}>
                <X style={{ width:15,height:15,color:'rgba(255,255,255,0.6)' }}/>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14 }}>

            <div>
              <label className="ev-label">Event Title *</label>
              <input className="ev-inp" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Summer Fitness Challenge" required/>
            </div>

            <div>
              <label className="ev-label">Description</label>
              <textarea className="ev-ta" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Tell members what to expect..."/>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div>
                <label className="ev-label"><Clock style={{ width:11,height:11,color:'#34d399' }}/>Date & Time *</label>
                <input type="datetime-local" className="ev-inp" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} required/>
              </div>
              <div>
                <label className="ev-label"><MapPin style={{ width:11,height:11,color:'#34d399' }}/>Location</label>
                <input className="ev-inp" value={gym?.name || ''} disabled style={{ opacity:0.5,cursor:'default' }}/>
              </div>
            </div>

            <div>
              <label className="ev-label">Banner Image URL</label>
              <input type="url" className="ev-inp" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg"/>
              <p style={{ fontSize:10,color:'rgba(148,163,184,0.35)',marginTop:4,fontWeight:600 }}>Optional: Add a banner image for your event</p>
            </div>

            {/* Footer inside form so submit works */}
            <div style={{ display:'flex',gap:10,paddingTop:4 }}>
              <Btn onClick={onClose} secondary type="button">Cancel</Btn>
              <Btn disabled={isLoading || !formData.title || !formData.event_date} type="submit">
                {isLoading ? 'Creating...' : 'Create Event'}
              </Btn>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}