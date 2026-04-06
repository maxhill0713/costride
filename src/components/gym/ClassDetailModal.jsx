import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Users, MapPin, Star, Calendar, Dumbbell,
  Zap, Heart, Share2, Bell, CheckCircle,
  Info, QrCode, UserPlus, MessageSquare,
  ChevronDown, ChevronUp, Award, Repeat, ExternalLink,
  ThumbsUp, Tag, Wifi, AlertCircle, Flame,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA SHAPE
// CLASS_SESSION {
//   id, class_name, instructor_id, instructor (string), cover_image_url,
//   description, start_time (ISO), end_time (ISO), duration_minutes,
//   max_capacity, attendees (Attendee[]), intensity_level, equipment_needed,
//   estimated_calories, category, cancellation_policy, average_rating,
//   review_count, reviews (Review[]), location, is_virtual,
//   price_drop_in, price_member, schedule
// }
// ATTENDEE { id, name, avatar?, color?, status:'booked'|'waitlisted'|'cancelled' }
// REVIEW   { id, reviewer_id, name, initials, rating, comment, created_at, likes }
// ─────────────────────────────────────────────────────────────────────────────

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          '#0a0c14',
  surface:     '#111420',
  surfaceUp:   '#181c2a',
  border:      'rgba(255,255,255,0.07)',
  borderMid:   'rgba(255,255,255,0.11)',
  textPrimary:   '#f0f0f5',
  textSecondary: 'rgba(240,240,245,0.5)',
  textMuted:     'rgba(240,240,245,0.28)',
  green:  '#4ade80',
  amber:  '#fbbf24',
  red:    '#f87171',
};

const CFG = {
  hiit:     { label:'HIIT',     emoji:'⚡', color:'#f87171', rgb:'248,113,113' },
  yoga:     { label:'Yoga',     emoji:'🧘', color:'#6ee7b7', rgb:'110,231,183' },
  strength: { label:'Strength', emoji:'🏋️', color:'#a5b4fc', rgb:'165,180,252' },
  cardio:   { label:'Cardio',   emoji:'🏃', color:'#fb7185', rgb:'251,113,133' },
  spin:     { label:'Spin',     emoji:'🚴', color:'#7dd3fc', rgb:'125,211,252' },
  boxing:   { label:'Boxing',   emoji:'🥊', color:'#fdba74', rgb:'253,186,116' },
  pilates:  { label:'Pilates',  emoji:'🌸', color:'#d8b4fe', rgb:'216,180,254' },
  default:  { label:'Class',    emoji:'🎯', color:'#94a3b8', rgb:'148,163,184' },
};

const IMGS = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=800&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  cardio:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  spin:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  boxing:   'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
  pilates:  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  default:  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
};

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const CSS = `
  @keyframes cdm-bar  { from { width: 0; } }
  @keyframes cdm-pop  { 0%{transform:scale(0.6) translateY(10px);opacity:0} 60%{transform:scale(1.06) translateY(-2px);opacity:1} 80%{transform:scale(0.97)} 100%{transform:scale(1);opacity:1} }
  @keyframes cdm-hero { from{opacity:0.7;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
  @keyframes cdm-shimmer { 0%{transform:translateX(-100%);opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{transform:translateX(220%);opacity:0} }
  .cdm-scroll::-webkit-scrollbar { display:none; }
`;

function injectCSS() {
  if (!document.getElementById('cdm-css')) {
    const s = document.createElement('style');
    s.id = 'cdm-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }
}

// ── Schema resolvers ──────────────────────────────────────────────────────────
function classType(c) {
  const src = (c.category || c.class_name || c.name || c.title || '').toLowerCase();
  if (src.includes('hiit') || src.includes('interval'))   return 'hiit';
  if (src.includes('yoga') || src.includes('zen'))        return 'yoga';
  if (src.includes('strength') || src.includes('weight') || src.includes('lift') || src.includes('power')) return 'strength';
  if (src.includes('cardio') || src.includes('aerobic') || src.includes('zumba')) return 'cardio';
  if (src.includes('spin') || src.includes('cycle') || src.includes('bike'))      return 'spin';
  if (src.includes('box') || src.includes('mma') || src.includes('kickbox'))      return 'boxing';
  if (src.includes('pilates') || src.includes('barre'))   return 'pilates';
  return 'default';
}
function scheduleDays(c) {
  const s = c.schedule;
  if (!s) return [];
  if (Array.isArray(s)) return DAYS.filter(d => s.some(x => (x.day||'').toLowerCase().includes(d.toLowerCase())));
  if (typeof s === 'string') return DAYS.filter(d => s.toLowerCase().includes(d.toLowerCase()));
  return [];
}
function ini(name = '') { return (name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }
function getClassName(c)     { return c.class_name || c.name || c.title || 'Untitled Class'; }
function getInstructor(c)    { return c.instructor || c.coach_name || null; }
function getCoverImage(c,tk) { return c.cover_image_url || c.image_url || IMGS[tk] || IMGS.default; }
function getCapacity(c)      { return c.max_capacity ?? c.capacity ?? c.max_participants ?? null; }
function getEnrolled(c) {
  if (Array.isArray(c.attendees)) return c.attendees.filter(a => !a.status || a.status === 'booked').length;
  return c.enrolled ?? c.participants_count ?? 0;
}
function getIntensity(c) {
  return (c.intensity_level || c.difficulty || 'All Levels').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
}
function getEquipment(c) {
  if (!c.equipment_needed) return c.equipment || 'Standard gym equipment';
  return Array.isArray(c.equipment_needed) ? c.equipment_needed.join(', ') : c.equipment_needed;
}
function getCalories(c) {
  if (c.estimated_calories) return `~${c.estimated_calories} kcal`;
  if (c.calories)           return `~${c.calories} kcal`;
  if (c.duration_minutes)   return `~${Math.round(c.duration_minutes * 7)} kcal`;
  return 'Varies';
}
function getCancelPolicy(c) {
  return c.cancellation_policy || 'Cancel up to 4 hours before class for a full refund. Late cancellations may incur a fee.';
}
function getAvgRating(c, reviews) {
  if (c.average_rating != null) return parseFloat(c.average_rating).toFixed(1);
  if (reviews.length > 0) return (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1);
  return '0.0';
}
function getReviewCount(c, reviews) { return c.review_count ?? reviews.length; }
function getReviews(c) {
  if (Array.isArray(c.reviews) && c.reviews.length > 0) {
    return c.reviews.map(r => ({
      ...r,
      initials: r.initials || ini(r.name || r.reviewer_name || ''),
      name:     r.name || r.reviewer_name || 'Anonymous',
      date:     r.date || formatRelDate(r.created_at),
      text:     r.text || r.comment || '',
      likes:    r.likes ?? 0,
    }));
  }
  return [
    { initials:'AJ', name:'Alex J.',  rating:5, date:'2 days ago',  text:'Absolutely loved this class. High energy throughout — left feeling genuinely accomplished.', likes:12 },
    { initials:'SK', name:'Sara K.',  rating:4, date:'1 week ago',  text:'Well structured session. Warm-up could be longer but overall highly recommend.', likes:7 },
    { initials:'MP', name:'Mike P.',  rating:5, date:'2 weeks ago', text:'Best class at this gym. Consistent quality every single week.', likes:4 },
    { initials:'LB', name:'Laura B.', rating:4, date:'3 weeks ago', text:'Great for all fitness levels. The instructor is really encouraging.', likes:3 },
  ];
}
function formatRelDate(iso) {
  if (!iso) return '';
  try {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7)   return `${days} days ago`;
    if (days < 14)  return '1 week ago';
    if (days < 30)  return `${Math.floor(days/7)} weeks ago`;
    return `${Math.floor(days/30)} months ago`;
  } catch { return ''; }
}
function formatDT(iso) {
  if (!iso) return { date: null, time: null };
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }),
      time: d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }),
    };
  } catch { return { date: null, time: null }; }
}

// ── Micro-components ──────────────────────────────────────────────────────────
function StarRow({ rating, size = 10 }) {
  const full = Math.round(parseFloat(rating));
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} style={{ width:size, height:size,
          fill: s<=full ? T.amber : 'rgba(255,255,255,0.12)',
          color: s<=full ? T.amber : 'rgba(255,255,255,0.12)' }}/>
      ))}
    </div>
  );
}

function Bar({ pct, color, anim=true, h=4 }) {
  return (
    <div style={{ height:h, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:color,
        animation: anim ? 'cdm-bar 1s cubic-bezier(0.16,1,0.3,1) both' : 'none' }}/>
    </div>
  );
}

// Clean stat card — flat, no top bar, no glow
function StatCard({ icon: Icon, label, value, valueColor }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`,
      borderRadius:14, padding:'14px 10px', textAlign:'center' }}>
      <Icon style={{ width:15, height:15, color:T.textMuted, margin:'0 auto 8px', display:'block' }}/>
      <div style={{ fontSize:14, fontWeight:700, color:valueColor||T.textPrimary, letterSpacing:'-0.02em' }}>{value}</div>
      <div style={{ fontSize:9.5, color:T.textMuted, fontWeight:600, marginTop:4,
        textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
    </div>
  );
}

function SectionHead({ children, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.12em', textTransform:'uppercase' }}>{children}</div>
      {action}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, last }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0',
      borderBottom: last ? 'none' : `1px solid ${T.border}` }}>
      <Icon style={{ width:13, height:13, color:T.textMuted, flexShrink:0 }}/>
      <span style={{ fontSize:13, color:T.textSecondary, flex:1 }}>{label}</span>
      <span style={{ fontSize:13, color:T.textPrimary, fontWeight:600 }}>{value}</span>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QRModal({ open, onClose, gymClass }) {
  const code = `CLASS-${(gymClass?.id||'DEMO').toString().slice(-6).toUpperCase()}`;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
            style={{position:'fixed',inset:0,zIndex:10100,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(12px)'}}/>
          <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.88,opacity:0}}
            transition={{type:'spring',stiffness:320,damping:30}}
            style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10101,
              width:290,background:T.surface,border:`1px solid ${T.borderMid}`,
              borderRadius:20,padding:'24px 20px 20px',textAlign:'center'}}>
            <button onClick={onClose} style={{position:'absolute',top:12,right:12,width:28,height:28,borderRadius:'50%',
              background:'rgba(255,255,255,0.05)',border:`1px solid ${T.border}`,display:'flex',
              alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <X style={{width:12,height:12,color:T.textSecondary}}/>
            </button>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:T.textMuted,marginBottom:16}}>
              Check-In QR Code
            </div>
            <div style={{width:160,height:160,margin:'0 auto 16px',background:'#fff',borderRadius:12,padding:10,
              display:'grid',gridTemplateColumns:'repeat(9,1fr)',gap:2}}>
              {Array.from({length:81},(_,i) => {
                const row=Math.floor(i/9),col=i%9;
                const corner=(row<3&&col<3)||(row<3&&col>5)||(row>5&&col<3);
                const dark=corner||Math.abs(Math.sin(i*2.3+1.7))>0.45;
                return <div key={i} style={{background:dark?'#111':'#fff',borderRadius:corner?2:1}}/>;
              })}
            </div>
            <div style={{fontSize:16,fontWeight:700,color:T.textPrimary,letterSpacing:'0.08em',marginBottom:4}}>{code}</div>
            <div style={{fontSize:11,color:T.textMuted}}>Show this at the front desk</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Rate sheet ────────────────────────────────────────────────────────────────
function RateSheet({ open, onClose, className }) {
  const [rating, setRating] = useState(0);
  const [hov,    setHov]    = useState(0);
  const [note,   setNote]   = useState('');
  const [tags,   setTags]   = useState([]);
  const [done,   setDone]   = useState(false);
  const ALL_TAGS = ['Great instructor','High energy','Well paced','Challenging','Beginner friendly','Would repeat','Good music','Great atmosphere'];
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
            style={{position:'fixed',inset:0,zIndex:10200,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)'}}/>
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
            transition={{type:'spring',stiffness:280,damping:32}}
            style={{position:'fixed',bottom:0,left:0,right:0,zIndex:10201,borderRadius:'20px 20px 0 0',
              background:T.surface,border:`1px solid ${T.border}`,borderBottom:'none',padding:'10px 18px 44px'}}>
            <div style={{display:'flex',justifyContent:'center',paddingBottom:14}}>
              <div style={{width:32,height:3,borderRadius:99,background:'rgba(255,255,255,0.12)'}}/>
            </div>
            {done ? (
              <div style={{textAlign:'center',padding:'24px 0 8px'}}>
                <div style={{fontSize:44,marginBottom:10,animation:'cdm-pop 0.4s ease both'}}>⭐</div>
                <div style={{fontSize:18,fontWeight:700,color:T.textPrimary,marginBottom:6}}>Thanks for your review!</div>
                <div style={{fontSize:13,color:T.textSecondary,marginBottom:20}}>Your feedback helps the community.</div>
                <button onClick={onClose} style={{padding:'11px 28px',borderRadius:12,background:'rgba(255,255,255,0.07)',
                  border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:13,fontWeight:600,cursor:'pointer'}}>Done</button>
              </div>
            ) : (
              <>
                <div style={{fontSize:10,color:T.textMuted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>Rate This Class</div>
                <div style={{fontSize:16,fontWeight:700,color:T.textPrimary,marginBottom:18}}>{className}</div>
                <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:18}}>
                  {[1,2,3,4,5].map(s=>(
                    <button key={s} onMouseEnter={()=>setHov(s)} onMouseLeave={()=>setHov(0)} onClick={()=>setRating(s)}
                      style={{background:'none',border:'none',cursor:'pointer',padding:4}}>
                      <Star style={{width:32,height:32,
                        fill:s<=(hov||rating)?T.amber:'rgba(255,255,255,0.1)',
                        color:s<=(hov||rating)?T.amber:'rgba(255,255,255,0.12)',
                        transform:s<=(hov||rating)?'scale(1.12)':'scale(1)',transition:'all 0.12s'}}/>
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                  {ALL_TAGS.map(t => {
                    const on = tags.includes(t);
                    return (
                      <button key={t} onClick={()=>setTags(p=>on?p.filter(x=>x!==t):[...p,t])}
                        style={{fontSize:11,fontWeight:600,padding:'5px 11px',borderRadius:20,cursor:'pointer',
                          border:`1px solid ${on?'rgba(255,255,255,0.2)':T.border}`,
                          background:on?'rgba(255,255,255,0.08)':'transparent',
                          color:on?T.textPrimary:T.textSecondary,transition:'all 0.15s'}}>
                        {on?'✓ ':''}{t}
                      </button>
                    );
                  })}
                </div>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note (optional)…"
                  style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',
                    border:`1px solid ${T.border}`,borderRadius:12,padding:'11px 13px',fontSize:13,
                    color:'#fff',resize:'none',height:76,outline:'none',fontFamily:'inherit',marginBottom:12}}/>
                <button onClick={()=>{if(rating>0)setDone(true);}} disabled={rating===0}
                  style={{width:'100%',padding:'14px',borderRadius:14,fontSize:14,fontWeight:700,
                    cursor:rating>0?'pointer':'default',border:`1px solid ${T.border}`,
                    background:rating>0?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.03)',
                    color:rating>0?T.textPrimary:'rgba(255,255,255,0.2)',transition:'all 0.2s'}}>
                  Submit Review
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ r }) {
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.06)',
          border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:11,fontWeight:700,color:T.textSecondary,flexShrink:0}}>{r.initials}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{r.name}</div>
          <StarRow rating={r.rating} size={9}/>
        </div>
        <span style={{fontSize:11,color:T.textMuted}}>{r.date}</span>
      </div>
      <p style={{fontSize:13,color:T.textSecondary,lineHeight:1.65,margin:'0 0 8px'}}>{r.text||r.comment}</p>
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        <ThumbsUp style={{width:11,height:11,color:T.textMuted}}/>
        <span style={{fontSize:11,color:T.textMuted}}>{r.likes} helpful</span>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ClassDetailModal({
  gymClass,
  open,
  onClose,
  booked:       initBooked = false,
  onBook,
  isOwner       = false,
  friendsBooked = [],
}) {
  const [booked,      setBooked]      = useState(initBooked);
  const [waitlist,    setWaitlist]    = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [reminded,    setReminded]    = useState(false);
  const [recurring,   setRecurring]   = useState(false);
  const [showQR,      setShowQR]      = useState(false);
  const [showRate,    setShowRate]    = useState(false);
  const [toast,       setToast]       = useState('');
  const [moreReviews, setMoreReviews] = useState(false);
  const [bookAnim,    setBookAnim]    = useState(false);
  const [tab,         setTab]         = useState('details');

  useEffect(() => { setBooked(initBooked); }, [initBooked]);
  useEffect(() => { injectCSS(); }, []);

  if (!gymClass) return null;

  // Resolve schema
  const tk           = classType(gymClass);
  const cfg          = CFG[tk];
  const className    = getClassName(gymClass);
  const instructor   = getInstructor(gymClass);
  const img          = getCoverImage(gymClass, tk);
  const cap          = getCapacity(gymClass);
  const enr          = getEnrolled(gymClass);
  const left         = cap != null ? cap - enr : null;
  const full         = left !== null && left <= 0;
  const pct          = cap ? Math.min(100, Math.round(enr / cap * 100)) : null;
  const hot          = left !== null && left <= 5 && !full;
  const days         = scheduleDays(gymClass);
  const intensity    = getIntensity(gymClass);
  const equipment    = getEquipment(gymClass);
  const calories     = getCalories(gymClass);
  const cancelPolicy = getCancelPolicy(gymClass);
  const category     = cfg.label;
  const REVIEWS      = getReviews(gymClass);
  const avg          = getAvgRating(gymClass, REVIEWS);
  const reviewCount  = getReviewCount(gymClass, REVIEWS);
  const startDT      = formatDT(gymClass.start_time);
  const endDT        = formatDT(gymClass.end_time);

  const barColor = full ? T.red : pct > 65 ? T.amber : 'rgba(255,255,255,0.3)';

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''), 2200); };

  const handleBook = () => {
    if (full && !booked && !waitlist) { setWaitlist(true); showToast("Added to waitlist"); return; }
    setBookAnim(true);
    setTimeout(() => {
      const nb = !booked;
      setBooked(nb); if (nb) setWaitlist(false);
      setBookAnim(false);
      onBook && onBook(gymClass.id);
      if (nb) showToast('Booked! See you there 🎉');
    }, 240);
  };

  const ratCounts = [5,4,3,2,1].map(s => ({
    s,
    n: REVIEWS.filter(r=>r.rating===s).length,
    p: Math.round(REVIEWS.filter(r=>r.rating===s).length / REVIEWS.length * 100),
  }));

  const today    = new Date();
  const sessions = days.slice(0,4).map((d,i) => {
    const dt = new Date(today);
    const di = DAYS.indexOf(d), ti = today.getDay()===0?6:today.getDay()-1;
    let diff = di - ti; if (diff<=0) diff+=7;
    dt.setDate(today.getDate() + diff + (i>0?7:0));
    return { d, date:dt.toLocaleDateString('en-GB',{day:'numeric',month:'short'}), spots:left!==null?Math.max(0,left-i*2):null, isNext:i===0 };
  });

  const MOCK_ATT = [{id:'a1',name:'Alex M.'},{id:'a2',name:'Sara K.'},{id:'a3',name:'Tom B.'},{id:'a4',name:'Jen L.'}];
  const schemaAtt = Array.isArray(gymClass.attendees) ? gymClass.attendees.filter(a=>!a.status||a.status==='booked').slice(0,4) : [];
  const att   = [...friendsBooked,...(schemaAtt.length?schemaAtt:MOCK_ATT)].slice(0,5);
  const extra = Math.max(0, enr - att.length);

  const ghostBtn = (active, activeColor) => ({
    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
    padding:'11px', borderRadius:12, fontSize:12, fontWeight:600, cursor:'pointer',
    border:`1px solid ${active?'rgba(255,255,255,0.15)':T.border}`,
    background: active?'rgba(255,255,255,0.06)':'transparent',
    color: active?(activeColor||T.textPrimary):T.textSecondary, transition:'all 0.18s',
  });

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}
              onClick={onClose}
              style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(8px)'}}/>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div key="t" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
                  style={{position:'fixed',bottom:120,left:'50%',transform:'translateX(-50%)',zIndex:10300,
                    background:T.surfaceUp,border:`1px solid ${T.borderMid}`,borderRadius:12,
                    padding:'10px 18px',fontSize:13,fontWeight:600,color:T.textPrimary,whiteSpace:'nowrap'}}>
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sheet */}
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{type:'spring',stiffness:280,damping:34,mass:1.05}}
              style={{position:'fixed',bottom:0,left:0,right:0,zIndex:9999,
                maxHeight:'95vh',display:'flex',flexDirection:'column',
                borderRadius:'22px 22px 0 0',
                background:T.bg,
                border:`1px solid ${T.border}`,borderBottom:'none'}}>

              {/* Drag pill */}
              <div style={{display:'flex',justifyContent:'center',padding:'10px 0 0',flexShrink:0}}>
                <div style={{width:34,height:3,borderRadius:99,background:'rgba(255,255,255,0.12)'}}/>
              </div>

              {/* Scroll body */}
              <div className="cdm-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>

                {/* ── HERO ── */}
                <div style={{position:'relative',height:240,overflow:'hidden'}}>
                  <img src={img} alt={className}
                    style={{width:'100%',height:'100%',objectFit:'cover',animation:'cdm-hero 0.5s ease both'}}/>
                  {/* Pure dark gradient — no colour tint */}
                  <div style={{position:'absolute',inset:0,
                    background:'linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(10,12,20,0.88) 75%,rgba(10,12,20,1) 100%)'}}/>

                  {/* Top row */}
                  <div style={{position:'absolute',top:14,left:14,right:14,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    {/* Category pill */}
                    <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,fontWeight:700,
                      letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.65)',
                      background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.12)',
                      borderRadius:20,padding:'5px 11px',backdropFilter:'blur(8px)'}}>
                      <span style={{fontSize:12}}>{cfg.emoji}</span>{category}
                      {gymClass.is_virtual && <><span style={{opacity:0.4,margin:'0 2px'}}>·</span><Wifi style={{width:9,height:9}}/>Virtual</>}
                    </div>
                    {/* Icon buttons */}
                    <div style={{display:'flex',gap:7}}>
                      {[
                        {I:Heart,  act:()=>setSaved(s=>!s), active:saved},
                        {I:Share2, act:()=>{try{navigator.clipboard.writeText(className);}catch{}showToast('Link copied');}},
                        {I:X,      act:onClose},
                      ].map(({I,act,active},i)=>(
                        <motion.button key={i} initial={{opacity:0,scale:0.75}} animate={{opacity:1,scale:1}}
                          transition={{delay:0.08+i*0.04,type:'spring',stiffness:280,damping:24}}
                          onClick={act}
                          style={{width:34,height:34,borderRadius:'50%',background:'rgba(0,0,0,0.5)',
                            border:'1px solid rgba(255,255,255,0.12)',display:'flex',alignItems:'center',
                            justifyContent:'center',cursor:'pointer',backdropFilter:'blur(8px)'}}>
                          <I style={{width:13,height:13,
                            color: active ? '#f472b6' : '#fff',
                            fill:  active ? '#f472b6' : 'none',
                            transition:'all 0.15s'}}/>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Title area */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'0 18px 18px'}}>
                    {/* Status pills */}
                    <div style={{display:'flex',gap:5,marginBottom:8,flexWrap:'wrap'}}>
                      {booked && (
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,
                          letterSpacing:'0.06em',textTransform:'uppercase',color:T.green,
                          background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.22)',
                          borderRadius:20,padding:'3px 9px'}}>
                          <CheckCircle style={{width:9,height:9}}/>Booked
                        </span>
                      )}
                      {waitlist && !booked && (
                        <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:T.amber,
                          background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.22)',
                          borderRadius:20,padding:'3px 9px'}}>Waitlisted</span>
                      )}
                      {full && !booked && !waitlist && (
                        <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:T.red,
                          background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.22)',
                          borderRadius:20,padding:'3px 9px'}}>Class Full</span>
                      )}
                      {hot && !full && (
                        <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:T.amber,
                          background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.22)',
                          borderRadius:20,padding:'3px 9px'}}>{left} spots left</span>
                      )}
                    </div>

                    <h2 style={{fontSize:24,fontWeight:700,color:'#fff',letterSpacing:'-0.025em',lineHeight:1.15,margin:'0 0 10px'}}>
                      {className}
                    </h2>

                    {/* Instructor row */}
                    {instructor && (
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <div style={{width:30,height:30,borderRadius:'50%',
                            background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.14)',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.7)',flexShrink:0}}>
                            {ini(instructor)}
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:'#fff',lineHeight:1}}>{instructor}</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>Lead Instructor</div>
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <StarRow rating={avg}/>
                          <span style={{fontSize:12,fontWeight:700,color:T.amber}}>{avg}</span>
                          <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>({reviewCount})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Tabs ── */}
                <div style={{display:'flex',borderBottom:`1px solid ${T.border}`,paddingLeft:18,background:T.bg}}>
                  {['details','schedule','reviews'].map(s => (
                    <button key={s} onClick={()=>setTab(s)}
                      style={{padding:'13px 16px',fontSize:12,fontWeight:600,textTransform:'capitalize',
                        cursor:'pointer',background:'none',border:'none',
                        borderBottom:`2px solid ${tab===s?'rgba(255,255,255,0.6)':'transparent'}`,
                        color:tab===s?T.textPrimary:T.textMuted,transition:'all 0.18s',marginBottom:-1}}>
                      {s}
                    </button>
                  ))}
                </div>

                {/* ── Tab content ── */}
                <div style={{padding:'18px',display:'flex',flexDirection:'column',gap:16}}>

                  {/* ===== DETAILS ===== */}
                  {tab==='details' && (
                    <motion.div key="d" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.2}}>
                      <div style={{display:'flex',flexDirection:'column',gap:14}}>

                        {/* Stats — flat, no glow */}
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                          <StatCard icon={Clock} label="Duration" value={gymClass.duration_minutes?`${gymClass.duration_minutes} min`:'—'}/>
                          <StatCard icon={Users} label={cap?`${enr} / ${cap}`:'Spots'} value={full?'Full':left!==null?`${left} open`:'Open'} valueColor={full?T.red:undefined}/>
                          <StatCard icon={Zap}   label="Level"    value={intensity}/>
                        </div>

                        {/* Session time */}
                        {(startDT.date||endDT.date) && (
                          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px'}}>
                            <SectionHead>Session Time</SectionHead>
                            <div style={{display:'flex',gap:10}}>
                              {startDT.date && (
                                <div style={{flex:1,background:T.surfaceUp,borderRadius:10,padding:'10px 12px'}}>
                                  <div style={{fontSize:9.5,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.09em',marginBottom:4}}>Starts</div>
                                  <div style={{fontSize:14,fontWeight:700,color:T.textPrimary}}>{startDT.time}</div>
                                  <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{startDT.date}</div>
                                </div>
                              )}
                              {endDT.date && (
                                <div style={{flex:1,background:T.surfaceUp,borderRadius:10,padding:'10px 12px'}}>
                                  <div style={{fontSize:9.5,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.09em',marginBottom:4}}>Ends</div>
                                  <div style={{fontSize:14,fontWeight:700,color:T.textPrimary}}>{endDT.time}</div>
                                  <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{endDT.date}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Who's going */}
                        {att.length>0 && (
                          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px'}}>
                            <SectionHead action={enr>0&&<span style={{fontSize:11,color:T.textMuted}}>{enr} attending</span>}>
                              Who's Going
                            </SectionHead>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{display:'flex',alignItems:'center'}}>
                                {att.map((a,i)=>(
                                  <div key={a.id||i} style={{width:32,height:32,borderRadius:'50%',
                                    background:'rgba(255,255,255,0.07)',border:`2px solid ${T.bg}`,
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    fontSize:10,fontWeight:700,color:T.textSecondary,
                                    marginLeft:i>0?-9:0,zIndex:att.length-i,overflow:'hidden',flexShrink:0}}>
                                    {a.avatar?<img src={a.avatar} alt={a.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:ini(a.name)}
                                  </div>
                                ))}
                                {extra>0&&(
                                  <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.04)',
                                    border:`2px solid ${T.bg}`,display:'flex',alignItems:'center',justifyContent:'center',
                                    fontSize:9,fontWeight:700,color:T.textMuted,marginLeft:-9,flexShrink:0}}>+{extra}</div>
                                )}
                              </div>
                              {friendsBooked.length>0 && (
                                <div style={{flex:1,fontSize:12,color:T.textSecondary}}>
                                  {friendsBooked[0]?.name}{friendsBooked.length>1?` +${friendsBooked.length-1} more`:''} going
                                </div>
                              )}
                              <button onClick={()=>showToast('Invite link copied!')}
                                style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,
                                  color:T.textSecondary,background:'rgba(255,255,255,0.04)',
                                  border:`1px solid ${T.border}`,borderRadius:10,padding:'6px 11px',cursor:'pointer'}}>
                                <UserPlus style={{width:11,height:11}}/>Invite
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {gymClass.description && (
                          <div>
                            <SectionHead>About This Class</SectionHead>
                            <p style={{fontSize:13.5,color:T.textSecondary,lineHeight:1.7,margin:0}}>{gymClass.description}</p>
                          </div>
                        )}

                        {/* Detail rows — clean, no icon boxes */}
                        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:'4px 14px'}}>
                          <DetailRow icon={Zap}      label="Intensity"     value={intensity}/>
                          <DetailRow icon={Dumbbell} label="Equipment"     value={equipment}/>
                          <DetailRow icon={Flame}    label="Est. Calories" value={calories}/>
                          <DetailRow icon={Award}    label="Category"      value={category}/>
                          {gymClass.price_drop_in && <DetailRow icon={Tag} label="Drop-In"      value={`$${gymClass.price_drop_in}`}/>}
                          <DetailRow icon={Tag} label="Member Price" value={gymClass.price_member?`$${gymClass.price_member}`:'Contact gym'} last/>
                        </div>

                        {/* Cancellation policy */}
                        <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 13px',
                          background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.12)',borderRadius:12}}>
                          <AlertCircle style={{width:13,height:13,color:T.amber,flexShrink:0,marginTop:1}}/>
                          <div>
                            <div style={{fontSize:11,fontWeight:700,color:T.amber,marginBottom:3}}>Cancellation Policy</div>
                            <div style={{fontSize:12,color:T.textSecondary,lineHeight:1.6}}>{cancelPolicy}</div>
                          </div>
                        </div>

                        {/* Location */}
                        {gymClass.location && (
                          <div style={{display:'flex',alignItems:'center',gap:12,background:T.surface,
                            border:`1px solid ${T.border}`,borderRadius:13,padding:'13px 14px',cursor:'pointer'}}>
                            <MapPin style={{width:13,height:13,color:T.textMuted,flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{gymClass.location}</div>
                              <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>View map</div>
                            </div>
                            <ExternalLink style={{width:11,height:11,color:T.textMuted,flexShrink:0}}/>
                          </div>
                        )}

                        {/* Capacity */}
                        {pct!==null && (
                          <div>
                            <SectionHead action={
                              <span style={{fontSize:11,color:full?T.red:pct>65?T.amber:T.textMuted,fontWeight:600}}>
                                {enr} / {cap} filled
                              </span>}>
                              Capacity
                            </SectionHead>
                            <Bar pct={pct} color={barColor} h={5}/>
                            {full && (
                              <div style={{marginTop:7,fontSize:12,color:T.red,display:'flex',alignItems:'center',gap:5}}>
                                <Info style={{width:11,height:11}}/>Join the waitlist to be notified of openings
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick actions */}
                        {!isOwner && (
                          <div style={{display:'flex',gap:8}}>
                            <button onClick={()=>{setReminded(r=>!r);showToast(reminded?'Reminder removed':'Reminder set for 1hr before');}}
                              style={ghostBtn(reminded, T.amber)}>
                              <Bell style={{width:13,height:13,fill:reminded?T.amber:'none'}}/>
                              {reminded?'Reminded':'Remind Me'}
                            </button>
                            {booked ? (
                              <button onClick={()=>setShowQR(true)} style={ghostBtn(false)}>
                                <QrCode style={{width:13,height:13}}/>Check-In QR
                              </button>
                            ) : (
                              <button onClick={()=>setShowRate(true)} style={ghostBtn(false)}>
                                <Star style={{width:13,height:13}}/>Rate Class
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}

                  {/* ===== SCHEDULE ===== */}
                  {tab==='schedule' && (
                    <motion.div key="s" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.2}}>
                      <div style={{display:'flex',flexDirection:'column',gap:16}}>

                        {days.length>0 && (
                          <div>
                            <SectionHead>Weekly Days</SectionHead>
                            <div style={{display:'flex',gap:5}}>
                              {DAYS.map(d => { const on=days.includes(d); return (
                                <div key={d} style={{flex:1,textAlign:'center',padding:'8px 0',borderRadius:10,
                                  fontSize:9,fontWeight:700,letterSpacing:'0.04em',
                                  background:on?'rgba(255,255,255,0.08)':'transparent',
                                  border:`1px solid ${on?T.borderMid:T.border}`,
                                  color:on?T.textPrimary:T.textMuted}}>
                                  {d}
                                </div>
                              ); })}
                            </div>
                          </div>
                        )}

                        {booked && (
                          <div style={{display:'flex',alignItems:'center',gap:12,background:T.surface,
                            border:`1px solid ${T.border}`,borderRadius:13,padding:'13px 14px'}}>
                            <Repeat style={{width:13,height:13,color:T.textMuted,flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>Book every week</div>
                              <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>Auto-book this class weekly</div>
                            </div>
                            <div onClick={()=>{setRecurring(r=>!r);showToast(recurring?'Weekly booking removed':'Weekly booking enabled');}}
                              style={{width:42,height:24,borderRadius:12,
                                background:recurring?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.07)',
                                position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
                              <div style={{position:'absolute',top:2,left:recurring?19:2,width:20,height:20,borderRadius:'50%',
                                background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.5)'}}/>
                            </div>
                          </div>
                        )}

                        {sessions.length>0 && (
                          <div>
                            <SectionHead>Upcoming Sessions</SectionHead>
                            <div style={{display:'flex',flexDirection:'column',gap:7}}>
                              {sessions.map((s,i)=>(
                                <div key={i} style={{display:'flex',alignItems:'center',gap:12,
                                  background:s.isNext?T.surface:'transparent',
                                  border:`1px solid ${s.isNext?T.borderMid:T.border}`,
                                  borderRadius:12,padding:'11px 12px'}}>
                                  <div style={{width:40,height:40,borderRadius:10,background:T.surfaceUp,
                                    border:`1px solid ${T.border}`,display:'flex',flexDirection:'column',
                                    alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,lineHeight:1}}>{s.date.split(' ')[0]}</div>
                                    <div style={{fontSize:9,color:T.textMuted,lineHeight:1,marginTop:2}}>{s.date.split(' ')[1]}</div>
                                  </div>
                                  <div style={{flex:1}}>
                                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                                      <span style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{s.d}</span>
                                      {s.isNext&&<span style={{fontSize:9,fontWeight:700,color:T.textMuted,
                                        background:'rgba(255,255,255,0.05)',border:`1px solid ${T.border}`,
                                        borderRadius:5,padding:'1px 6px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Next</span>}
                                    </div>
                                    <div style={{display:'flex',gap:8,marginTop:2}}>
                                      {startDT.time
                                        ? <span style={{fontSize:11,color:T.textMuted}}>{startDT.time}{endDT.time?` – ${endDT.time}`:''}</span>
                                        : gymClass.schedule && typeof gymClass.schedule==='string' && <span style={{fontSize:11,color:T.textMuted}}>{gymClass.schedule}</span>}
                                      {s.spots!==null&&<span style={{fontSize:11,color:s.spots<=3?T.amber:T.textMuted,fontWeight:600}}>{s.spots<=0?'Full':`${s.spots} spots`}</span>}
                                    </div>
                                  </div>
                                  {!isOwner&&(
                                    <button onClick={handleBook}
                                      style={{fontSize:11,fontWeight:600,color:booked&&s.isNext?T.green:T.textSecondary,
                                        background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,
                                        borderRadius:9,padding:'7px 12px',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>
                                      {booked&&s.isNext?'✓ Booked':'Book'}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button onClick={()=>showToast('Opening calendar…')}
                          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px',
                            borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',
                            border:`1px solid ${T.border}`,background:'transparent',color:T.textSecondary}}>
                          <Calendar style={{width:13,height:13}}/>Add to Calendar
                          <ExternalLink style={{width:11,height:11,opacity:0.4}}/>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== REVIEWS ===== */}
                  {tab==='reviews' && (
                    <motion.div key="r" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.2}}>
                      <div style={{display:'flex',flexDirection:'column',gap:14}}>

                        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:'16px'}}>
                          <div style={{display:'flex',gap:16,alignItems:'center'}}>
                            <div style={{textAlign:'center',flexShrink:0}}>
                              <div style={{fontSize:40,fontWeight:700,color:T.textPrimary,letterSpacing:'-0.03em',lineHeight:1}}>{avg}</div>
                              <StarRow rating={avg} size={11}/>
                              <div style={{fontSize:10,color:T.textMuted,marginTop:4}}>{reviewCount} reviews</div>
                            </div>
                            <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
                              {ratCounts.map(({s,n,p})=>(
                                <div key={s} style={{display:'flex',alignItems:'center',gap:7}}>
                                  <span style={{fontSize:10,color:T.textMuted,width:7,flexShrink:0}}>{s}</span>
                                  <Star style={{width:8,height:8,fill:T.amber,color:T.amber,flexShrink:0}}/>
                                  <div style={{flex:1,height:4,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                                    <div style={{height:'100%',width:`${p}%`,background:'rgba(255,255,255,0.18)',borderRadius:99}}/>
                                  </div>
                                  <span style={{fontSize:10,color:T.textMuted,width:10,textAlign:'right',flexShrink:0}}>{n}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button onClick={()=>setShowRate(true)}
                          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'12px',
                            borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',
                            border:`1px solid ${T.border}`,background:'transparent',color:T.textSecondary}}>
                          <MessageSquare style={{width:13,height:13}}/>Write a Review
                        </button>

                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                          {(moreReviews?REVIEWS:REVIEWS.slice(0,2)).map((r,i)=><ReviewCard key={r.id||i} r={r}/>)}
                        </div>

                        {REVIEWS.length>2 && (
                          <button onClick={()=>setMoreReviews(s=>!s)}
                            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'11px',
                              borderRadius:11,fontSize:12,fontWeight:600,cursor:'pointer',
                              border:`1px solid ${T.border}`,background:'transparent',color:T.textMuted}}>
                            {moreReviews
                              ?<><ChevronUp style={{width:13,height:13}}/>Show Less</>
                              :<><ChevronDown style={{width:13,height:13}}/>Show All {reviewCount} Reviews</>}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <div style={{height:6}}/>
                </div>
              </div>

              {/* ── CTA bar ── */}
              {!isOwner && (
                <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15,type:'spring',stiffness:200,damping:28}}
                  style={{flexShrink:0,padding:'12px 16px 36px',borderTop:`1px solid ${T.border}`,background:T.bg}}>
                  {pct!==null && !full && (
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <Bar pct={pct} color={barColor} anim={false} h={3}/>
                      <span style={{fontSize:11,color:pct>65?T.amber:T.textMuted,whiteSpace:'nowrap',flexShrink:0,fontWeight:600}}>
                        {left} spot{left===1?'':'s'} left
                      </span>
                    </div>
                  )}
                  <button onClick={handleBook}
                    style={{width:'100%',padding:'15px',borderRadius:15,fontSize:15,fontWeight:700,
                      cursor:'pointer',position:'relative',overflow:'hidden',
                      background: booked  ? 'rgba(74,222,128,0.09)'
                                : waitlist ? 'rgba(251,191,36,0.09)'
                                : full     ? 'rgba(255,255,255,0.03)'
                                :            'rgba(255,255,255,0.09)',
                      color: booked  ? T.green
                           : waitlist ? T.amber
                           : full     ? 'rgba(255,255,255,0.2)'
                           :            T.textPrimary,
                      border: booked  ? '1px solid rgba(74,222,128,0.18)'
                            : waitlist ? '1px solid rgba(251,191,36,0.18)'
                            :            `1px solid ${T.borderMid}`,
                      transform: bookAnim ? 'scale(0.97)' : 'scale(1)',
                      transition:'transform 0.15s,background 0.25s,color 0.25s'}}>
                    {!booked && !waitlist && !full && (
                      <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:'inherit'}}>
                        <div style={{position:'absolute',top:0,bottom:0,width:'40%',
                          background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)',
                          animation:'cdm-shimmer 4s ease infinite 2s'}}/>
                      </div>
                    )}
                    <span style={{position:'relative',zIndex:1}}>
                      {bookAnim ? '…'
                        : booked   ? '✓ Booked — Tap to Cancel'
                        : waitlist ? 'On Waitlist — Tap to Leave'
                        : full     ? 'Join Waitlist'
                        : left!==null ? `Book Now — ${left} spot${left===1?'':'s'} left`
                        : 'Book Now'}
                    </span>
                  </button>
                </motion.div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QRModal   open={showQR}   onClose={()=>setShowQR(false)}   gymClass={gymClass}/>
      <RateSheet open={showRate} onClose={()=>setShowRate(false)} className={className}/>
    </>
  );
}
