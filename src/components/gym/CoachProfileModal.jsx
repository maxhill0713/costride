import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Award, Calendar, Clock, Users, TrendingUp, ChevronRight,
  MapPin, Check, MessageCircle, Heart, Share2, Zap, Star,
  Shield, ChevronLeft, AlertCircle
} from 'lucide-react';

/* ─── palette ─── */
const BG     = '#07111F';
const CARD   = '#0D1B2E';
const CARD2  = '#111F35';
const BORDER = 'rgba(255,255,255,0.08)';
const BLUE   = '#2F80ED';
const BLUE_DIM= 'rgba(47,128,237,0.15)';
const TEXT   = '#FFFFFF';
const SUB    = 'rgba(255,255,255,0.55)';
const MUTE   = 'rgba(255,255,255,0.28)';

/* ─── demo data ─── */
const COACH = {
  name: 'Serena Voss',
  title: 'Elite Performance Coach',
  rating: 4.9,
  review_count: 214,
  experience_years: 11,
  total_clients: 840,
  sessions_completed: 3200,
  response_time: '< 1 hr',
  bio: "I specialise in high-performance training and body recomposition. My philosophy: train smarter, recover harder, build habits that outlast any programme. Whether you're stepping on stage or just stepping up your game — I'll get you there.",
  location: 'New York, NY',
  member_since: '2019',
  specialties: ['Body Recomposition', 'Strength & Power', 'HIIT', 'Mobility', 'Nutrition'],
  certifications: [
    { name: 'NASM Certified Personal Trainer', org: 'NASM', year: '2020' },
    { name: 'Precision Nutrition Level 2',      org: 'Precision Nutrition', year: '2021' },
    { name: 'FMS Specialist',                   org: 'FMS', year: '2019' },
    { name: 'ISSA Strength & Conditioning',     org: 'ISSA', year: '2022' },
  ],
  next_available: 'Tomorrow · 7:00 AM',
  price_per_session: 85,
  classes: [
    { name: 'Power Hour',  time: '6:00 AM',  days: 'Mon · Wed · Fri', spots: 3,  total: 12, level: 'All Levels',   duration: 60 },
    { name: 'HIIT Ignite', time: '7:30 AM',  days: 'Tue · Thu',       spots: 1,  total: 10, level: 'Intermediate', duration: 45 },
    { name: 'Strength Lab',time: '9:00 AM',  days: 'Saturday',        spots: 5,  total: 8,  level: 'Advanced',     duration: 75 },
    { name: 'Core & Flex', time: '12:00 PM', days: 'Mon · Wed',       spots: 7,  total: 15, level: 'All Levels',   duration: 30 },
  ],
  reviews: [
    { name: 'Jamie R.',  initials: 'JR', rating: 5, text: "Transformed my approach to training entirely. Down 18 kg in five months — Serena's programming is genuinely elite.", ago: '2 weeks ago', tag: 'Personal Training' },
    { name: 'Marcus T.', initials: 'MT', rating: 5, text: "Extraordinary ability to push you past your limits while keeping everything safe and purposeful. Best investment I've made.", ago: '1 month ago', tag: 'HIIT Ignite' },
    { name: 'Priya S.',  initials: 'PS', rating: 5, text: "The nutrition coaching alongside PT sessions is a game changer. I feel better at 38 than I did at 28.", ago: '1 month ago', tag: 'Nutrition' },
    { name: 'David K.',  initials: 'DK', rating: 5, text: "My squat went from 80 kg to 140 kg in six months of working with Serena. Absolutely unreal.", ago: '2 months ago', tag: 'Strength Lab' },
  ],
};

const DAYS  = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const DATES = [16, 17, 18, 19, 20, 21, 22];
const TIMES = ['Morning', 'Afternoon', 'Evening'];

const LEVEL_COLOR = {
  'All Levels':   '#34d399',
  'Intermediate': '#fbbf24',
  'Advanced':     '#f87171',
};

const ini = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

function Stars({ n, size = 11 }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= n ? BLUE : 'none'}
          stroke={i <= n ? BLUE : 'rgba(255,255,255,0.14)'}
          strokeWidth={2}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

/* ═══════════════════════════ MAIN ═════════════════════════════════════════ */
export default function CoachProfileModal({ coach = COACH, open = true, onClose = () => {} }) {
  const [liked,    setLiked]    = useState(false);
  const [tab,      setTab]      = useState('about');
  const [day,      setDay]      = useState(5);
  const [time,     setTime]     = useState('Morning');
  const [booked,   setBooked]   = useState(new Set());

  const toggleBook = i =>
    setBooked(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  return (
    <AnimatePresence>
      {open && <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
          .cp-root{font-family:'Figtree',system-ui,sans-serif}
          .cp-scroll{overflow-y:auto}
          .cp-scroll::-webkit-scrollbar{display:none}
          .cp-scroll{-ms-overflow-style:none;scrollbar-width:none}
          .cp-hscroll{overflow-x:auto}
          .cp-hscroll::-webkit-scrollbar{display:none}
          .cp-hscroll{-ms-overflow-style:none;scrollbar-width:none}
          .cp-btn{border:none;outline:none;cursor:pointer;transition:opacity .12s,transform .12s,-webkit-tap-highlight-color 0s}
          .cp-btn:active{transform:scale(0.95);opacity:.85}
          .cp-row{transition:background .15s}
          .cp-row:hover{background:rgba(255,255,255,0.05)!important}
          .cp-row:active{background:rgba(255,255,255,0.08)!important}
          .cp-dayBtn{transition:all .16s ease}
          .cp-timeBtn{transition:all .16s ease}
          @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.35}}
        `}</style>

        {/* backdrop */}
        <motion.div key="bd"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:.25 }} onClick={onClose}
          style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}
        />

        {/* sheet */}
        <motion.div key="sh" className="cp-root"
          initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
          transition={{ type:'spring', stiffness:320, damping:38, mass:.9 }}
          style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9991, maxHeight:'96vh', display:'flex', flexDirection:'column' }}
        >
          {/* ─── COMPACT HERO ──────────────────────────────────────────── */}
          <div style={{ background:`linear-gradient(175deg,#0C1A30 0%,${BG} 100%)`, borderRadius:'24px 24px 0 0', border:`1px solid ${BORDER}`, borderBottom:'none', boxShadow:'0 -12px 60px rgba(0,0,0,0.85)', flexShrink:0, position:'relative', overflow:'hidden' }}>
            {/* subtle top-right glow */}
            <div style={{ position:'absolute', top:-80, right:-60, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(47,128,237,0.09) 0%, transparent 70%)', pointerEvents:'none' }}/>

            {/* handle */}
            <div style={{ width:36, height:4, borderRadius:99, background:'rgba(255,255,255,0.14)', margin:'14px auto 0' }}/>

            {/* top controls */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px 0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <MapPin size={11} color={MUTE}/>
                <span style={{ fontSize:12, fontWeight:500, color:MUTE }}>{coach.location}</span>
              </div>
              <div style={{ display:'flex', gap:7 }}>
                <SmallBtn onClick={()=>{}} icon={<Share2 size={14} color={SUB}/>}/>
                <SmallBtn onClick={()=>setLiked(l=>!l)} icon={<Heart size={14} fill={liked?'#f87171':'none'} color={liked?'#f87171':SUB}/>}/>
                <SmallBtn onClick={onClose} icon={<X size={14} color={SUB}/>}/>
              </div>
            </div>

            {/* identity row */}
            <div style={{ display:'flex', gap:15, alignItems:'center', padding:'16px 18px 0' }}>
              {/* avatar */}
              <div style={{ flexShrink:0, position:'relative' }}>
                <div style={{ width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#1a3566,#0d1e44)', border:`2px solid rgba(47,128,237,0.5)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
                  {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : ini(coach.name)}
                </div>
                <div style={{ position:'absolute', bottom:4, right:4, width:12, height:12, borderRadius:'50%', background:'#22c55e', border:`2px solid #0C1A30`, boxShadow:'0 0 6px rgba(34,197,94,0.7)' }}/>
              </div>

              {/* name + meta */}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:22, fontWeight:800, color:TEXT, lineHeight:1.1, letterSpacing:'-0.025em' }}>{coach.name}</div>
                <div style={{ fontSize:12, fontWeight:700, color:BLUE, letterSpacing:'.06em', textTransform:'uppercase', marginTop:3, marginBottom:8 }}>{coach.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Stars n={Math.round(coach.rating)} size={12}/>
                  <span style={{ fontSize:13, fontWeight:700, color:TEXT }}>{coach.rating}</span>
                  <span style={{ fontSize:12, color:MUTE, fontWeight:500 }}>({coach.review_count})</span>
                  <span style={{ width:3, height:3, borderRadius:'50%', background:MUTE, display:'inline-block', marginLeft:2 }}/>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'pulse-dot 2s ease-in-out infinite' }}/>
                    <span style={{ fontSize:11, fontWeight:600, color:'rgba(34,197,94,0.85)' }}>Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* stats — horizontal divider row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', margin:'16px 18px 0', borderRadius:14, overflow:'hidden', border:`1px solid ${BORDER}`, background:'rgba(255,255,255,0.025)' }}>
              {[
                { val:`${coach.experience_years}`, unit:'yrs', label:'Experience' },
                { val:`${coach.total_clients}`,    unit:'',    label:'Clients' },
                { val:`${(coach.sessions_completed/1000).toFixed(1)}k`, unit:'', label:'Sessions' },
              ].map((s,i,arr) => (
                <div key={i} style={{ padding:'12px 8px', textAlign:'center', borderRight: i < arr.length-1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:TEXT, letterSpacing:'-0.03em', lineHeight:1 }}>{s.val}<span style={{ fontSize:11, fontWeight:600, color:MUTE }}>{s.unit}</span></div>
                  <div style={{ fontSize:10, fontWeight:600, color:MUTE, textTransform:'uppercase', letterSpacing:'.09em', marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* price + availability */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 18px', padding:'11px 14px', borderRadius:12, background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.18)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Clock size={12} color='rgba(34,197,94,0.7)'/>
                <span style={{ fontSize:12, fontWeight:600, color:SUB }}>Next available</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#4ade80' }}>{coach.next_available}</span>
              </div>
              <span style={{ fontSize:15, fontWeight:800, color:TEXT }}>£{coach.price_per_session}<span style={{ fontSize:11, fontWeight:500, color:MUTE }}>/session</span></span>
            </div>

            {/* specialty chips */}
            <div className="cp-hscroll" style={{ display:'flex', gap:7, padding:'0 18px 18px' }}>
              {coach.specialties.map((s,i) => (
                <span key={i} style={{ flexShrink:0, padding:'5px 13px', borderRadius:99, fontSize:12, fontWeight:600, background: i===0 ? BLUE : 'rgba(255,255,255,0.05)', border:`1px solid ${i===0 ? BLUE : BORDER}`, color: i===0 ? '#fff' : SUB, whiteSpace:'nowrap' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* ─── TAB BAR ────────────────────────────────────────────────── */}
          <div style={{ display:'flex', background:BG, borderBottom:`1px solid ${BORDER}`, position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
            {['about','schedule','reviews'].map(t => (
              <button key={t} className="cp-btn" onClick={()=>setTab(t)} style={{
                flex:1, padding:'13px 0 11px', background:'transparent',
                fontFamily:"'Figtree',sans-serif", fontSize:13.5, fontWeight:700,
                textTransform:'capitalize', letterSpacing:'.01em', cursor:'pointer',
                color: tab===t ? TEXT : MUTE,
                borderBottom: tab===t ? `2px solid ${BLUE}` : '2px solid transparent',
              }}>{t}</button>
            ))}
          </div>

          {/* ─── SCROLLABLE BODY ────────────────────────────────────────── */}
          <div className="cp-scroll" style={{ flex:1, background:BG }}>
            <div style={{ padding:'20px 18px 130px' }}>
              <AnimatePresence mode="wait">
                <motion.div key={tab}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                  transition={{ duration:.18 }}>
                  {tab==='about'    && <AboutTab    coach={coach}/>}
                  {tab==='schedule' && <ScheduleTab coach={coach} day={day} setDay={setDay} time={time} setTime={setTime} booked={booked} toggleBook={toggleBook}/>}
                  {tab==='reviews'  && <ReviewsTab  coach={coach}/>}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ─── FOOTER CTA ─────────────────────────────────────────────── */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:20, padding:'14px 18px 30px', background:`linear-gradient(to top, ${BG} 55%, transparent)`, pointerEvents:'none' }}>
            <div style={{ display:'flex', gap:10 }}>
              <button className="cp-btn" style={{ width:52, height:52, borderRadius:14, border:`1px solid ${BORDER}`, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, pointerEvents:'auto' }}>
                <MessageCircle size={19} color={SUB}/>
              </button>
              <button className="cp-btn" style={{ flex:1, height:52, borderRadius:14, border:'none', background:`linear-gradient(135deg, #1E6FE5 0%, ${BLUE} 100%)`, color:'#fff', fontSize:15, fontWeight:800, fontFamily:"'Figtree',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 28px rgba(47,128,237,0.42)', pointerEvents:'auto' }}>
                <Calendar size={16}/> Book a Session <ChevronRight size={15} strokeWidth={2.5}/>
              </button>
            </div>
          </div>
        </motion.div>
      </>}
    </AnimatePresence>
  );
}

/* ─── ABOUT ────────────────────────────────────────────────────────────────── */
function AboutTab({ coach }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

      {/* bio */}
      <div>
        <Label>About</Label>
        <p style={{ margin:0, fontSize:14.5, lineHeight:1.75, color:'rgba(226,232,240,0.72)', fontWeight:400 }}>{coach.bio}</p>
      </div>

      {/* quick facts 2×2 */}
      <div>
        <Label>Quick Facts</Label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { label:'Member Since', val:coach.member_since },
            { label:'Location',     val:coach.location },
            { label:'Response',     val:coach.response_time },
            { label:'Rating',       val:`${coach.rating} / 5.0` },
          ].map((f,i) => (
            <div key={i} style={{ padding:'13px 14px', borderRadius:14, background:CARD, border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:10.5, fontWeight:600, color:MUTE, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:5 }}>{f.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>{f.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* certifications — list rows */}
      <div>
        <Label>Certifications</Label>
        <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${BORDER}` }}>
          {(coach.certifications||[]).map((c,i,arr) => {
            const name = typeof c==='string'?c:c.name;
            const sub  = typeof c==='string'?null:`${c.org} · ${c.year}`;
            return (
              <motion.div key={i}
                initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.05 }}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:CARD, borderBottom: i<arr.length-1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ width:34, height:34, borderRadius:10, background:BLUE_DIM, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Award size={15} color={BLUE}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, color:'rgba(255,255,255,0.88)', lineHeight:1.25 }}>{name}</div>
                  {sub && <div style={{ fontSize:11.5, color:MUTE, marginTop:2 }}>{sub}</div>}
                </div>
                <Check size={15} color={BLUE} strokeWidth={2.5}/>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── SCHEDULE ─────────────────────────────────────────────────────────────── */
function ScheduleTab({ coach, day, setDay, time, setTime, booked, toggleBook }) {
  const classes = coach.classes || [];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* day strip */}
      <div className="cp-hscroll" style={{ display:'flex', gap:7 }}>
        {DAYS.map((d,i) => {
          const sel = day===i;
          return (
            <button key={i} className="cp-dayBtn cp-btn" onClick={()=>setDay(i)} style={{
              flexShrink:0, minWidth:52, padding:'9px 4px', borderRadius:16,
              border:`1px solid ${sel?BLUE:BORDER}`,
              background: sel ? BLUE : CARD,
              textAlign:'center', fontFamily:"'Figtree',sans-serif",
              boxShadow: sel ? '0 2px 14px rgba(47,128,237,0.4)' : 'none',
            }}>
              <div style={{ fontSize:9, fontWeight:700, color: sel?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.3)', letterSpacing:'.1em', marginBottom:4 }}>{d}</div>
              <div style={{ fontSize:18, fontWeight:800, color: sel?'#fff':'rgba(255,255,255,0.65)' }}>{DATES[i]}</div>
            </button>
          );
        })}
      </div>

      {/* time pills */}
      <div style={{ display:'flex', gap:8 }}>
        {TIMES.map(t => {
          const sel = time===t;
          return (
            <button key={t} className="cp-timeBtn cp-btn" onClick={()=>setTime(t)} style={{
              flex:1, padding:'10px 6px', borderRadius:10,
              border:`1px solid ${sel?BLUE:BORDER}`,
              background: sel ? BLUE : CARD,
              color: sel?'#fff':SUB,
              fontSize:13, fontWeight:700, fontFamily:"'Figtree',sans-serif",
              boxShadow: sel ? '0 2px 12px rgba(47,128,237,0.35)' : 'none',
            }}>{t}</button>
          );
        })}
      </div>

      {/* session count */}
      <div style={{ fontSize:13, color:MUTE, fontWeight:500, marginTop:-8 }}>
        {classes.length} sessions · tap a class to reserve your spot
      </div>

      {/* class list — full-width rows for scannability */}
      <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${BORDER}` }}>
        {classes.map((cls,i,arr) => {
          const isBooked = booked.has(i);
          const spotsLow = cls.spots <= 2;
          const fillPct  = Math.round(((cls.total - cls.spots) / cls.total) * 100);
          const lvlColor = LEVEL_COLOR[cls.level] || BLUE;
          return (
            <motion.div key={i} className="cp-row"
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.06 }}
              onClick={() => toggleBook(i)}
              style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'15px 16px', cursor:'pointer',
                background: isBooked ? 'rgba(47,128,237,0.08)' : CARD,
                borderBottom: i<arr.length-1 ? `1px solid ${BORDER}` : 'none',
              }}>

              {/* left: colour accent */}
              <div style={{ width:4, height:40, borderRadius:99, background: isBooked ? BLUE : `rgba(${lvlColor === '#34d399' ? '52,211,153' : lvlColor === '#fbbf24' ? '251,191,36' : '248,113,113'},0.5)`, flexShrink:0 }}/>

              {/* middle: class info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:700, color: isBooked ? '#fff' : 'rgba(255,255,255,0.92)' }}>{cls.name}</span>
                  {isBooked && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:BLUE, color:'#fff' }}>Booked</span>}
                  {spotsLow && !isBooked && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)' }}>⚡ {cls.spots} left</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={11} color={MUTE}/>
                    <span style={{ fontSize:12, color:SUB, fontWeight:500 }}>{cls.time}</span>
                  </div>
                  <span style={{ color:BORDER }}>·</span>
                  <span style={{ fontSize:12, color:SUB, fontWeight:500 }}>{cls.days}</span>
                  <span style={{ color:BORDER }}>·</span>
                  <span style={{ fontSize:12, color:SUB, fontWeight:500 }}>{cls.duration}min</span>
                </div>
                {/* spot fill bar */}
                <div style={{ marginTop:8, height:3, borderRadius:99, background:'rgba(255,255,255,0.07)', overflow:'hidden', maxWidth:120 }}>
                  <div style={{ height:'100%', borderRadius:99, width:`${fillPct}%`, background: spotsLow ? '#f87171' : BLUE, transition:'width .4s' }}/>
                </div>
              </div>

              {/* right: level + chevron */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:99, background:`${lvlColor}18`, color:lvlColor, border:`1px solid ${lvlColor}30` }}>{cls.level}</span>
                {isBooked
                  ? <Check size={18} color={BLUE} strokeWidth={2.5}/>
                  : <ChevronRight size={18} color={MUTE}/>
                }
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display:'flex', gap:16, paddingTop:2 }}>
        {Object.entries(LEVEL_COLOR).map(([l,c]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:c }}/>
            <span style={{ fontSize:11, color:MUTE, fontWeight:500 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── REVIEWS ──────────────────────────────────────────────────────────────── */
function ReviewsTab({ coach }) {
  const reviews  = coach.reviews || [];
  const barPcts  = { 5:88, 4:8, 3:2, 2:1, 1:1 };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* summary banner */}
      <div style={{ padding:'18px', borderRadius:16, background:CARD, border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ fontSize:48, fontWeight:800, color:TEXT, lineHeight:1, letterSpacing:'-0.04em' }}>{coach.rating}</div>
          <Stars n={5} size={13}/>
          <div style={{ fontSize:11, color:MUTE, marginTop:5, fontWeight:500 }}>{coach.review_count} reviews</div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
          {[5,4,3,2,1].map(n => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:MUTE, fontWeight:600, width:8, textAlign:'right' }}>{n}</span>
              <div style={{ flex:1, height:6, borderRadius:99, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                <motion.div
                  initial={{ width:0 }} animate={{ width:`${barPcts[n]}%` }}
                  transition={{ duration:.65, delay:(5-n)*.08 }}
                  style={{ height:'100%', borderRadius:99, background:`linear-gradient(90deg, #1E6FE5, ${BLUE})` }}
                />
              </div>
              <span style={{ fontSize:10, color:MUTE, fontWeight:500, width:26, textAlign:'right' }}>{barPcts[n]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* review list — full-width rows */}
      {reviews.map((r,i) => (
        <motion.div key={i}
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.07 }}
          style={{ padding:'16px', borderRadius:16, background:CARD, border:`1px solid ${BORDER}` }}>
          {/* header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#1a3566,#0d1e44)', border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.8)', flexShrink:0 }}>
                {r.initials}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>{r.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                  <Stars n={r.rating} size={10}/>
                  <span style={{ fontSize:11, color:MUTE }}>{r.ago}</span>
                </div>
              </div>
            </div>
            <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:99, background:BLUE_DIM, border:`1px solid rgba(47,128,237,0.25)`, color:'#60a5fa', flexShrink:0, marginLeft:8 }}>{r.tag}</span>
          </div>
          <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:'rgba(226,232,240,0.65)', fontWeight:400 }}>{r.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── ATOMS ────────────────────────────────────────────────────────────────── */
function SmallBtn({ icon, onClick }) {
  return (
    <button className="cp-btn" onClick={onClick} style={{ width:33, height:33, borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {icon}
    </button>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:MUTE, textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12 }}>
      {children}
    </div>
  );
}
