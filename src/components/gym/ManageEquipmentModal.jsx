import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Plus, Dumbbell, Search, ChevronDown, ChevronUp, CheckCircle, Sparkles } from 'lucide-react';

// ── Equipment database ────────────────────────────────────────────────────────
const EQUIPMENT_DB = {
  'Cardio': [
    'Rogue Echo Bike', 'Assault AirBike', 'SkiErg (Concept2)', 'RowErg (Concept2)',
    'BikeErg (Concept2)', 'Peloton Bike', 'Life Fitness Treadmill', 'Woodway Treadmill',
    'StairMaster 8G', 'Jacob\'s Ladder', 'Versaclimber', 'Ski Erg (Concept2)',
  ],
  'Strength Machines': [
    'Hammer Strength Chest Supported Row', 'Hammer Strength ISO Lateral Incline Press',
    'Hammer Strength Seated Dip', 'Hammer Strength Leg Press', 'Hammer Strength Pulldown',
    'Prime Lateral Raise Machine', 'Prime Leg Extension', 'Prime Leg Curl',
    'Life Fitness Chest Press', 'Life Fitness Shoulder Press', 'Life Fitness Lat Pulldown',
    'Nautilus Nitro Leg Press', 'Cybex Eagle Chest Press', 'Cybex VR3 Leg Extension',
    'Pendulum Squat', 'Belt Squat Machine', 'Hack Squat Machine', 'Smith Machine',
    'Cable Crossover', 'Functional Trainer', 'Lat Pulldown Station',
  ],
  'Free Weights': [
    'Dumbbells (5–100 lbs)', 'Dumbbells (5–150 lbs)', 'Hex Dumbbells', 'Rubber Hex Dumbbells',
    'Barbells (Olympic)', 'EZ Curl Bar', 'Swiss Bar', 'Safety Squat Bar',
    'Cambered Bar', 'Trap Bar / Hex Bar', 'Kettlebells (8–48 kg)',
    'Medicine Balls', 'Bumper Plates', 'Iron Plates',
  ],
  'Racks & Platforms': [
    'Rogue Monster Power Rack', 'Rogue SML-2 Squat Stand', 'Titan Fitness Power Rack',
    'Sorinex Power Rack', 'Eleiko Power Rack', 'Mono Lift', 'Deadlift Platform',
    'Weightlifting Platform', 'Competition Bench', 'Adjustable Bench', 'Preacher Curl Bench',
  ],
  'Functional & Conditioning': [
    'GHD Machine', 'Reverse Hyper', '45° Back Extension', 'Ab Wheel',
    'Battle Ropes', 'Sled (Push/Pull)', 'Tire Flip Tire', 'TRX / Suspension Trainer',
    'Rings (Gymnastic)', 'Pull-up Rig', 'Dip Station', 'Parallettes',
    'Plyo Boxes', 'Resistance Bands', 'Mini Bands', 'Sandbags',
  ],
  'Recovery': [
    'Sauna', 'Cold Plunge', 'Ice Bath', 'Percussion Massager (Theragun)',
    'Foam Rollers', 'Massage Chairs', 'Infrared Sauna', 'Hyperbaric Chamber',
    'Red Light Therapy Panel', 'Compression Boots (NormaTec)',
  ],
};

const ALL_EQUIPMENT = Object.values(EQUIPMENT_DB).flat();

// ── Shared dark modal styles ──────────────────────────────────────────────────
const MODAL_STYLE = `
  .eq-modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:50;display:flex;align-items:flex-end;justify-content:center; }
  @media(min-width:640px) { .eq-modal-overlay { align-items:center; } }
  .eq-modal { width:100%;max-width:560px;max-height:88vh;display:flex;flex-direction:column;background:linear-gradient(145deg,rgba(10,16,44,0.98) 0%,rgba(5,8,24,0.99) 100%);border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);border-radius:24px 24px 0 0;overflow:hidden; }
  @media(min-width:640px) { .eq-modal { border-radius:24px; } }
  .eq-tag { display:inline-flex;align-items:center;gap:6px;padding:6px 10px 6px 12px;border-radius:99px;font-size:12px;font-weight:700;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:rgba(165,180,252,0.9);flex-shrink:0; }
  .eq-tag button { display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:rgba(99,102,241,0.2);border:none;cursor:pointer;padding:0;transition:background 0.15s; }
  .eq-tag button:hover { background:rgba(239,68,68,0.3); }
  .eq-suggest { width:100%;text-align:left;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);cursor:pointer;transition:background 0.12s,border-color 0.12s; }
  .eq-suggest:hover { background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:#fff; }
  .eq-suggest.selected { background:rgba(34,197,94,0.1);border-color:rgba(34,197,94,0.3);color:rgba(134,239,172,0.9); }
`;

function SaveButton({ onClick, disabled, count }) {
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
        width: '100%', padding: '13px 0', borderRadius: 14, fontSize: 14, fontWeight: 900,
        letterSpacing: '-0.01em', color: '#fff',
        background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg,#6366f1 0%,#4f46e5 50%,#4338ca 100%)',
        border: disabled ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.18)',
        borderBottom: disabled ? '3px solid rgba(0,0,0,0.3)' : pressed ? '1px solid #312e81' : '4px solid #312e81',
        boxShadow: disabled ? 'none' : pressed ? 'none' : '0 3px 0 rgba(0,0,0,0.4), 0 8px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        transform: pressed ? 'translateY(4px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: pressed ? 'transform 0.06s,box-shadow 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1),box-shadow 0.18s',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {disabled ? 'Saving...' : `Save ${count} Item${count !== 1 ? 's' : ''}`}
    </button>
  );
}

export default function ManageEquipmentModal({ open, onClose, equipment = [], onSave, isLoading }) {
  const [equipmentList, setEquipmentList] = useState(equipment);
  const [search, setSearch] = useState('');
  const [custom, setCustom] = useState('');
  const [expandedCat, setExpandedCat] = useState('Strength Machines');

  const filteredDB = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_EQUIPMENT.filter(e => e.toLowerCase().includes(q)).slice(0, 12);
  }, [search]);

  const toggle = (item) => {
    setEquipmentList(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    );
  };

  const addCustom = () => {
    const val = custom.trim();
    if (val && !equipmentList.includes(val)) {
      setEquipmentList(prev => [...prev, val]);
      setCustom('');
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{MODAL_STYLE}</style>
      <div className="eq-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="eq-modal">

          {/* ── Header ── */}
          <div style={{ flexShrink:0,padding:'20px 20px 0',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(79,70,229,0.15))',border:'1px solid rgba(99,102,241,0.3)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Dumbbell style={{ width:18,height:18,color:'#818cf8' }}/>
                </div>
                <div>
                  <h2 style={{ fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:0 }}>Gym Equipment</h2>
                  <p style={{ fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600 }}>{equipmentList.length} items listed</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer' }}>
                <X style={{ width:15,height:15,color:'rgba(255,255,255,0.6)' }}/>
              </button>
            </div>

            {/* Tip banner */}
            <div style={{ marginBottom:16,padding:'10px 14px',borderRadius:12,background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(79,70,229,0.06))',border:'1px solid rgba(99,102,241,0.2)',display:'flex',gap:10,alignItems:'flex-start' }}>
              <Sparkles style={{ width:14,height:14,color:'#818cf8',flexShrink:0,marginTop:1 }}/>
              <div>
                <p style={{ fontSize:12,fontWeight:800,color:'rgba(165,180,252,0.9)',margin:'0 0 2px' }}>Tip: Be specific with equipment names</p>
                <p style={{ fontSize:11,color:'rgba(148,163,184,0.55)',margin:0,lineHeight:1.5 }}>
                  Members searching for specialist machines (e.g. "Pendulum Squat", "Prime Lateral Raise") will discover your gym. Detail wins.
                </p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position:'relative',marginBottom:16 }}>
              <Search style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:15,height:15,color:'rgba(148,163,184,0.4)',pointerEvents:'none' }}/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search equipment (e.g. Hammer Strength)…"
                style={{ width:'100%',padding:'10px 12px 10px 36px',borderRadius:11,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#fff',fontSize:13,fontWeight:600,outline:'none',boxSizing:'border-box' }}
              />
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{ flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'14px 20px' }}>

            {/* Search results */}
            {filteredDB && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(148,163,184,0.4)',marginBottom:8 }}>
                  Search Results ({filteredDB.length})
                </p>
                {filteredDB.length === 0 ? (
                  <p style={{ fontSize:13,color:'rgba(148,163,184,0.4)',fontStyle:'italic' }}>No matches — add it as custom below</p>
                ) : (
                  <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                    {filteredDB.map(item => (
                      <button key={item} onClick={() => toggle(item)} className={`eq-suggest${equipmentList.includes(item) ? ' selected' : ''}`}>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                          <span>{item}</span>
                          {equipmentList.includes(item) && <CheckCircle style={{ width:14,height:14,color:'#4ade80',flexShrink:0 }}/>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category browser */}
            {!search.trim() && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(148,163,184,0.4)',marginBottom:10 }}>Browse by Category</p>
                <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  {Object.entries(EQUIPMENT_DB).map(([cat, items]) => {
                    const isOpen = expandedCat === cat;
                    const selectedInCat = items.filter(i => equipmentList.includes(i)).length;
                    return (
                      <div key={cat} style={{ borderRadius:13,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)' }}>
                        <button
                          onClick={() => setExpandedCat(isOpen ? null : cat)}
                          style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',background:isOpen?'rgba(99,102,241,0.1)':'rgba(255,255,255,0.03)',border:'none',cursor:'pointer',transition:'background 0.15s' }}
                        >
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <span style={{ fontSize:13,fontWeight:700,color:isOpen?'rgba(165,180,252,0.9)':'rgba(255,255,255,0.65)' }}>{cat}</span>
                            {selectedInCat > 0 && (
                              <span style={{ fontSize:10,fontWeight:900,color:'#4ade80',background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.25)',padding:'1px 7px',borderRadius:99 }}>{selectedInCat} added</span>
                            )}
                          </div>
                          {isOpen
                            ? <ChevronUp style={{ width:14,height:14,color:'rgba(148,163,184,0.5)' }}/>
                            : <ChevronDown style={{ width:14,height:14,color:'rgba(148,163,184,0.35)' }}/>
                          }
                        </button>
                        {isOpen && (
                          <div style={{ padding:'6px 10px 10px',display:'flex',flexDirection:'column',gap:3,background:'rgba(255,255,255,0.015)' }}>
                            {items.map(item => (
                              <button key={item} onClick={() => toggle(item)} className={`eq-suggest${equipmentList.includes(item) ? ' selected' : ''}`}>
                                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                                  <span>{item}</span>
                                  {equipmentList.includes(item) && <CheckCircle style={{ width:13,height:13,color:'#4ade80',flexShrink:0 }}/>}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom equipment */}
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(148,163,184,0.4)',marginBottom:8 }}>Add Custom Equipment</p>
              <div style={{ display:'flex',gap:8 }}>
                <input
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()}
                  placeholder="e.g. Custom Glute Drive Machine"
                  style={{ flex:1,padding:'10px 13px',borderRadius:11,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#fff',fontSize:13,fontWeight:600,outline:'none' }}
                />
                <button
                  onClick={addCustom}
                  style={{ width:40,height:40,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(99,102,241,0.18)',border:'1px solid rgba(99,102,241,0.3)',cursor:'pointer',flexShrink:0 }}
                >
                  <Plus style={{ width:16,height:16,color:'#818cf8' }}/>
                </button>
              </div>
            </div>

            {/* Selected tags */}
            {equipmentList.length > 0 && (
              <div>
                <p style={{ fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(148,163,184,0.4)',marginBottom:10 }}>
                  Your Equipment ({equipmentList.length})
                </p>
                <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                  {equipmentList.map((item, i) => (
                    <div key={i} className="eq-tag">
                      {item}
                      <button onClick={() => toggle(item)} aria-label={`Remove ${item}`}>
                        <X style={{ width:9,height:9,color:'rgba(165,180,252,0.7)' }}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <SaveButton onClick={() => onSave(equipmentList)} disabled={isLoading} count={equipmentList.length}/>
          </div>
        </div>
      </div>
    </>
  );
}
