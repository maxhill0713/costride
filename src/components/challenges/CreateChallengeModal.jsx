import React, { useState } from 'react';
import { toast } from 'sonner';

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  .ch-overlay{position:fixed;inset:0;background:rgba(2,4,18,0.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:50;display:flex;align-items:flex-end;justify-content:center;animation:chFadeIn 0.18s ease;}
  @media(min-width:640px){.ch-overlay{align-items:center;}}
  @keyframes chFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes chSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
  .ch-modal{width:100%;max-width:540px;max-height:92vh;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif;background:linear-gradient(160deg,rgba(14,21,56,0.97) 0%,rgba(7,11,30,0.99) 100%);border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);box-shadow:0 -8px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.02) inset,0 1px 0 rgba(255,255,255,0.06) inset;border-radius:28px 28px 0 0;overflow:hidden;animation:chSlideUp 0.22s cubic-bezier(0.34,1.3,0.64,1);}
  @media(min-width:640px){.ch-modal{border-radius:22px;max-height:88vh;}}
  .ch-header{flex-shrink:0;padding:20px 22px 17px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;}
  .ch-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:20px 22px;display:flex;flex-direction:column;gap:15px;}
  .ch-body::-webkit-scrollbar{width:3px}.ch-body::-webkit-scrollbar-track{background:transparent}.ch-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
  .ch-footer{flex-shrink:0;padding:14px 22px 22px;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:10px;}
  .ch-inp,.ch-ta,.ch-sel{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.15s,background 0.15s,box-shadow 0.15s;}
  .ch-ta{resize:none}
  .ch-sel{appearance:none;cursor:pointer}
  .ch-sel option{background:#0e1538;color:#e2e8f0}
  .ch-inp:focus,.ch-ta:focus,.ch-sel:focus{border-color:rgba(251,146,60,0.45);background:rgba(251,146,60,0.05);box-shadow:0 0 0 3px rgba(251,146,60,0.08);}
  .ch-inp::placeholder,.ch-ta::placeholder{color:rgba(148,163,184,0.3);font-weight:500}
  .ch-label{font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.4);margin-bottom:6px;display:flex;align-items:center;gap:5px;}
  .ch-g2{display:grid;grid-template-columns:1fr;gap:12px;}
  @media(min-width:460px){.ch-g2{grid-template-columns:1fr 1fr;}}
  .ch-hint{font-size:10.5px;color:rgba(148,163,184,0.35);font-weight:500;margin-top:4px;}
`;

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{width:30,height:30,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',cursor:'pointer',flexShrink:0}}>
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
      style={{flex:1,padding:'11px 0',borderRadius:12,fontSize:13,fontWeight:800,fontFamily:"'DM Sans',sans-serif",color:disabled?'rgba(148,163,184,0.4)':'#fff',background:disabled?'rgba(255,255,255,0.04)':p?'linear-gradient(180deg,#ea580c,#c2410c)':'linear-gradient(180deg,#f97316 0%,#ea580c 60%,#c2410c 100%)',border:disabled?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(255,255,255,0.15)',borderBottom:disabled?'2px solid rgba(0,0,0,0.2)':p?'1px solid #7c2d12':'3px solid #7c2d12',boxShadow:!disabled&&!p?'0 4px 20px rgba(251,146,60,0.3),inset 0 1px 0 rgba(255,255,255,0.18)':'none',transform:p?'translateY(2px) scale(0.99)':'translateY(0) scale(1)',transition:p?'all 0.06s':'all 0.24s cubic-bezier(0.34,1.4,0.64,1)',cursor:disabled?'default':'pointer',letterSpacing:'-0.01em'}}>
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

export default function CreateChallengeModal({ open, onClose, gyms = [], onSave, isLoading }) {
  const [form, setForm] = useState({
    title:'', description:'', type:'individual', category:'lifting',
    gym_id:'', gym_name:'', competing_gym_id:'', competing_gym_name:'',
    exercise:'bench_press', goal_type:'total_weight', target_value:0,
    start_date: new Date().toISOString().split('T')[0], end_date:'',
    status:'upcoming', reward:'', auto_start:true, send_reminders:true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.end_date) { toast?.error('Please fill in Title and End Date'); return; }
    if (form.type === 'gym_vs_gym' && (!form.gym_id || !form.competing_gym_id)) { toast?.error('Please select both gyms'); return; }
    onSave(form);
  };

  if (!open) return null;

  return (
    <>
      <style>{S}</style>
      <div className="ch-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="ch-modal">

          <div className="ch-header">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(251,146,60,0.22),rgba(194,65,12,0.12))',border:'1px solid rgba(251,146,60,0.28)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H5a2 2 0 00-2 2v3a8 8 0 005.6 7.6"/><path d="M17 4h2a2 2 0 012 2v3a8 8 0 01-5.6 7.6"/><rect x="7" y="2" width="10" height="5" rx="1"/></svg>
              </div>
              <div>
                <p style={{fontSize:16,fontWeight:900,color:'#f1f5f9',letterSpacing:'-0.03em',margin:0}}>Create Challenge</p>
                <p style={{fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600,marginTop:1}}>Set up a competition for your members</p>
              </div>
            </div>
            <CloseBtn onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} className="ch-body">

            <div>
              <p className="ch-label">Challenge Title *</p>
              <input className="ch-inp" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Summer Squat Challenge" required/>
            </div>

            <div>
              <p className="ch-label">Description</p>
              <textarea className="ch-ta" rows={2} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Who can squat the most total weight this month?"/>
            </div>

            <div className="ch-g2">
              <div>
                <p className="ch-label">Category *</p>
                <select className="ch-sel" value={form.category} onChange={e=>{
                  const updates = {category:e.target.value};
                  if(e.target.value==='lifting') updates.goal_type='total_weight';
                  else if(e.target.value==='attendance') updates.goal_type='most_check_ins';
                  else if(e.target.value==='streak') updates.goal_type='longest_streak';
                  setForm(f=>({...f,...updates}));
                }}>
                  <option value="lifting">💪 Lifting</option>
                  <option value="attendance">📍 Attendance</option>
                  <option value="streak">🔥 Streak</option>
                </select>
              </div>
              <div>
                <p className="ch-label">Type *</p>
                <select className="ch-sel" value={form.type} onChange={e=>set('type',e.target.value)}>
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="gym_vs_gym">Gym vs Gym</option>
                  <option value="community">Community</option>
                </select>
              </div>
            </div>

            {form.category === 'lifting' && (
              <div className="ch-g2">
                <div>
                  <p className="ch-label">Exercise *</p>
                  <select className="ch-sel" value={form.exercise} onChange={e=>set('exercise',e.target.value)}>
                    <option value="bench_press">Bench Press</option>
                    <option value="squat">Squat</option>
                    <option value="deadlift">Deadlift</option>
                    <option value="overhead_press">Overhead Press</option>
                    <option value="barbell_row">Barbell Row</option>
                    <option value="power_clean">Power Clean</option>
                  </select>
                </div>
                <div>
                  <p className="ch-label">Goal Type *</p>
                  <select className="ch-sel" value={form.goal_type} onChange={e=>set('goal_type',e.target.value)}>
                    <option value="total_weight">Total Weight</option>
                    <option value="total_reps">Total Reps</option>
                    <option value="max_weight">Max Weight</option>
                  </select>
                </div>
              </div>
            )}

            {form.type === 'gym_vs_gym' && (
              <div className="ch-g2">
                <div>
                  <p className="ch-label">Home Gym *</p>
                  <select className="ch-sel" value={form.gym_id} onChange={e=>{const g=gyms.find(x=>x.id===e.target.value);set('gym_id',e.target.value);set('gym_name',g?.name||'');}}>
                    <option value="">Select gym</option>
                    {gyms.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="ch-label">vs. Gym *</p>
                  <select className="ch-sel" value={form.competing_gym_id} onChange={e=>{const g=gyms.find(x=>x.id===e.target.value);set('competing_gym_id',e.target.value);set('competing_gym_name',g?.name||'');}}>
                    <option value="">Select gym</option>
                    {gyms.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {(form.category === 'attendance' || form.category === 'streak') && (
              <div>
                <p className="ch-label">Target {form.category==='attendance'?'Check-ins':'Streak (days)'}</p>
                <input type="number" className="ch-inp" value={form.target_value} onChange={e=>set('target_value',parseInt(e.target.value)||0)} placeholder={form.category==='attendance'?'20':'30'}/>
              </div>
            )}

            <div className="ch-g2">
              <div>
                <p className="ch-label">Start Date *</p>
                <input type="date" className="ch-inp" value={form.start_date} onChange={e=>set('start_date',e.target.value)}/>
              </div>
              <div>
                <p className="ch-label">End Date *</p>
                <input type="date" className="ch-inp" value={form.end_date} onChange={e=>set('end_date',e.target.value)} required/>
              </div>
            </div>

            <div>
              <p className="ch-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                Reward (Optional)
              </p>
              <input className="ch-inp" value={form.reward} onChange={e=>set('reward',e.target.value)} placeholder="e.g. Free protein shake, £10 gift card"/>
              <p className="ch-hint">Winner receives this reward at the end of the challenge</p>
            </div>

            <div className="ch-footer" style={{padding:0,paddingTop:4,border:'none'}}>
              <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
              <PrimaryBtn type="submit" disabled={isLoading || !form.title || !form.end_date}>
                {isLoading ? 'Creating...' : 'Create Challenge'}
              </PrimaryBtn>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
