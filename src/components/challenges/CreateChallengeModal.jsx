import React, { useState } from 'react';
import { X, Trophy, Gift } from 'lucide-react';
import { MobileSelect } from "@/components/ui/mobile-select";
import { toast } from 'sonner';

const S = `
  .ch-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px);z-index:50;display:flex;align-items:flex-end;justify-content:center;}
  @media(min-width:640px){.ch-overlay{align-items:center;}}
  .ch-modal{width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;background:linear-gradient(145deg,rgba(10,16,44,0.98),rgba(5,8,24,0.99));border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);border-radius:24px 24px 0 0;overflow:hidden;}
  @media(min-width:640px){.ch-modal{border-radius:24px;}}
  .ch-inp{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;}
  .ch-inp:focus{border-color:rgba(251,146,60,0.5);}
  .ch-inp::placeholder{color:rgba(148,163,184,0.4);}
  .ch-ta{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;resize:none;}
  .ch-ta:focus{border-color:rgba(251,146,60,0.5);}
  .ch-ta::placeholder{color:rgba(148,163,184,0.4);}
  .ch-label{font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.5);margin-bottom:6px;display:block;}
`;

function Btn({ onClick, disabled, children, secondary, type }) {
  const [p, setP] = useState(false);
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
      onMouseDown={() => !disabled && setP(true)} onMouseUp={() => setP(false)}
      onMouseLeave={() => setP(false)} onTouchStart={() => !disabled && setP(true)} onTouchEnd={() => setP(false)}
      style={{
        flex:1,padding:'12px 0',borderRadius:13,fontSize:13,fontWeight:900,
        color: secondary ? 'rgba(148,163,184,0.8)' : '#fff',
        background: disabled ? 'rgba(255,255,255,0.05)' : secondary ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg,#fb923c 0%,#ea580c 50%,#c2410c 100%)',
        border: secondary ? '1px solid rgba(255,255,255,0.08)' : disabled ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.18)',
        borderBottom: secondary || disabled ? '3px solid rgba(0,0,0,0.3)' : p ? '1px solid #7c2d12' : '4px solid #7c2d12',
        boxShadow: !secondary && !disabled && !p ? '0 3px 0 rgba(0,0,0,0.4),0 6px 20px rgba(251,146,60,0.3),inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
        transform: p ? 'translateY(3px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: p ? 'transform 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1)',
        cursor: disabled ? 'default' : 'pointer',
      }}>{children}</button>
  );
}

// Wrap MobileSelect to match dark theme
function DarkSelect({ value, onValueChange, placeholder, options }) {
  return (
    <div style={{ position:'relative' }}>
      <MobileSelect
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        triggerClassName="w-full h-10 rounded-[11px] text-[13px] font-semibold"
        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', color:'#fff' }}
        options={options}
      />
    </div>
  );
}

export default function CreateChallengeModal({ open, onClose, gyms, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'individual', category: 'lifting',
    gym_id: '', gym_name: '', competing_gym_id: '', competing_gym_name: '',
    exercise: 'bench_press', goal_type: 'total_weight', target_value: 0,
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    status: 'upcoming', reward: '', auto_start: true, send_reminders: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.end_date) { toast.error('Please fill in Title and End Date'); return; }
    if (formData.type === 'gym_vs_gym' && (!formData.gym_id || !formData.competing_gym_id)) { toast.error('Please select both gyms'); return; }
    onSave(formData);
  };

  if (!open) return null;

  return (
    <>
      <style>{S}</style>
      <div className="ch-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="ch-modal">

          {/* Header */}
          <div style={{ flexShrink:0,padding:'20px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:'linear-gradient(135deg,rgba(251,146,60,0.25),rgba(194,65,12,0.15))',border:'1px solid rgba(251,146,60,0.3)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Trophy style={{ width:17,height:17,color:'#fb923c' }}/>
                </div>
                <div>
                  <h2 style={{ fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:0 }}>Create Challenge</h2>
                  <p style={{ fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600 }}>Set up a new challenge for your members</p>
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
              <span className="ch-label">Challenge Title *</span>
              <input className="ch-inp" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Summer Squat Challenge" required/>
            </div>

            <div>
              <span className="ch-label">Description</span>
              <textarea className="ch-ta" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Who can squat the most total weight this month?"/>
            </div>

            <div>
              <span className="ch-label">Category *</span>
              <DarkSelect value={formData.category} placeholder="Select category" onValueChange={value => {
                const updates = { category: value };
                if (value === 'lifting') updates.goal_type = 'total_weight';
                else if (value === 'attendance') updates.goal_type = 'most_check_ins';
                else if (value === 'streak') updates.goal_type = 'longest_streak';
                setFormData({ ...formData, ...updates });
              }} options={[
                { value: 'lifting', label: '💪 Lifting (Weight/Reps)' },
                { value: 'attendance', label: '📍 Attendance (Check-ins)' },
                { value: 'streak', label: '🔥 Streak (Consecutive Days)' }
              ]}/>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div>
                <span className="ch-label">Type *</span>
                <DarkSelect value={formData.type} placeholder="Select type" onValueChange={v => setFormData({ ...formData, type: v })} options={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'team', label: 'Team' },
                  { value: 'gym_vs_gym', label: 'Gym vs Gym' },
                  { value: 'community', label: 'Community' }
                ]}/>
              </div>
              {formData.category === 'lifting' && (
                <div>
                  <span className="ch-label">Exercise *</span>
                  <DarkSelect value={formData.exercise} placeholder="Select exercise" onValueChange={v => setFormData({ ...formData, exercise: v })} options={[
                    { value: 'bench_press', label: 'Bench Press' },
                    { value: 'squat', label: 'Squat' },
                    { value: 'deadlift', label: 'Deadlift' },
                    { value: 'overhead_press', label: 'Overhead Press' },
                    { value: 'barbell_row', label: 'Barbell Row' },
                    { value: 'power_clean', label: 'Power Clean' }
                  ]}/>
                </div>
              )}
            </div>

            {formData.type === 'gym_vs_gym' && (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <div>
                  <span className="ch-label">Home Gym *</span>
                  <DarkSelect value={formData.gym_id} placeholder="Select gym" onValueChange={v => { const g = gyms.find(x => x.id === v); setFormData({ ...formData, gym_id: v, gym_name: g?.name || '' }); }} options={gyms.map(g => ({ value: g.id, label: g.name }))}/>
                </div>
                <div>
                  <span className="ch-label">Competing Gym *</span>
                  <DarkSelect value={formData.competing_gym_id} placeholder="Select gym" onValueChange={v => { const g = gyms.find(x => x.id === v); setFormData({ ...formData, competing_gym_id: v, competing_gym_name: g?.name || '' }); }} options={gyms.map(g => ({ value: g.id, label: g.name }))}/>
                </div>
              </div>
            )}

            <div>
              <span className="ch-label">Goal Type *</span>
              <DarkSelect value={formData.goal_type} placeholder="Select goal type" onValueChange={v => setFormData({ ...formData, goal_type: v })} options={[
                ...(formData.category === 'lifting' ? [
                  { value: 'total_weight', label: 'Total Weight Lifted' },
                  { value: 'total_reps', label: 'Total Reps' },
                  { value: 'max_weight', label: 'Max Weight' }
                ] : []),
                ...(formData.category === 'attendance' ? [{ value: 'most_check_ins', label: 'Most Check-ins' }] : []),
                ...(formData.category === 'streak' ? [{ value: 'longest_streak', label: 'Longest Streak' }] : []),
                { value: 'participation', label: 'Most Participants' }
              ]}/>
            </div>

            {(formData.category === 'attendance' || formData.category === 'streak') && (
              <div>
                <span className="ch-label">Target {formData.category === 'attendance' ? 'Check-ins' : 'Streak (days)'}</span>
                <input type="number" className="ch-inp" value={formData.target_value} onChange={e => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })} placeholder={formData.category === 'attendance' ? '20' : '30'}/>
              </div>
            )}

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div>
                <span className="ch-label">Start Date *</span>
                <input type="date" className="ch-inp" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}/>
              </div>
              <div>
                <span className="ch-label">End Date *</span>
                <input type="date" className="ch-inp" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required/>
              </div>
            </div>

            <div>
              <span className="ch-label" style={{ display:'flex',alignItems:'center',gap:5 }}><Gift style={{ width:11,height:11,color:'#fb923c' }}/>Reward (Optional)</span>
              <input className="ch-inp" value={formData.reward} onChange={e => setFormData({ ...formData, reward: e.target.value })} placeholder="e.g. Free protein shake, £10 gift card"/>
            </div>

            <div style={{ display:'flex',gap:10,paddingTop:4 }}>
              <Btn onClick={onClose} secondary>Cancel</Btn>
              <Btn type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Challenge'}</Btn>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}