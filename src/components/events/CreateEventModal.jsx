import React, { useState } from 'react';

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  .ev-overlay{position:fixed;inset:0;background:rgba(2,4,18,0.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:50;display:flex;align-items:flex-end;justify-content:center;animation:evFadeIn 0.18s ease;}
  @media(min-width:640px){.ev-overlay{align-items:center;}}
  @keyframes evFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes evSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
  .ev-modal{width:100%;max-width:500px;max-height:92vh;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif;background:linear-gradient(160deg,rgba(14,21,56,0.97) 0%,rgba(7,11,30,0.99) 100%);border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);box-shadow:0 -8px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.02) inset,0 1px 0 rgba(255,255,255,0.06) inset;border-radius:28px 28px 0 0;overflow:hidden;animation:evSlideUp 0.22s cubic-bezier(0.34,1.3,0.64,1);}
  @media(min-width:640px){.ev-modal{border-radius:22px;max-height:88vh;}}
  .ev-header{flex-shrink:0;padding:20px 22px 17px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;}
  .ev-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:20px 22px;display:flex;flex-direction:column;gap:15px;}
  .ev-body::-webkit-scrollbar{width:3px}.ev-body::-webkit-scrollbar-track{background:transparent}.ev-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
  .ev-footer{flex-shrink:0;padding:14px 22px 22px;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:10px;}
  .ev-inp,.ev-ta{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s;}
  .ev-ta{resize:none}
  .ev-inp:focus,.ev-ta:focus{border-color:rgba(16,185,129,0.45);background:rgba(16,185,129,0.05);box-shadow:0 0 0 3px rgba(16,185,129,0.08);}
  .ev-inp::placeholder,.ev-ta::placeholder{color:rgba(148,163,184,0.3);font-weight:500}
  .ev-inp:disabled{opacity:0.35;cursor:not-allowed}
  .ev-label{font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.4);margin-bottom:6px;display:flex;align-items:center;gap:5px;}
  .ev-hint{font-size:10.5px;color:rgba(148,163,184,0.35);font-weight:500;margin-top:4px;}
  .ev-g2{display:grid;grid-template-columns:1fr;gap:12px;}
  @media(min-width:460px){.ev-g2{grid-template-columns:1fr 1fr;}}
`;

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{width:30,height:30,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',cursor:'pointer',transition:'background 0.15s',flexShrink:0}}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1L12 12M12 1L1 12" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"/></svg>
    </button>
  );
}

function PrimaryBtn({ onClick, disabled, children, type = 'button' }) {
  const [p, setP] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseDown={() => !disabled && setP(true)} onMouseUp={() => setP(false)}
      onMouseLeave={() => setP(false)} onTouchStart={() => !disabled && setP(true)} onTouchEnd={() => setP(false)}
      style={{flex:1,padding:'11px 0',borderRadius:12,fontSize:13,fontWeight:800,fontFamily:"'DM Sans',sans-serif",color:disabled?'rgba(148,163,184,0.4)':'#fff',background:disabled?'rgba(255,255,255,0.04)':p?'linear-gradient(180deg,#059669,#047857)':'linear-gradient(180deg,#10b981 0%,#059669 60%,#047857 100%)',border:disabled?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(255,255,255,0.15)',borderBottom:disabled?'2px solid rgba(0,0,0,0.2)':p?'1px solid #064e3b':'3px solid #064e3b',boxShadow:!disabled&&!p?'0 4px 20px rgba(16,185,129,0.3),inset 0 1px 0 rgba(255,255,255,0.18)':'none',transform:p?'translateY(2px) scale(0.99)':'translateY(0) scale(1)',transition:p?'all 0.06s':'all 0.24s cubic-bezier(0.34,1.4,0.64,1)',cursor:disabled?'default':'pointer',letterSpacing:'-0.01em'}}>
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{flex:1,padding:'11px 0',borderRadius:12,fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",color:'rgba(148,163,184,0.7)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderBottom:'2px solid rgba(0,0,0,0.2)',cursor:'pointer',letterSpacing:'-0.01em'}}>
      {children}
    </button>
  );
}

export default function CreateEventModal({ open, onClose, onSave, gym, isLoading }) {
  const [form, setForm] = useState({ title: '', description: '', event_date: '', image_url: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    onSave(form);
    setForm({ title: '', description: '', event_date: '', image_url: '' });
  };

  if (!open) return null;

  return (
    <>
      <style>{S}</style>
      <div className="ev-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="ev-modal">

          <div className="ev-header">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(16,185,129,0.22),rgba(6,95,70,0.12))',border:'1px solid rgba(16,185,129,0.28)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <p style={{fontSize:16,fontWeight:900,color:'#f1f5f9',letterSpacing:'-0.03em',margin:0}}>Create Event</p>
                <p style={{fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600,marginTop:1}}>{gym?.name || 'Your Gym'}</p>
              </div>
            </div>
            <CloseBtn onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} className="ev-body">
            <div>
              <p className="ev-label">Event Title *</p>
              <input className="ev-inp" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Fitness Challenge" required />
            </div>

            <div>
              <p className="ev-label">Description</p>
              <textarea className="ev-ta" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell members what to expect..." />
            </div>

            <div className="ev-g2">
              <div>
                <p className="ev-label">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Date & Time *
                </p>
                <input type="datetime-local" className="ev-inp" value={form.event_date} onChange={e => set('event_date', e.target.value)} required />
              </div>
              <div>
                <p className="ev-label">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Location
                </p>
                <input className="ev-inp" value={gym?.name || ''} disabled />
              </div>
            </div>

            <div>
              <p className="ev-label">Banner Image URL</p>
              <input type="url" className="ev-inp" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://example.com/image.jpg" />
              <p className="ev-hint">Optional — adds a banner image to the event card</p>
            </div>

            {form.image_url && (
              <div style={{borderRadius:11,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',height:90}}>
                <img src={form.image_url} alt="Preview" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e => e.target.style.display='none'} />
              </div>
            )}

            <div className="ev-footer" style={{padding:0,paddingTop:4,border:'none'}}>
              <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
              <PrimaryBtn type="submit" disabled={isLoading || !form.title || !form.event_date}>
                {isLoading ? 'Creating...' : 'Create Event'}
              </PrimaryBtn>
            </div>
          </form>

        </div>
      </div>
    </>
  );
}
