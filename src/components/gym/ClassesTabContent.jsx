import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import ClassDetailModal from './ClassDetailModal';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';

const CLASS_TYPE_CONFIG = {
  hiit:     { label:'HIIT',     color:'#f87171', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.25)'  },
  yoga:     { label:'Yoga',     color:'#34d399', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)' },
  strength: { label:'Strength', color:'#818cf8', bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.25)' },
  cardio:   { label:'Cardio',   color:'#fb7185', bg:'rgba(244,63,94,0.12)',  border:'rgba(244,63,94,0.25)'  },
  spin:     { label:'Spin',     color:'#38bdf8', bg:'rgba(14,165,233,0.12)', border:'rgba(14,165,233,0.25)' },
  boxing:   { label:'Boxing',   color:'#fb923c', bg:'rgba(234,88,12,0.12)',  border:'rgba(234,88,12,0.25)'  },
  pilates:  { label:'Pilates',  color:'#c084fc', bg:'rgba(168,85,247,0.12)', border:'rgba(168,85,247,0.25)' },
  default:  { label:'Class',    color:'#38bdf8', bg:'rgba(14,165,233,0.10)', border:'rgba(14,165,233,0.2)'  },
};
const CLASS_IMAGES = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=800&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  cardio:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  spin:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  boxing:   'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
  pilates:  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  default:  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
};
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_NAMES = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday', Sun:'Sunday' };
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

const CSS = `
@keyframes cl-bar {from{width:0}}
@keyframes cl-hot {0%,100%{opacity:.8}50%{opacity:1}}
@keyframes cl-in  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
`;

function injectCSS() {
  if (!document.getElementById('cl-css')) {
    const s = document.createElement('style'); s.id = 'cl-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }
}

function getClassType(c) {
  const n = (c.name || c.title || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('zen')) return 'yoga';
  if (n.includes('strength') || n.includes('weight') || n.includes('lift') || n.includes('power')) return 'strength';
  if (n.includes('cardio') || n.includes('aerobic') || n.includes('zumba')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike')) return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox')) return 'boxing';
  if (n.includes('pilates') || n.includes('barre')) return 'pilates';
  return 'default';
}

function getScheduleDays(c) {
  const schedule = c.schedule;
  if (!schedule) return [];
  if (Array.isArray(schedule)) return DAY_LABELS.filter((d) => schedule.some((s) => (s.day || '').toLowerCase().includes(d.toLowerCase())));
  if (typeof schedule === 'string') return DAY_LABELS.filter((d) => schedule.toLowerCase().includes(d.toLowerCase()));
  return [];
}

function getMockTime(gymClass, index) {
  let s = '';
  if (Array.isArray(gymClass.schedule)) s = gymClass.schedule[0]?.time || '';
  else s = gymClass.schedule || '';
  s = String(s);
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return m[0];
  const times = ['06:00','07:30','09:00','10:30','12:00','13:30','16:00','17:30','18:00','19:30','20:00'];
  return times[index % times.length];
}

function getTimeSlot(t) {
  const h = parseInt((t || '12').split(':')[0]);
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function getTimeRange(startTime, durationMinutes) {
  if (!startTime) return null;
  const m = startTime.match(/(\d{1,2}):(\d{2})/);
  if (!m) return startTime;
  const total = parseInt(m[1]) * 60 + parseInt(m[2]) + (durationMinutes || 60);
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const durationLabel = durationMinutes
    ? durationMinutes % 60 === 0 ? `${durationMinutes / 60}h` : `${durationMinutes}min`
    : '1h';
  return `${startTime}-${pad(endH)}:${pad(endM)} (${durationLabel})`;
}

function press3D(e) { e.currentTarget.style.transform='translateY(3px)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderBottom='1px solid rgba(0,0,0,0.4)'; }
function release3D(e) { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderBottom=''; }

function ClassDateHeader({ activeDay, setActiveDay, activeSlot, setActiveSlot }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const jsDay = d.getDay();
    return { offset: i, label: DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1], num: d.getDate(), isToday: i === 0 };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {days.map((d) => {
          const active = activeDay === d.offset;
          return (
            <button key={d.offset} onClick={() => setActiveDay(d.offset)}
              onMouseDown={press3D} onMouseUp={release3D} onMouseLeave={release3D} onTouchStart={press3D} onTouchEnd={release3D}
              style={{ flex:1, padding:'7px 2px', borderRadius:13, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:0, background: active ? 'linear-gradient(to bottom,#3b82f6,#2563eb,#1d4ed8)' : d.isToday ? 'rgba(37,99,235,0.12)' : 'rgba(20,28,60,0.8)', border: `1px solid ${active ? 'transparent' : d.isToday ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.09)'}`, borderBottom: active ? '3px solid #1a3fa8' : '3px solid rgba(0,0,0,0.5)', boxShadow: active ? '0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 0 rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.07)', color: active ? '#fff' : d.isToday ? 'rgba(147,197,253,0.9)' : 'rgba(255,255,255,0.45)', transition:'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease' }}>
              <span style={{ fontSize:8.5, fontWeight:800, letterSpacing:'0.05em', textTransform:'uppercase', color: active ? 'rgba(255,255,255,0.7)' : d.isToday ? 'rgba(147,197,253,0.75)' : 'rgba(255,255,255,0.35)' }}>{d.label}</span>
              <span style={{ fontSize:17, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1 }}>{d.num}</span>
              {d.isToday && !active && <span style={{ width:4, height:4, borderRadius:'50%', background:'#60a5fa', boxShadow:'0 0 5px rgba(96,165,250,0.8)' }} />}
            </button>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {TIME_SLOTS.map((slot) => {
          const active = activeSlot === slot;
          return (
            <button key={slot} onClick={() => setActiveSlot(active ? null : slot)}
              style={{ flex:1, padding:'8px 0', borderRadius:99, cursor:'pointer', fontSize:12, fontWeight: active ? 800 : 700, background: active ? 'linear-gradient(to bottom,#3b82f6,#2563eb,#1d4ed8)' : 'rgba(20,28,60,0.8)', border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)', borderBottom: active ? '3px solid #1a3fa8' : '3px solid rgba(0,0,0,0.5)', boxShadow: active ? '0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 0 rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.07)', color: active ? '#fff' : 'rgba(255,255,255,0.45)', transition:'background 0.12s,color 0.12s,border 0.12s,box-shadow 0.12s' }}>
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeaveClassConfirm({ open, className, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:10050, background:'rgba(2,4,10,0.82)', backdropFilter:'blur(10px)' }} />
      <div style={{ position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:'calc(100% - 32px)', maxWidth:340, zIndex:10051, background:'linear-gradient(135deg,rgba(16,19,40,0.98) 0%,rgba(6,8,18,1) 100%)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, boxShadow:'0 32px 80px rgba(0,0,0,0.8)', overflow:'hidden' }}>
        <div style={{ padding:24, textAlign:'center' }}>
          <h3 style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', margin:'0 0 8px' }}>Leave <span style={{ color:'#60a5fa' }}>{className}</span>?</h3>
          <p style={{ fontSize:13, color:'rgba(148,163,184,0.9)', lineHeight:1.5, margin:'0 0 24px' }}>Your spot will be released back to others.</p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'12px 0', borderRadius:14, fontSize:13, fontWeight:800, color:'#fff', background:'linear-gradient(to bottom,#2d3748,#1a202c)', border:'1px solid rgba(255,255,255,0.12)', borderBottom:'3px solid rgba(0,0,0,0.5)', cursor:'pointer' }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex:1, padding:'12px 0', borderRadius:14, fontSize:13, fontWeight:800, color:'#fff', background:'linear-gradient(to bottom,#f87171,#ef4444 40%,#b91c1c)', border:'1px solid transparent', borderBottom:'3px solid #7f1d1d', cursor:'pointer' }}>Leave</button>
          </div>
        </div>
      </div>
    </>
  );
}

function PremiumClassCard({ gymClass, isOwner, onDelete, onBook, booked, onClick, timeStr, index }) {
  useEffect(() => { injectCSS(); }, []);
  const [pressed, setPressed] = useState(false);
  const typeKey = getClassType(gymClass);
  const cfg = CLASS_TYPE_CONFIG[typeKey];
  const IMAGE_HEIGHT = 111;
  const img = gymClass.image_url || CLASS_IMAGES[typeKey] || CLASS_IMAGES.default;
  const cap = gymClass.capacity || gymClass.max_participants || null;
  const enr = gymClass.enrolled || gymClass.participants_count || 0;
  const left = cap ? cap - enr : null;
  const full = left !== null && left <= 0;
  const pct = cap ? Math.min(100, Math.round(enr / cap * 100)) : null;
  const hot = left !== null && left <= 5 && !full;
  const coachName = gymClass.instructor || gymClass.coach_name;
  const coachAvatar = gymClass.coach_avatar || gymClass.instructor_avatar || null;
  const timeRange = getTimeRange(timeStr, gymClass.duration_minutes);
  const diff = gymClass.difficulty ? gymClass.difficulty.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : null;
  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div onClick={onClick} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{ borderRadius:20, overflow:'hidden', cursor:'pointer', background:CARD_BG, border:`1px solid ${booked ? cfg.border : CARD_BORDER}`, borderBottom: booked ? `3px solid ${cfg.color}66` : '3px solid rgba(0,0,0,0.55)', boxShadow: booked ? `0 0 0 1px ${cfg.border},0 3px 0 rgba(0,0,0,0.4),0 12px 36px rgba(0,0,0,0.6)` : '0 3px 0 rgba(0,0,0,0.45),0 8px 28px rgba(0,0,0,0.5)', transform: pressed ? 'scale(0.965) translateY(3px)' : 'scale(1)', transition:'transform 0.1s cubic-bezier(0.34,1.2,0.64,1),box-shadow 0.1s ease', animation:`cl-in 0.32s ease ${index * 0.055}s both`, display:'flex', flexDirection:'column', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>
      <div style={{ height:1, background:'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.09) 50%,transparent 90%)', flexShrink:0 }} />
      <div style={{ height:3, background:`linear-gradient(90deg,${cfg.color}cc,${cfg.color}44)`, flexShrink:0 }} />
      <div style={{ position:'relative', height:IMAGE_HEIGHT, overflow:'hidden', flexShrink:0 }}>
        <img src={img} alt={gymClass.name} style={{ width:'100%', height:'100%', objectFit:'cover', transform: pressed ? 'scale(1.05)' : 'scale(1)', transition:'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)', filter: full ? 'brightness(0.65) saturate(0.5)' : 'none' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.12) 35%,rgba(8,10,22,0.97) 100%)' }} />
        {coachName && <div style={{ position:'absolute', top:8, left:8, width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${cfg.color}44,${cfg.color}1a)`, border:`2px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:cfg.color, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>{coachAvatar ? <img src={coachAvatar} alt={coachName} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : ini(coachName)}</div>}
        <div style={{ position:'absolute', top:8, right: isOwner ? 42 : 8, display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
          {booked && <span style={{ fontSize:9, fontWeight:900, color:'#34d399', background:'rgba(0,0,0,0.68)', border:'1px solid rgba(52,211,153,0.45)', borderRadius:20, padding:'3px 8px' }}>✓ Booked</span>}
          {full && !booked && <span style={{ fontSize:9, fontWeight:900, color:'#f87171', background:'rgba(0,0,0,0.68)', border:'1px solid rgba(248,113,113,0.45)', borderRadius:20, padding:'3px 8px' }}>Full</span>}
          {hot && !full && <span style={{ fontSize:9, fontWeight:900, color:'#fbbf24', background:'rgba(0,0,0,0.68)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:20, padding:'3px 8px', animation:'cl-hot 1.8s ease-in-out infinite' }}>🔥 {left} left</span>}
        </div>
        {isOwner && <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(gymClass.id); }} style={{ position:'absolute', top:9, right:9, width:28, height:28, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(239,68,68,0.75)', border:'none', cursor:'pointer', zIndex:5 }}><Trash2 style={{ width:12, height:12, color:'#fff' }} /></button>}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 10px 9px' }}>
          <div style={{ fontSize:14, fontWeight:900, color:'#fff', letterSpacing:'-0.025em', lineHeight:1.18, textShadow:'0 2px 10px rgba(0,0,0,0.9)' }}>{gymClass.name || gymClass.title}</div>
          {coachName && <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.6)', marginTop:1, textShadow:'0 1px 4px rgba(0,0,0,0.8)' }}>with {coachName}</div>}
        </div>
      </div>
      <div style={{ padding:'8px 10px 0', display:'flex', flexDirection:'column', gap:6, flex:1 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'2px 6px', alignItems:'center' }}>
          <span style={{ fontSize:11.5, fontWeight:800, color:'#60a5fa' }}>{timeRange || timeStr}</span>
          {diff && <><span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>·</span><span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>{diff}</span></>}
          {gymClass.price > 0
            ? <span style={{ fontSize:12, fontWeight:900, color:'#34d399', background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.28)', borderRadius:8, padding:'2px 7px' }}>£{gymClass.price}</span>
            : <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.28)' }}>Free</span>
          }
        </div>
        {left !== null && <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, height:4, borderRadius:99, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:99, width:`${cap ? Math.min(100,Math.round(enr/cap*100)) : 0}%`, background: full ? '#f87171' : hot ? 'linear-gradient(90deg,#d97706,#fbbf24)' : `linear-gradient(90deg,${cfg.color}88,${cfg.color})`, transition:'width 0.6s ease' }} />
          </div>
          <span style={{ fontSize:10, fontWeight:800, color: full ? '#f87171' : hot ? '#fbbf24' : 'rgba(255,255,255,0.5)', whiteSpace:'nowrap', flexShrink:0 }}>{full ? '🔴 Full' : hot ? `🔥 ${left} left` : `${left} spots`}</span>
        </div>}
      </div>
      {!isOwner && <div style={{ padding:'8px 10px 10px' }}>
        <button onClick={(e) => { e.stopPropagation(); if (!full || booked) onBook && onBook(gymClass.id); }} disabled={full && !booked}
          onMouseDown={(e) => { if (full && !booked) return; press3D(e); }} onMouseUp={release3D} onMouseLeave={release3D} onTouchStart={(e) => { if (full && !booked) return; press3D(e); }} onTouchEnd={release3D}
          style={{ width:'100%', padding:'10px', borderRadius:13, fontSize:12, fontWeight:900, letterSpacing:'-0.01em', cursor: full && !booked ? 'default' : 'pointer', border:'none', ...(booked ? { background:'rgba(16,185,129,0.18)', borderBottom:'3px solid rgba(5,150,105,0.5)', boxShadow:'0 2px 0 rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.1)', color:'#34d399', outline:'1px solid rgba(52,211,153,0.28)' } : full ? { background:'rgba(255,255,255,0.05)', borderBottom:'3px solid rgba(0,0,0,0.5)', boxShadow:'0 2px 0 rgba(0,0,0,0.35)', color:'rgba(255,255,255,0.22)' } : { background:'linear-gradient(to bottom,#3b82f6,#2563eb,#1d4ed8)', borderBottom:'3px solid #1a3fa8', boxShadow:'0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2)', color:'#fff' }), transition:'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease' }}>
          {booked ? '✓ Booked' : full ? 'Join Waitlist' : left !== null ? `Book · ${left} left` : 'Book Spot'}
        </button>
      </div>}
      {isOwner && <div style={{ height:10 }} />}
    </div>
  );
}

export default function ClassesTabContent({ classes, showOwnerControls, onManage, onDelete, currentUser, gymId, autoOpenClassId }) {
  const today = new Date();
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState(0);
  const [activeSlot, setActiveSlot] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [leaveConfirmClassId, setLeaveConfirmClassId] = useState(null);
  const [localBookedIds, setLocalBookedIds] = useState(() => {
    const s = new Set();
    classes.forEach(c => { if ((c.attendee_ids || []).includes(currentUser?.id)) s.add(c.id); });
    return s;
  });

  useEffect(() => {
    const s = new Set();
    classes.forEach(c => { if ((c.attendee_ids || []).includes(currentUser?.id)) s.add(c.id); });
    if (autoOpenClassId) { s.add(autoOpenClassId); const cls = classes.find(c => c.id === autoOpenClassId); if (cls) setSelectedClass(cls); }
    setLocalBookedIds(s);
  }, [classes, currentUser?.id]);

  const isBooked = (gymClass) => localBookedIds.has(gymClass.id);

  const handleBook = async (classId) => {
    if (!currentUser?.id) return;
    const gymClass = classes.find(c => c.id === classId);
    if (!gymClass) return;
    if (localBookedIds.has(classId)) { setLeaveConfirmClassId(classId); return; }
    setLocalBookedIds(prev => new Set([...prev, classId]));
    const newIds = [...(gymClass.attendee_ids || []), currentUser.id];
    const feedGymId = gymClass.gym_id || gymId;
    queryClient.setQueryData(['gymActivityFeed', feedGymId], (old) => old ? { ...old, classes: (old.classes || []).map(c => c.id === classId ? { ...c, attendee_ids: newIds } : c) } : old);
    await base44.entities.GymClass.update(classId, { attendee_ids: newIds });
    queryClient.invalidateQueries({ queryKey: ['gymActivityFeed', feedGymId] });
  };

  const handleLeaveConfirmed = async () => {
    const classId = leaveConfirmClassId;
    setLeaveConfirmClassId(null);
    if (!classId || !currentUser?.id) return;
    const gymClass = classes.find(c => c.id === classId);
    if (!gymClass) return;
    setLocalBookedIds(prev => { const n = new Set(prev); n.delete(classId); return n; });
    const newIds = (gymClass.attendee_ids || []).filter(id => id !== currentUser.id);
    const feedGymId = gymClass.gym_id || gymId;
    queryClient.setQueryData(['gymActivityFeed', feedGymId], (old) => old ? { ...old, classes: (old.classes || []).map(c => c.id === classId ? { ...c, attendee_ids: newIds } : c) } : old);
    await base44.entities.GymClass.update(classId, { attendee_ids: newIds });
    queryClient.invalidateQueries({ queryKey: ['gymActivityFeed', feedGymId] });
  };

  const activeDate = new Date(today);
  activeDate.setDate(today.getDate() + activeDay);
  const jsDay = activeDate.getDay();
  const activeDayName = DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1];
  const activeDayFullName = DAY_FULL_NAMES[activeDayName] || activeDayName;
  const isToday = activeDay === 0;

  const withTime = React.useMemo(() => classes.map((c, i) => ({ ...c, _time: getMockTime(c, i), _slot: getTimeSlot(getMockTime(c, i)) })), [classes]);
  const filtered = React.useMemo(() => {
    let list = withTime.filter((c) => { const d = getScheduleDays(c); return d.length === 0 || d.includes(activeDayName); });
    if (activeSlot) list = list.filter((c) => c._slot === activeSlot);
    return list.sort((a, b) => a._time.localeCompare(b._time));
  }, [withTime, activeDayName, activeSlot]);

  if (classes.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div style={{ borderRadius:22, padding:'56px 24px', textAlign:'center', background:CARD_BG, border:`1px dashed ${CARD_BORDER}`, backdropFilter:'blur(20px)' }}>
        <div style={{ fontSize:36, marginBottom:14 }}>🏋️</div>
        <div style={{ fontSize:16, fontWeight:900, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>No classes scheduled</div>
        {showOwnerControls && <button onClick={onManage} style={{ marginTop:16, padding:'10px 24px', borderRadius:12, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:13, fontWeight:800, cursor:'pointer' }}>+ Add Classes</button>}
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1 }}>
          {isToday ? "Today's Classes" : `${activeDayFullName}'s Classes`}
        </div>
        {showOwnerControls &&
        <button onClick={onManage} onMouseDown={press3D} onMouseUp={release3D} onMouseLeave={release3D} onTouchStart={press3D} onTouchEnd={release3D}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:12, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderBottom:'3px solid rgba(55,48,163,0.6)', boxShadow:'0 2px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.1)', color:'#818cf8', fontSize:12, fontWeight:800, cursor:'pointer', flexShrink:0, marginTop:4, transition:'transform 0.08s ease,box-shadow 0.08s ease,border-bottom 0.08s ease' }}>
          <Plus style={{ width:13, height:13 }} />Manage
        </button>}
      </div>

      <ClassDateHeader activeDay={activeDay} setActiveDay={setActiveDay} activeSlot={activeSlot} setActiveSlot={setActiveSlot} />

      {filtered.length > 0 ?
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {filtered.map((gymClass, i) =>
        <PremiumClassCard key={gymClass.id} gymClass={gymClass} isOwner={showOwnerControls} booked={isBooked(gymClass)} onBook={handleBook} onClick={() => setSelectedClass(gymClass)} onDelete={showOwnerControls ? (id) => { if (window.confirm('Delete?')) onDelete(id); } : null} timeStr={gymClass._time} index={i} />
        )}
      </div> :
      <div style={{ borderRadius:18, padding:'36px 20px', textAlign:'center', background:CARD_BG, border:`1px dashed ${CARD_BORDER}`, backdropFilter:'blur(20px)' }}>
        <div style={{ fontSize:28, marginBottom:10 }}>📭</div>
        <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.3)', marginBottom:10 }}>No classes {activeSlot ? `this ${activeSlot.toLowerCase()}` : 'this day'}</div>
        {activeSlot && <button onClick={() => setActiveSlot(null)} style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, padding:'7px 16px', cursor:'pointer' }}>All times</button>}
      </div>}

      <ClassDetailModal gymClass={selectedClass} open={!!selectedClass} onClose={() => setSelectedClass(null)} booked={selectedClass ? isBooked(selectedClass) : false} onBook={handleBook} isOwner={showOwnerControls} currentUser={currentUser} />
      <LeaveClassConfirm open={!!leaveConfirmClassId} className={classes.find(c => c.id === leaveConfirmClassId)?.name || ''} onClose={() => setLeaveConfirmClassId(null)} onConfirm={handleLeaveConfirmed} />
    </motion.div>
  );
}