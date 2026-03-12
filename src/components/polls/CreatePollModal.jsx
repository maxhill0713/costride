import React, { useState } from 'react';

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  .pl-overlay{position:fixed;inset:0;background:rgba(2,4,18,0.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:50;display:flex;align-items:flex-end;justify-content:center;animation:plFadeIn 0.18s ease;}
  @media(min-width:640px){.pl-overlay{align-items:center;}}
  @keyframes plFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes plSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
  .pl-modal{width:100%;max-width:480px;max-height:92vh;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif;background:linear-gradient(160deg,rgba(14,21,56,0.97) 0%,rgba(7,11,30,0.99) 100%);border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);box-shadow:0 -8px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.02) inset,0 1px 0 rgba(255,255,255,0.06) inset;border-radius:28px 28px 0 0;overflow:hidden;animation:plSlideUp 0.22s cubic-bezier(0.34,1.3,0.64,1);}
  @media(min-width:640px){.pl-modal{border-radius:22px;max-height:88vh;}}
  .pl-header{flex-shrink:0;padding:20px 22px 17px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;}
  .pl-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:20px 22px;display:flex;flex-direction:column;gap:15px;}
  .pl-body::-webkit-scrollbar{width:3px}.pl-body::-webkit-scrollbar-track{background:transparent}.pl-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
  .pl-footer{flex-shrink:0;padding:14px 22px 22px;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:10px;}
  .pl-inp,.pl-sel{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s;}
  .pl-sel{appearance:none;cursor:pointer}
  .pl-sel option{background:#0e1538;color:#e2e8f0}
  .pl-inp:focus,.pl-sel:focus{border-color:rgba(139,92,246,0.45);background:rgba(139,92,246,0.05);box-shadow:0 0 0 3px rgba(139,92,246,0.08);}
  .pl-inp::placeholder{color:rgba(148,163,184,0.3);font-weight:500}
  .pl-label{font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.4);margin-bottom:6px;display:block;}
  .pl-add-btn{width:100%;padding:9px;border-radius:11px;background:rgba(139,92,246,0.05);border:1px dashed rgba(139,92,246,0.2);color:rgba(167,139,250,0.55);font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.15s;font-family:'DM Sans',sans-serif;}
  .pl-add-btn:hover{background:rgba(139,92,246,0.09);border-color:rgba(139,92,246,0.3);color:#a78bfa;}
`;

const CATEGORIES = [
  { value: 'equipment_replacement', label: '🔧 Equipment Replacement' },
  { value: 'favorite_equipment',    label: '💪 Favourite Equipment' },
  { value: 'rewards',               label: '🎁 Rewards & Perks' },
  { value: 'playlist',              label: '🎵 Gym Playlist' },
  { value: 'schedule',              label: '📅 Class Schedule' },
  { value: 'other',                 label: '💬 Other' },
];

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{width:30,height:30,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',cursor:'pointer',flexShrink:0}}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1L12 12M12 1L1 12" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"/></svg>
    </button>
  );
}

function PrimaryBtn({ onClick, disabled, children }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => !disabled && setP(true)} onMouseUp={() => setP(false)}
      onMouseLeave={() => setP(false)} onTouchStart={() => !disabled && setP(true)} onTouchEnd={() => setP(false)}
      style={{flex:1,padding:'11px 0',borderRadius:12,fontSize:13,fontWeight:800,fontFamily:"'DM Sans',sans-serif",color:disabled?'rgba(148,163,184,0.4)':'#fff',background:disabled?'rgba(255,255,255,0.04)':p?'linear-gradient(180deg,#7c3aed,#6d28d9)':'linear-gradient(180deg,#8b5cf6 0%,#7c3aed 60%,#6d28d9 100%)',border:disabled?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(255,255,255,0.15)',borderBottom:disabled?'2px solid rgba(0,0,0,0.2)':p?'1px solid #4c1d95':'3px solid #4c1d95',boxShadow:!disabled&&!p?'0 4px 20px rgba(139,92,246,0.3),inset 0 1px 0 rgba(255,255,255,0.18)':'none',transform:p?'translateY(2px) scale(0.99)':'translateY(0) scale(1)',transition:p?'all 0.06s':'all 0.24s cubic-bezier(0.34,1.4,0.64,1)',cursor:disabled?'default':'pointer',letterSpacing:'-0.01em'}}>
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

export default function CreatePollModal({ open, onClose, onSave, isLoading }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [description, setDescription] = useState('');

  const validOptions = options.filter(o => o.trim()).length;
  const valid = title.trim() && category && validOptions >= 2;

  const handleSubmit = () => {
    if (!valid) return;
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

          <div className="pl-header">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(139,92,246,0.22),rgba(109,40,217,0.12))',border:'1px solid rgba(139,92,246,0.28)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div>
                <p style={{fontSize:16,fontWeight:900,color:'#f1f5f9',letterSpacing:'-0.03em',margin:0}}>Create Poll</p>
                <p style={{fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600,marginTop:1}}>Ask members what they think</p>
              </div>
            </div>
            <CloseBtn onClick={onClose} />
          </div>

          <div className="pl-body">
            <div>
              <span className="pl-label">Poll Category *</span>
              <select className="pl-sel" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <span className="pl-label">Question *</span>
              <input className="pl-inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Which equipment should we replace first?" />
            </div>

            <div>
              <span className="pl-label">Additional Context</span>
              <input className="pl-inp" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any helpful context..." />
            </div>

            <div>
              <span className="pl-label">Options ({validOptions} / {options.length})</span>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{display:'flex',gap:8,alignItems:'center'}}>
                    <div style={{width:24,height:24,borderRadius:6,background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontSize:10,fontWeight:800,color:'#a78bfa'}}>{idx + 1}</span>
                    </div>
                    <input className="pl-inp" style={{flex:1}} value={opt} onChange={e => { const n=[...options]; n[idx]=e.target.value; setOptions(n); }} placeholder={`Option ${idx + 1}`} />
                    {options.length > 2 && (
                      <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                        style={{width:32,height:32,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)',cursor:'pointer',flexShrink:0}}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.8)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="pl-add-btn" style={{marginTop:8}} onClick={() => setOptions([...options, ''])}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Option
              </button>
            </div>
          </div>

          <div className="pl-footer">
            <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
            <PrimaryBtn onClick={handleSubmit} disabled={isLoading || !valid}>
              {isLoading ? 'Creating...' : 'Create Poll'}
            </PrimaryBtn>
          </div>

        </div>
      </div>
    </>
  );
}
