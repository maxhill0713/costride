import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  X, Award, Calendar, Clock, Users, TrendingUp, ChevronRight, MapPin,
  Check, MessageCircle, Heart, Share2, Zap, Star, Play, Instagram,
  Youtube, ArrowRight, Flame, Target, Shield
} from 'lucide-react';

/* ─────────────────────────── DEMO DATA ──────────────────────────────────── */
const COACH = {
  name: 'Serena Voss',
  title: 'Elite Performance Coach',
  handle: '@serenavoss',
  rating: 4.9,
  review_count: 214,
  experience_years: 11,
  total_clients: 840,
  sessions_completed: 3200,
  response_time: '< 1 hr',
  bio: "I specialise in high-performance training and body recomposition. My philosophy: train smarter, recover harder, build habits that outlast any programme. Whether you're stepping on stage or just stepping up your game — I'll get you there.",
  location: 'NY 10516',
  member_since: '2019',
  specialties: ['Body Recomposition', 'Strength & Power', 'HIIT', 'Mobility', 'Nutrition'],
  certifications: [
    { name: 'NASM Certified Personal Trainer', org: 'NASM', year: '2020' },
    { name: 'Precision Nutrition Level 2', org: 'Precision Nutrition', year: '2021' },
    { name: 'FMS Specialist', org: 'FMS', year: '2019' },
    { name: 'ISSA Strength & Conditioning', org: 'ISSA', year: '2022' },
  ],
  next_available: 'Tomorrow · 7:00 AM',
  price_per_session: 85,
  classes: [
    { name: 'Power Hour', time: '6:00 AM', days: 'Mon · Wed · Fri', spots: 3, total_spots: 12, level: 'All Levels', duration: 60, gradient: ['#1a2a5e','#0d1a3c'] },
    { name: 'HIIT Ignite', time: '7:30 AM', days: 'Tue · Thu', spots: 1, total_spots: 10, level: 'Intermediate', duration: 45, gradient: ['#1e1a40','#0d0d2b'] },
    { name: 'Strength Lab', time: '9:00 AM', days: 'Saturday', spots: 5, total_spots: 8, level: 'Advanced', duration: 75, gradient: ['#1a2e1a','#0d1e0d'] },
    { name: 'Core & Flex', time: '12:00 PM', days: 'Mon · Wed', spots: 7, total_spots: 15, level: 'All Levels', duration: 30, gradient: ['#2e1a1a','#1e0d0d'] },
  ],
  reviews: [
    { name: 'Jamie R.', avatar: 'JR', rating: 5, text: "Transformed my approach to training entirely. Results speak for themselves — down 18 kg in five months. Serena's programming is genuinely elite.", ago: '2 weeks ago', tag: 'Personal Training' },
    { name: 'Marcus T.', avatar: 'MT', rating: 5, text: "Extraordinary ability to push you past your limits while keeping everything safe and purposeful. The best investment I've made.", ago: '1 month ago', tag: 'HIIT Ignite' },
    { name: 'Priya S.', avatar: 'PS', rating: 5, text: "The nutrition coaching alongside PT sessions is a game changer. I feel better at 38 than I did at 28. Worth every penny.", ago: '1 month ago', tag: 'Nutrition Coaching' },
    { name: 'David K.', avatar: 'DK', rating: 5, text: "Absolutely incredible coach. My squat went from 80kg to 140kg in six months of working with Serena. Unreal.", ago: '2 months ago', tag: 'Strength Lab' },
  ],
};

const DAYS = [
  { short: 'MON', date: 16 }, { short: 'TUE', date: 17 }, { short: 'WED', date: 18 },
  { short: 'THU', date: 19 }, { short: 'FRI', date: 20 }, { short: 'SAT', date: 21 },
  { short: 'SUN', date: 22 },
];
const TIMES = ['Morning', 'Afternoon', 'Evening'];

/* ─────────────────────────── ANIMATED COUNTER ──────────────────────────── */
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 900;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <>{val}{suffix}</>;
}

/* ─────────────────────────── HELPERS ───────────────────────────────────── */
const ini = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function Stars({ n, size = 11 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= n ? '#3B82F6' : 'none'}
          stroke={i <= n ? '#3B82F6' : 'rgba(255,255,255,0.15)'}
          strokeWidth={2}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

const levelMeta = {
  'All Levels':   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' },
  'Intermediate': { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  'Advanced':     { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
};

/* ═══════════════════════════ MAIN COMPONENT ════════════════════════════════ */
export default function CoachProfileModal({ coach = COACH, open = true, onClose = () => {} }) {
  const [liked, setLiked]               = useState(false);
  const [tab, setTab]                   = useState('about');
  const [day, setDay]                   = useState(5);
  const [timeFilter, setTimeFilter]     = useState('Morning');
  const [bookedClasses, setBookedClasses] = useState(new Set());

  const toggleBook = (i) =>
    setBookedClasses(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
            *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
            .cpm{font-family:'Plus Jakarta Sans',system-ui,sans-serif}
            .cpm-scroll::-webkit-scrollbar{display:none}
            .cpm-scroll{-ms-overflow-style:none;scrollbar-width:none}
            .cpm-hscroll::-webkit-scrollbar{display:none}
            .cpm-hscroll{-ms-overflow-style:none;scrollbar-width:none;overflow-x:auto}
            .cpm-btn{transition:transform .12s,opacity .12s;cursor:pointer;border:none;outline:none}
            .cpm-btn:active{transform:scale(0.94)!important}
            .cpm-dayBtn{transition:all .18s cubic-bezier(.4,0,.2,1)}
            .cpm-timeBtn{transition:all .18s cubic-bezier(.4,0,.2,1)}
            .cpm-classCard{transition:all .18s cubic-bezier(.4,0,.2,1)}
            .cpm-classCard:hover{transform:translateY(-2px)}
            .cpm-classCard:active{transform:scale(0.97)}
            .cpm-tabBtn{transition:color .18s,border-color .18s}
            .cpm-pill{transition:all .15s}
            .cpm-iconBtn{transition:background .15s,transform .12s}
            .cpm-iconBtn:active{transform:scale(0.9)}
            @keyframes cpm-glow{0%,100%{opacity:.6}50%{opacity:1}}
            @keyframes cpm-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
            @keyframes cpm-dot{0%,100%{opacity:1}50%{opacity:.4}}
          `}</style>

          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(2,6,20,0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          />

          {/* Sheet */}
          <motion.div
            key="sh"
            className="cpm"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 40, mass: 0.9 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9991,
              maxHeight: '96vh', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* ══ HERO ══════════════════════════════════════════════════════ */}
            <HeroSection coach={coach} liked={liked} setLiked={setLiked} onClose={onClose} />

            {/* ══ BODY ══════════════════════════════════════════════════════ */}
            <div className="cpm-scroll" style={{ flex: 1, overflowY: 'auto', background: '#060D1F', display: 'flex', flexDirection: 'column' }}>

              {/* Tab bar */}
              <div style={{
                display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'sticky', top: 0, zIndex: 10, background: '#060D1F',
                padding: '0 20px',
              }}>
                {['about','schedule','reviews'].map(t => (
                  <button key={t} className="cpm-tabBtn cpm-btn" onClick={() => setTab(t)} style={{
                    flex: 1, padding: '14px 0 12px', border: 'none', background: 'transparent',
                    fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700,
                    textTransform: 'capitalize', letterSpacing: '.01em', cursor: 'pointer',
                    color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)',
                    borderBottom: tab === t ? '2px solid #3B82F6' : '2px solid transparent',
                  }}>{t}</button>
                ))}
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '22px 20px 140px' }}>
                <AnimatePresence mode="wait">
                  <motion.div key={tab}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}>
                    {tab === 'about'    && <AboutTab coach={coach} />}
                    {tab === 'schedule' && <ScheduleTab coach={coach} day={day} setDay={setDay} timeFilter={timeFilter} setTimeFilter={setTimeFilter} bookedClasses={bookedClasses} toggleBook={toggleBook} />}
                    {tab === 'reviews'  && <ReviewsTab coach={coach} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ══ STICKY FOOTER ════════════════════════════════════════════ */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
              padding: '16px 20px 32px',
              background: 'linear-gradient(to top, #060D1F 60%, transparent)',
              pointerEvents: 'none',
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Message button */}
                <button className="cpm-btn" style={{
                  width: 52, height: 52, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'auto', cursor: 'pointer', flexShrink: 0,
                }}>
                  <MessageCircle size={18} color="rgba(255,255,255,0.7)" />
                </button>
                {/* Book CTA */}
                <button className="cpm-btn" style={{
                  flex: 1, height: 52, borderRadius: 16, border: 'none',
                  background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 32px rgba(59,130,246,0.45)',
                  pointerEvents: 'auto', cursor: 'pointer',
                }}>
                  <Calendar size={16} />
                  Book a Session
                  <ChevronRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══ HERO SECTION ═══════════════════════════════════════════════════════════ */
function HeroSection({ coach, liked, setLiked, onClose }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #0A1535 0%, #060D1F 100%)',
      borderRadius: '26px 26px 0 0',
      border: '1px solid rgba(255,255,255,0.07)',
      borderBottom: 'none',
      boxShadow: '0 -20px 80px rgba(0,0,0,0.9)',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Mesh glow bg */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-100, left:'30%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)', filter:'blur(30px)' }} />
        <div style={{ position:'absolute', top:20, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', filter:'blur(20px)' }} />
        {/* Subtle grid lines */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.025 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>

      <div style={{ position:'relative', zIndex:2 }}>
        {/* Handle */}
        <div style={{ width:38, height:4, borderRadius:99, background:'rgba(255,255,255,0.15)', margin:'14px auto 0' }} />

        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:99, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <MapPin size={11} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,0.5)' }}>{coach.location}</span>
          </div>
          <div style={{ display:'flex', gap:7 }}>
            <IBtn onClick={() => {}} icon={<Share2 size={14} color="rgba(255,255,255,0.55)" />} />
            <IBtn onClick={() => setLiked(l => !l)} icon={<Heart size={14} fill={liked ? '#f87171' : 'none'} color={liked ? '#f87171' : 'rgba(255,255,255,0.55)'} />} />
            <IBtn onClick={onClose} icon={<X size={14} color="rgba(255,255,255,0.55)" />} />
          </div>
        </div>

        {/* Avatar + identity */}
        <div style={{ padding:'18px 18px 0', display:'flex', gap:16, alignItems:'flex-start' }}>
          {/* Avatar */}
          <div style={{ flexShrink:0, position:'relative' }}>
            {/* Glow ring */}
            <div style={{
              position:'absolute', inset:-5, borderRadius:26,
              background:'linear-gradient(135deg, rgba(59,130,246,0.5), rgba(99,102,241,0.3))',
              filter:'blur(8px)', opacity:.7, animation:'cpm-glow 3s ease-in-out infinite',
            }} />
            <div style={{
              width:80, height:80, borderRadius:22, position:'relative',
              background:'linear-gradient(135deg, #1e3a7a 0%, #0d1e4a 100%)',
              border:'2px solid rgba(59,130,246,0.6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:24, fontWeight:900, color:'#fff',
              fontFamily:"'Syne',sans-serif",
              boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
              overflow:'hidden',
            }}>
              {coach.avatar_url
                ? <img src={coach.avatar_url} alt={coach.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : ini(coach.name)
              }
            </div>
            {/* Online dot */}
            <div style={{ position:'absolute', bottom:5, right:5, width:13, height:13, borderRadius:'50%', background:'#22c55e', border:'2.5px solid #0A1535', boxShadow:'0 0 8px rgba(34,197,94,0.8)' }} />
          </div>

          {/* Identity block */}
          <div style={{ flex:1, paddingTop:2 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:'#fff', lineHeight:1.05, letterSpacing:'-0.02em' }}>{coach.name}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#3B82F6', letterSpacing:'.07em', textTransform:'uppercase', marginTop:4, marginBottom:8 }}>{coach.title}</div>
            {/* Rating row */}
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Stars n={Math.round(coach.rating)} size={12} />
              <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{coach.rating}</span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>· {coach.review_count} reviews</span>
            </div>
            {/* Respond time */}
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:7 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'cpm-pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Responds in {coach.response_time}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, padding:'16px 18px 4px' }}>
          {[
            { val: coach.experience_years, suf:'', unit:'yrs', label:'Experience', icon:<TrendingUp size={13} color="#3B82F6" /> },
            { val: coach.total_clients, suf:'', unit:'', label:'Clients', icon:<Users size={13} color="#3B82F6" /> },
            { val: Math.round(coach.sessions_completed/100)/10, suf:'k', unit:'', label:'Sessions', icon:<Zap size={13} color="#3B82F6" /> },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 + i*.06 }}
              style={{
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:16, padding:'13px 10px', textAlign:'center',
              }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1, fontFamily:"'Syne',sans-serif" }}>
                <Counter to={s.val} suffix={s.suf} />{s.unit}
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.1em', marginTop:4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Availability bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          margin:'14px 18px', padding:'12px 16px', borderRadius:14,
          background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)' }}>Next available</span>
            <span style={{ fontSize:12, fontWeight:800, color:'#4ade80' }}>{coach.next_available}</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
            <span style={{ fontSize:16, fontWeight:900, color:'#fff', fontFamily:"'Syne',sans-serif" }}>£{coach.price_per_session}</span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>/session</span>
          </div>
        </div>

        {/* Specialty pills */}
        <div className="cpm-hscroll" style={{ display:'flex', gap:7, padding:'0 18px 20px' }}>
          {coach.specialties.map((s, i) => (
            <motion.span key={i} initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:.15 + i*.04 }}
              className="cpm-pill" style={{
                flexShrink:0, padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:700,
                background: i === 0 ? '#3B82F6' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${i === 0 ? '#3B82F6' : 'rgba(255,255,255,0.09)'}`,
                color: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)',
              }}>{s}</motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ ABOUT TAB ═══════════════════════════════════════════════════════════════ */
function AboutTab({ coach }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Bio */}
      <div>
        <SLabel>About</SLabel>
        <p style={{ margin:0, fontSize:14.5, lineHeight:1.75, color:'rgba(226,232,240,0.7)', fontWeight:400 }}>{coach.bio}</p>
      </div>

      {/* Quick facts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { icon:<Shield size={14} color="#3B82F6"/>, label:'Member since', val:coach.member_since },
          { icon:<MapPin size={14} color="#3B82F6"/>, label:'Location', val:coach.location },
          { icon:<Clock size={14} color="#3B82F6"/>, label:'Response time', val:coach.response_time },
          { icon:<Star size={14} color="#3B82F6"/>, label:'Avg rating', val:`${coach.rating} / 5.0` },
        ].map((f,i) => (
          <div key={i} style={{ padding:'13px', borderRadius:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              {f.icon}
              <span style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'.08em' }}>{f.label}</span>
            </div>
            <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{f.val}</span>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div>
        <SLabel>Certifications</SLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {coach.certifications.map((c, i) => (
            <motion.div key={i}
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.07 }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width:36, height:36, borderRadius:12, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Award size={15} color="#3B82F6" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)', lineHeight:1.3 }}>{c.name}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:500, marginTop:2 }}>{c.org} · {c.year}</div>
              </div>
              <Check size={14} color="#3B82F6" strokeWidth={2.5} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ SCHEDULE TAB ════════════════════════════════════════════════════════════ */
function ScheduleTab({ coach, day, setDay, timeFilter, setTimeFilter, bookedClasses, toggleBook }) {
  const classes = coach.classes || [];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.13em', marginBottom:4 }}>Classes</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.02em', lineHeight:1.1 }}>Sessions</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginTop:4, fontWeight:500 }}>
          <span style={{ color:'#3B82F6', fontWeight:700 }}>{timeFilter}</span>
        </div>
      </div>

      {/* Day strip */}
      <div className="cpm-hscroll" style={{ display:'flex', gap:8 }}>
        {DAYS.map((d, i) => {
          const sel = day === i;
          return (
            <button key={i} className="cpm-dayBtn cpm-btn" onClick={() => setDay(i)} style={{
              flexShrink:0, minWidth:54, padding:'10px 6px', borderRadius:18,
              border:`1px solid ${sel ? '#3B82F6' : 'rgba(255,255,255,0.07)'}`,
              background: sel
                ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                : 'rgba(255,255,255,0.03)',
              cursor:'pointer', textAlign:'center', fontFamily:"'Plus Jakarta Sans',sans-serif",
              boxShadow: sel ? '0 4px 16px rgba(59,130,246,0.4)' : 'none',
            }}>
              <div style={{ fontSize:9, fontWeight:800, color: sel ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)', letterSpacing:'.1em', marginBottom:5 }}>{d.short}</div>
              <div style={{ fontSize:19, fontWeight:900, color: sel ? '#fff' : 'rgba(255,255,255,0.65)', lineHeight:1, fontFamily:"'Syne',sans-serif" }}>{d.date}</div>
            </button>
          );
        })}
      </div>

      {/* Time filter pills */}
      <div style={{ display:'flex', gap:8 }}>
        {TIMES.map(t => {
          const sel = timeFilter === t;
          return (
            <button key={t} className="cpm-timeBtn cpm-btn" onClick={() => setTimeFilter(t)} style={{
              flex:1, padding:'11px 8px', borderRadius:99,
              border:`1px solid ${sel ? '#3B82F6' : 'rgba(255,255,255,0.08)'}`,
              background: sel ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : 'rgba(255,255,255,0.04)',
              color: sel ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize:13, fontWeight:700, cursor:'pointer',
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              boxShadow: sel ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
            }}>{t}</button>
          );
        })}
      </div>

      {/* Session count */}
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:600, marginTop:-8 }}>
        {classes.length} sessions available · tap to book
      </div>

      {/* Class cards — 2-column grid */}
      {classes.length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 0', color:'rgba(255,255,255,0.3)', fontSize:14 }}>No classes scheduled yet.</div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {classes.map((cls, i) => {
          const booked = bookedClasses.has(i);
          const lm = levelMeta[cls.level];
          const spotsLow = cls.spots <= 2;
          const spotsPercent = ((cls.total_spots - cls.spots) / cls.total_spots) * 100;
          return (
            <motion.div key={i}
              className="cpm-classCard"
              initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*.07 }}
              onClick={() => toggleBook(i)}
              style={{
                borderRadius:20, overflow:'hidden', cursor:'pointer', position:'relative',
                background: `linear-gradient(160deg, ${cls.gradient[0]}, ${cls.gradient[1]})`,
                border:`1.5px solid ${booked ? '#3B82F6' : 'rgba(255,255,255,0.08)'}`,
                minHeight:180, display:'flex', flexDirection:'column', justifyContent:'flex-end',
                boxShadow: booked ? '0 4px 24px rgba(59,130,246,0.3)' : '0 2px 12px rgba(0,0,0,0.4)',
              }}>

              {/* Top badges */}
              <div style={{ position:'absolute', top:10, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                {/* CLASS badge */}
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:99, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#3B82F6', animation:'cpm-dot 2s ease-in-out infinite' }}/>
                  <span style={{ fontSize:9.5, fontWeight:800, color:'#fff', letterSpacing:'.1em' }}>CLASS</span>
                </div>
                {/* Booked / duration */}
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ padding:'4px 9px', borderRadius:99, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)' }}>
                    <span style={{ fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,0.65)' }}>{cls.duration}min</span>
                  </div>
                  {booked && (
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'#3B82F6', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(59,130,246,0.5)' }}>
                      <Check size={11} color="#fff" strokeWidth={3}/>
                    </div>
                  )}
                </div>
              </div>

              {/* Spot progress bar */}
              <div style={{ position:'absolute', bottom:78, left:12, right:12 }}>
                <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:99, background: spotsLow ? '#f87171' : '#3B82F6', width:`${spotsPercent}%`, transition:'width .4s' }}/>
                </div>
              </div>

              {/* Coach initials circle — bottom right */}
              <div style={{ position:'absolute', bottom:52, right:10, width:30, height:30, borderRadius:'50%', background:'#3B82F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
                {ini(coach.name)}
              </div>

              {/* Bottom info */}
              <div style={{ padding:'10px 12px 12px', backdropFilter:'blur(2px)' }}>
                <div style={{ fontSize:14, fontWeight:900, color:'#fff', lineHeight:1.2, letterSpacing:'-0.01em', marginBottom:5, fontFamily:"'Syne',sans-serif" }}>{cls.name}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={9} color="rgba(255,255,255,0.4)" />
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{cls.time}</span>
                  </div>
                  <span style={{ fontSize:9.5, fontWeight:700, color: spotsLow ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                    {spotsLow ? `⚡ ${cls.spots} left` : `${cls.spots} spots`}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Level legend */}
      <div style={{ display:'flex', gap:12, paddingTop:4 }}>
        {Object.entries(levelMeta).map(([label, m]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:m.color }}/>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ REVIEWS TAB ═════════════════════════════════════════════════════════════ */
function ReviewsTab({ coach }) {
  const reviews = coach.reviews || [];
  const barWidths = { 5: 88, 4: 8, 3: 2, 2: 1, 1: 1 };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Summary card */}
      <div style={{ padding:'18px', borderRadius:20, background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.18)', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:52, fontWeight:800, color:'#fff', lineHeight:1, letterSpacing:'-0.04em' }}>{coach.rating || '—'}</div>
          <Stars n={Math.round(coach.rating || 0)} size={13}/>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:6, fontWeight:600 }}>{coach.review_count || reviews.length} reviews</div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
          {[5,4,3,2,1].map(n => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:9 }}>
              <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)', fontWeight:700, width:8, textAlign:'right' }}>{n}</span>
              <div style={{ flex:1, height:6, borderRadius:99, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                <motion.div
                  initial={{ width:0 }} animate={{ width:`${barWidths[n]}%` }}
                  transition={{ duration:.7, delay:(5-n)*.08, ease:[.4,0,.2,1] }}
                  style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg, #2563EB, #3B82F6)' }}
                />
              </div>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:600, width:24 }}>{barWidths[n]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      {reviews.map((r, i) => (
        <motion.div key={i}
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.08 }}
          style={{ padding:'16px', borderRadius:18, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Avatar */}
              <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg, #1e3a7a, #0d1e4a)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.8)', flexShrink:0 }}>
                {r.avatar}
              </div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:800, color:'rgba(255,255,255,0.9)' }}>{r.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <Stars n={r.rating} size={10}/>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>{r.ago}</span>
                </div>
              </div>
            </div>
            <span style={{ fontSize:10.5, fontWeight:700, padding:'4px 10px', borderRadius:99, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', color:'#60a5fa', flexShrink:0 }}>{r.tag}</span>
          </div>
          <p style={{ margin:0, fontSize:13.5, lineHeight:1.7, color:'rgba(226,232,240,0.62)', fontWeight:400 }}>{r.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ══ MICRO ═══════════════════════════════════════════════════════════════════ */
function IBtn({ icon, onClick }) {
  return (
    <button className="cpm-iconBtn cpm-btn" onClick={onClick} style={{
      width:34, height:34, borderRadius:11, background:'rgba(255,255,255,0.05)',
      border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
    }}>{icon}</button>
  );
}

function SLabel({ children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:13 }}>
      <div style={{ width:3, height:16, borderRadius:99, background:'linear-gradient(180deg,#3B82F6,#1d4ed8)' }}/>
      <span style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.13em' }}>{children}</span>
    </div>
  );
}