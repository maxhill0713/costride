import React, { useState, useEffect } from 'react';

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  .am-overlay{position:fixed;inset:0;background:rgba(2,4,18,0.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:50;display:flex;align-items:flex-end;justify-content:center;animation:amFadeIn 0.18s ease;}
  @media(min-width:640px){.am-overlay{align-items:center;}}
  @keyframes amFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes amSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
  .am-modal{width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif;background:linear-gradient(160deg,rgba(14,21,56,0.97) 0%,rgba(7,11,30,0.99) 100%);border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);box-shadow:0 -8px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.02) inset,0 1px 0 rgba(255,255,255,0.06) inset;border-radius:28px 28px 0 0;overflow:hidden;animation:amSlideUp 0.22s cubic-bezier(0.34,1.3,0.64,1);}
  @media(min-width:640px){.am-modal{border-radius:22px;max-height:88vh;}}
  .am-header{flex-shrink:0;padding:20px 22px 17px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;}
  .am-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:20px 22px;display:flex;flex-direction:column;gap:16px;}
  .am-body::-webkit-scrollbar{width:3px}.am-body::-webkit-scrollbar-track{background:transparent}.am-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
  .am-footer{flex-shrink:0;padding:14px 22px 22px;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:10px;}
  .am-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  @media(min-width:460px){.am-grid{grid-template-columns:1fr 1fr 1fr;}}
  .am-item{display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:11px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.15s;user-select:none;}
  .am-item.on{background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.25);}
  .am-item:hover:not(.on){border-color:rgba(255,255,255,0.11);background:rgba(255,255,255,0.035);}
  .am-check{width:16px;height:16px;border-radius:5px;flex-shrink:0;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.14);display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
  .am-check.on{background:#f59e0b;border-color:#f59e0b;}
  .am-item-label{font-size:12px;font-weight:600;color:rgba(226,232,240,0.65);line-height:1.3;}
  .am-item.on .am-item-label{color:rgba(253,186,116,0.9);}
  .am-progress{height:3px;border-radius:99px;background:rgba(255,255,255,0.06);overflow:hidden;}
  .am-progress-bar{height:100%;border-radius:99px;background:linear-gradient(90deg,#f59e0b,#fbbf24);transition:width 0.3s ease;}
`;

const AMENITIES = [
  { id:'parking',    label:'Free Parking',     icon:'🅿️' },
  { id:'showers',    label:'Showers',           icon:'🚿' },
  { id:'lockers',    label:'Lockers',           icon:'🔐' },
  { id:'wifi',       label:'WiFi',              icon:'📶' },
  { id:'pt',         label:'Personal Training', icon:'🏋️' },
  { id:'classes',    label:'Group Classes',     icon:'👥' },
  { id:'sauna',      label:'Sauna',             icon:'🧖' },
  { id:'steam',      label:'Steam Room',        icon:'💨' },
  { id:'pool',       label:'Swimming Pool',     icon:'🏊' },
  { id:'basketball', label:'Basketball Court',  icon:'🏀' },
  { id:'boxing',     label:'Boxing Ring',       icon:'🥊' },
  { id:'mma',        label:'MMA Cage',          icon:'🥋' },
  { id:'juice',      label:'Juice Bar',         icon:'🥤' },
  { id:'shop',       label:'Pro Shop',          icon:'🛍️' },
  { id:'childcare',  label:'Childcare',         icon:'🧒' },
  { id:'access247',  label:'24/7 Access',       icon:'🕐' },
  { id:'ac',         label:'Air Conditioning',  icon:'❄️' },
  { id:'towels',     label:'Towel Service',     icon:'🏳️' },
  { id:'recovery',   label:'Recovery Zone',     icon:'💪' },
  { id:'cinema',     label:'Cardio Cinema',     icon:'🎬' },
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
      style={{flex:1,padding:'11px 0',borderRadius:12,fontSize:13,fontWeight:800,fontFamily:"'DM Sans',sans-serif",color:disabled?'rgba(148,163,184,0.4)':'#fff',background:disabled?'rgba(255,255,255,0.04)':p?'linear-gradient(180deg,#d97706,#b45309)':'linear-gradient(180deg,#f59e0b 0%,#d97706 60%,#b45309 100%)',border:disabled?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(255,255,255,0.15)',borderBottom:disabled?'2px solid rgba(0,0,0,0.2)':p?'1px solid #78350f':'3px solid #78350f',boxShadow:!disabled&&!p?'0 4px 20px rgba(245,158,11,0.3),inset 0 1px 0 rgba(255,255,255,0.18)':'none',transform:p?'translateY(2px) scale(0.99)':'translateY(0) scale(1)',transition:p?'all 0.06s':'all 0.24s cubic-bezier(0.34,1.4,0.64,1)',cursor:disabled?'default':'pointer',letterSpacing:'-0.01em'}}>
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

export default function ManageAmenitiesModal({ open, onClose, amenities = [], onSave, isLoading }) {
  const [selected, setSelected] = useState(amenities);

  useEffect(() => {
    if (open) setSelected(amenities);
  }, [open, JSON.stringify(amenities)]);

  const toggle = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const pct = Math.round((selected.length / AMENITIES.length) * 100);

  if (!open) return null;

  return (
    <>
      <style>{S}</style>
      <div className="am-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="am-modal">

          <div className="am-header">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(245,158,11,0.22),rgba(180,83,9,0.12))',border:'1px solid rgba(245,158,11,0.28)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div>
                <p style={{fontSize:16,fontWeight:900,color:'#f1f5f9',letterSpacing:'-0.03em',margin:0}}>Manage Amenities</p>
                <p style={{fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600,marginTop:1}}>{selected.length} of {AMENITIES.length} selected</p>
              </div>
            </div>
            <CloseBtn onClick={onClose} />
          </div>

          <div className="am-body">
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(148,163,184,0.4)'}}>Coverage</span>
                <span style={{fontSize:11,fontWeight:800,color:'#fbbf24'}}>{pct}%</span>
              </div>
              <div className="am-progress">
                <div className="am-progress-bar" style={{width:`${pct}%`}}/>
              </div>
            </div>

            <div className="am-grid">
              {AMENITIES.map(a => {
                const on = selected.includes(a.id);
                return (
                  <div key={a.id} className={`am-item ${on?'on':''}`} onClick={() => toggle(a.id)}>
                    <div className={`am-check ${on?'on':''}`}>
                      {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column'}}>
                      <span style={{fontSize:15,lineHeight:1}}>{a.icon}</span>
                      <span className="am-item-label" style={{marginTop:2}}>{a.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="am-footer">
            <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
            <PrimaryBtn onClick={() => onSave(selected)} disabled={isLoading}>
              {isLoading ? 'Saving...' : `Save ${selected.length} Amenities`}
            </PrimaryBtn>
          </div>

        </div>
      </div>
    </>
  );
}
