import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Users, MapPin, Star, Calendar, Dumbbell,
  ChevronRight, Zap, Heart, Share2, Bell, CheckCircle,
  TrendingUp, Award, Repeat, ExternalLink, MessageSquare,
  AlertCircle, UserPlus, Shield, Tag, ChevronDown, ChevronUp,
  Filter, Target, Languages, Sparkles, Send, Trophy,
  BadgeCheck, ScanFace, ClipboardCheck, Flame,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS — shared with ClassDetailModal
───────────────────────────────────────────────────────────── */
const CARD_BG     = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const SHEET_BG    = 'linear-gradient(160deg,#0c1128 0%,#060810 100%)';

const CFG = {
  hiit:     { label:'HIIT',     emoji:'⚡', color:'#f87171', rgb:'248,113,113', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.25)',  glow:'rgba(239,68,68,0.3)'  },
  yoga:     { label:'Yoga',     emoji:'🧘', color:'#34d399', rgb:'52,211,153',  bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', glow:'rgba(16,185,129,0.3)' },
  strength: { label:'Strength', emoji:'🏋️', color:'#818cf8', rgb:'129,140,248', bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.25)', glow:'rgba(99,102,241,0.3)' },
  cardio:   { label:'Cardio',   emoji:'🏃', color:'#fb7185', rgb:'251,113,133', bg:'rgba(244,63,94,0.12)',  border:'rgba(244,63,94,0.25)',  glow:'rgba(244,63,94,0.3)'  },
  spin:     { label:'Spin',     emoji:'🚴', color:'#38bdf8', rgb:'56,189,248',  bg:'rgba(14,165,233,0.12)', border:'rgba(14,165,233,0.25)', glow:'rgba(14,165,233,0.3)' },
  boxing:   { label:'Boxing',   emoji:'🥊', color:'#fb923c', rgb:'251,146,60',  bg:'rgba(234,88,12,0.12)',  border:'rgba(234,88,12,0.25)',  glow:'rgba(234,88,12,0.3)'  },
  pilates:  { label:'Pilates',  emoji:'🌸', color:'#c084fc', rgb:'192,132,252', bg:'rgba(168,85,247,0.12)', border:'rgba(168,85,247,0.25)', glow:'rgba(168,85,247,0.3)' },
  default:  { label:'Class',    emoji:'🎯', color:'#38bdf8', rgb:'56,189,248',  bg:'rgba(14,165,233,0.10)', border:'rgba(14,165,233,0.2)',  glow:'rgba(14,165,233,0.2)' },
};

const IMGS = {
  hiit:'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=800&q=80',
  strength:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  coach:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  before1:'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
  after1:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  before2:'https://images.unsplash.com/photo-1524678714210-9917a6c619c2?w=400&q=80',
  after2:'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
@keyframes cpm-shimmer{0%{transform:translateX(-100%);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(220%);opacity:0}}
@keyframes cpm-bar{from{width:0}}
@keyframes cpm-hero-in{from{opacity:0.6;transform:scale(1.05)}to{opacity:1;transform:scale(1)}}
@keyframes cpm-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes cpm-glow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes cpm-pop{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.08);opacity:1}80%{transform:scale(0.97)}100%{transform:scale(1);opacity:1}}
@keyframes cpm-slide-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes cpm-intensity{from{width:0}}
.cpm-root{font-family:'Figtree',system-ui,sans-serif}
.cpm-scroll{overflow-y:auto;-ms-overflow-style:none;scrollbar-width:none}
.cpm-scroll::-webkit-scrollbar{display:none}
.cpm-hscroll{overflow-x:auto;-ms-overflow-style:none;scrollbar-width:none}
.cpm-hscroll::-webkit-scrollbar{display:none}
.cpm-btn{border:none;outline:none;cursor:pointer;transition:opacity .12s,transform .12s}
.cpm-btn:active{transform:scale(0.95)!important;opacity:.85}
.cpm-row:hover{background:rgba(255,255,255,0.04)!important}
.cpm-pkg:hover{border-color:rgba(59,130,246,0.45)!important}
.cpm-slot:hover{background:rgba(37,99,235,0.12)!important;border-color:rgba(59,130,246,0.4)!important}
`;

function injectCSS(){if(!document.getElementById('cpm-css2')){const s=document.createElement('style');s.id='cpm-css2';s.textContent=CSS;document.head.appendChild(s);}}

/* ─── Helpers ─────────────────────────────────────────────── */
const ini=(n='')=>(n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
function classType(name=''){
  const n=name.toLowerCase();
  if(n.includes('hiit')||n.includes('interval'))return'hiit';
  if(n.includes('yoga')||n.includes('zen'))return'yoga';
  if(n.includes('strength')||n.includes('weight')||n.includes('power')||n.includes('lift'))return'strength';
  if(n.includes('cardio')||n.includes('aerobic')||n.includes('zumba'))return'cardio';
  if(n.includes('spin')||n.includes('cycle'))return'spin';
  if(n.includes('box')||n.includes('mma'))return'boxing';
  if(n.includes('pilates')||n.includes('barre'))return'pilates';
  return'default';
}

/* ─── Shared atoms ────────────────────────────────────────── */
function Bar({pct,color,anim=true,h=6}){
  return(
    <div style={{height:h,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden',position:'relative'}}>
      <div style={{height:'100%',width:`${pct}%`,borderRadius:99,background:color,animation:anim?'cpm-bar 1.1s cubic-bezier(0.16,1,0.3,1) both':'none'}}/>
      <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:99,pointerEvents:'none'}}>
        <div style={{position:'absolute',top:0,bottom:0,width:'50%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',animation:'cpm-shimmer 3.2s cubic-bezier(0.4,0,0.6,1) infinite'}}/>
      </div>
    </div>
  );
}
function StatCard({icon:Icon,label,value,color,subColor}){
  return(
    <div style={{background:CARD_BG,border:CARD_BORDER,borderRadius:16,padding:'14px 10px',textAlign:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color}99,transparent)`}}/>
      <Icon style={{width:17,height:17,color,margin:'0 auto 7px',filter:`drop-shadow(0 0 5px ${color}55)`}}/>
      <div style={{fontSize:13,fontWeight:900,color:subColor||'#fff',letterSpacing:'-0.02em',lineHeight:1.2}}>{value}</div>
      <div style={{fontSize:9.5,color:'rgba(255,255,255,0.3)',fontWeight:700,marginTop:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</div>
    </div>
  );
}
function SectionHead({children,action}){
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
      <div style={{fontSize:10.5,fontWeight:800,color:'rgba(255,255,255,0.28)',letterSpacing:'0.14em',textTransform:'uppercase'}}>{children}</div>
      {action}
    </div>
  );
}

/* ─── Message Modal ───────────────────────────────────────── */
function MessageModal({open,onClose,coach,preText='',showToast}){
  const [msg,setMsg]=useState(preText);
  const [sent,setSent]=useState(false);
  useEffect(()=>{if(open){setMsg(preText);setSent(false);}},[open,preText]);
  const templates=[
    {label:'HIIT Classes',  text:`Hi ${coach?.name?.split(' ')[0]}, I'm interested in your HIIT classes. When is the best time to start?`},
    {label:'Personal Training', text:`Hi ${coach?.name?.split(' ')[0]}, I'd love to book a personal training session. What does your typical programme look like?`},
    {label:'Custom Plan',   text:`Hi ${coach?.name?.split(' ')[0]}, could you put together a custom training plan for me? My main goal is body recomposition.`},
  ];
  return(
    <AnimatePresence>
      {open&&(
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
            style={{position:'fixed',inset:0,zIndex:10200,background:'rgba(2,4,10,0.9)',backdropFilter:'blur(14px)'}}/>
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
            transition={{type:'spring',stiffness:280,damping:32,mass:1.1}}
            style={{position:'fixed',bottom:0,left:0,right:0,zIndex:10201,borderRadius:'24px 24px 0 0',background:SHEET_BG,border:'1px solid rgba(255,255,255,0.09)',borderBottom:'none',padding:'10px 18px 36px'}}>
            <div style={{display:'flex',justifyContent:'center',paddingBottom:14}}><div style={{width:36,height:4,borderRadius:99,background:'rgba(255,255,255,0.14)'}}/></div>
            {sent?(
              <div style={{textAlign:'center',padding:'16px 0 8px'}}>
                <div style={{fontSize:48,marginBottom:10,animation:'cpm-pop 0.4s ease both'}}>💬</div>
                <div style={{fontSize:19,fontWeight:800,color:'#fff',marginBottom:5}}>Message sent!</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:18}}>
                  {coach?.name?.split(' ')[0]} typically replies in {coach?.response_time||'< 1 hr'}
                </div>
                <button className="cpm-btn" onClick={onClose} style={{padding:'12px 32px',borderRadius:14,background:'rgba(37,99,235,0.15)',border:'1px solid rgba(59,130,246,0.3)',color:'#60a5fa',fontSize:13,fontWeight:800}}>Done</button>
              </div>
            ):(
              <>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{width:42,height:42,borderRadius:14,background:'linear-gradient(135deg,rgba(37,99,235,0.55),rgba(37,99,235,0.22))',border:'1px solid rgba(59,130,246,0.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:'#60a5fa',flexShrink:0}}>
                    {ini(coach?.name)}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{coach?.name}</div>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                      <div style={{width:5,height:5,borderRadius:'50%',background:'#22c55e'}}/>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600}}>Responds in {coach?.response_time||'< 1 hr'}</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,marginBottom:12}}>
                  {templates.map((t,i)=>(
                    <button key={i} className="cpm-btn" onClick={()=>setMsg(t.text)}
                      style={{padding:'5px 11px',borderRadius:99,fontSize:11,fontWeight:700,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.5)',whiteSpace:'nowrap',cursor:'pointer'}}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea value={msg} onChange={e=>setMsg(e.target.value)}
                  style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:14,padding:'13px 14px',fontSize:14,color:'#fff',resize:'none',height:100,outline:'none',fontFamily:'inherit',lineHeight:1.65,marginBottom:14}}/>
                <button className="cpm-btn" onClick={()=>{if(msg.trim())setSent(true);}}
                  disabled={!msg.trim()}
                  style={{width:'100%',padding:'15px',borderRadius:16,fontSize:15,fontWeight:900,cursor:msg.trim()?'pointer':'default',border:'none',background:msg.trim()?'linear-gradient(135deg,#2563eb,#1d4ed8)':'rgba(255,255,255,0.05)',color:msg.trim()?'#fff':'rgba(255,255,255,0.2)',boxShadow:msg.trim()?'0 6px 24px rgba(37,99,235,0.4)':'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all 0.2s'}}>
                  <Send style={{width:15,height:15}}/> Send Message
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── DEMO DATA ───────────────────────────────────────────── */
const DEMO_COACH = {
  name:'Serena Voss',
  title:'Elite Performance Coach',
  rating:4.9,
  review_count:214,
  experience_years:11,
  total_clients:840,
  sessions_completed:3200,
  response_time:'< 1 hr',
  match_score:92,
  bio:"I specialise in high-performance training and body recomposition. My philosophy: train smarter, recover harder, build habits that outlast any programme.",
  philosophy:"I reject one-size-fits-all programming. Every plan I build starts from where you are, not where someone else is. I blend progressive overload, periodisation, and lifestyle-first habits — so results stick long after we finish working together.",
  location:'New York, NY',
  member_since:'2019',
  image_url:IMGS.coach,
  languages:['English','Spanish'],
  specialties:['Body Recomposition','Strength & Power','HIIT','Mobility','Nutrition'],
  certifications:[
    {name:'NASM Certified Personal Trainer',org:'NASM',year:'2020'},
    {name:'Precision Nutrition Level 2',org:'Precision Nutrition',year:'2021'},
    {name:'FMS Specialist',org:'FMS',year:'2019'},
    {name:'ISSA Strength & Conditioning',org:'ISSA',year:'2022'},
  ],
  verification:{id:true,certifications:true,background:true},
  next_available:'Tomorrow · 7:00 AM',
  price_per_session:85,
  free_consultation:true,
  packages:[
    {sessions:1,  price:85,  label:'Single',  popular:false, discount:null},
    {sessions:5,  price:380, label:'5 Pack',  popular:true,  discount:'Save 10%'},
    {sessions:10, price:720, label:'10 Pack', popular:false, discount:'Save 15%'},
  ],
  availability_slots:[
    {date:'Tomorrow',    day:'Thu',time:'7:00 AM', spots:3},
    {date:'Tomorrow',    day:'Thu',time:'11:00 AM',spots:2},
    {date:'Fri 22 Mar',  day:'Fri',time:'6:30 AM', spots:5},
    {date:'Sat 23 Mar',  day:'Sat',time:'9:00 AM', spots:4},
    {date:'Mon 25 Mar',  day:'Mon',time:'7:00 AM', spots:3},
  ],
  achievements:[
    'Helped 120+ clients lose 10 kg+',
    '5 national competition winners coached',
    'Featured in Women\'s Health Magazine 2023',
    'Rated #1 PT at New York Fitness Club',
  ],
  transformations:[
    {before:IMGS.before1,after:IMGS.after1,caption:'12 weeks · Fat loss · -18 kg',name:'Jamie R.'},
    {before:IMGS.before2,after:IMGS.after2,caption:'16 weeks · Strength · +40 kg squat',name:'David K.'},
  ],
  weekly_schedule:[
    {day:'MON',slots:['6:00 AM','11:00 AM','6:00 PM']},
    {day:'TUE',slots:['7:30 AM','5:00 PM']},
    {day:'WED',slots:['6:00 AM','11:00 AM','6:00 PM']},
    {day:'THU',slots:['7:00 AM','11:00 AM']},
    {day:'FRI',slots:['6:30 AM','4:00 PM']},
    {day:'SAT',slots:['9:00 AM']},
    {day:'SUN',slots:[]},
  ],
  classes:[
    {id:'c1',name:'Power Hour', duration_minutes:60,difficulty:'all_levels',  schedule:'6:00 AM', days:'Mon · Wed · Fri',capacity:12,enrolled:9, location:'Studio 2',  intensity:7, best_for:['Strength','Endurance']},
    {id:'c2',name:'HIIT Ignite',duration_minutes:45,difficulty:'intermediate',schedule:'7:30 AM', days:'Tue · Thu',      capacity:10,enrolled:9, location:'Main Floor', intensity:9, best_for:['Fat Loss','Cardio']},
    {id:'c3',name:'Strength Lab',duration_minutes:75,difficulty:'advanced',   schedule:'9:00 AM', days:'Saturday',       capacity:8, enrolled:3, location:'Weight Room',intensity:8, best_for:['Muscle','Strength']},
    {id:'c4',name:'Core & Flex', duration_minutes:30,difficulty:'all_levels',  schedule:'12:00 PM',days:'Mon · Wed',      capacity:15,enrolled:8, location:'Studio 1',  intensity:4, best_for:['Flexibility','Recovery']},
  ],
  reviews:[
    {initials:'JR',name:'Jamie R.',  rating:5,date:'2 days ago',  text:"Transformed my approach to training. Down 18 kg in five months — genuinely elite programming.",likes:18,tag:'Personal Training'},
    {initials:'MT',name:'Marcus T.', rating:5,date:'1 week ago',  text:"Extraordinary ability to push you past your limits while keeping everything safe and purposeful.",likes:12,tag:'HIIT Ignite'},
    {initials:'PS',name:'Priya S.',  rating:5,date:'1 month ago', text:"Nutrition coaching alongside PT is a game changer. I feel better at 38 than I did at 28.",likes:9,tag:'Nutrition'},
    {initials:'DK',name:'David K.',  rating:5,date:'2 months ago',text:"Squat went from 80 kg to 140 kg in six months. Absolutely unreal.",likes:7,tag:'Strength Lab'},
  ],
};

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function CoachProfileModal({
  coach: rawCoach=null, open=true, onClose=()=>{},
  onClassSelect=null, bookedClasses=[],
  userGoals=['Fat Loss','Strength'],
  gymClasses=[],
}){
  // Merge real coach entity data with display-only defaults
  const coach = rawCoach ? {
    title: 'Personal Coach',
    review_count: 0,
    sessions_completed: (rawCoach.total_clients || 0) * 8,
    response_time: '< 2 hrs',
    location: rawCoach.gym_name || 'At the gym',
    member_since: rawCoach.created_date ? new Date(rawCoach.created_date).getFullYear().toString() : '2023',
    languages: ['English'],
    price_per_session: null,
    free_consultation: false,
    packages: [],
    availability_slots: [],
    transformations: [],
    achievements: [],
    weekly_schedule: [],
    philosophy: null,
    verification: null,
    match_score: null,
    reviews: [],
    classes: gymClasses,
    ...rawCoach,
  } : null;

  const [liked,     setLiked]     = useState(false);
  const [reminded,  setReminded]  = useState(false);
  const [tab,       setTab]       = useState('about');
  const [toast,     setToast]     = useState('');
  const [moreRev,   setMoreRev]   = useState(false);
  const [msgOpen,   setMsgOpen]   = useState(false);
  const [msgPreText,setMsgPreText]= useState('');
  const [selPkg,    setSelPkg]    = useState(1);
  const [bookAnim,  setBookAnim]  = useState(false);
  const [consultAnim,setConsultAnim]=useState(false);

  useEffect(()=>{injectCSS();},[]);

  if(!coach) return null;
  const heroImg   = coach.image_url||IMGS.coach;
  const avgRating = coach.rating;
  const reviews   = coach.reviews||[];
  const ratCounts = [5,4,3,2,1].map(s=>({s,n:reviews.filter(r=>r.rating===s).length,p:reviews.length?Math.round(reviews.filter(r=>r.rating===s).length/reviews.length*100):0}));
  const selPkgObj = (coach.packages||[])[selPkg];

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(''),2400);};
  const openMsg=(pre='')=>{setMsgPreText(pre);setMsgOpen(true);};

  const handleBook=()=>{
    setBookAnim(true);
    setTimeout(()=>{setBookAnim(false);showToast('Booking confirmed! Check your email 🎉');},260);
  };
  const handleConsult=()=>{
    setConsultAnim(true);
    setTimeout(()=>{setConsultAnim(false);showToast('Free consultation booked! 📅');},260);
  };

  return(
    <>
      <style>{CSS}</style>
      <AnimatePresence>
        {open&&(
          <>
            {/* Backdrop */}
            <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.28}} onClick={onClose}
              style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(2,4,10,0.87)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)'}}/>

            {/* Toast */}
            <AnimatePresence>
              {toast&&(
                <motion.div key="toast" initial={{opacity:0,y:18,scale:0.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:10,scale:0.96}}
                  transition={{duration:0.28,ease:[0.34,1.1,0.64,1]}}
                  style={{position:'fixed',bottom:130,left:'50%',transform:'translateX(-50%)',zIndex:10300,background:'rgba(12,16,36,0.98)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:14,padding:'11px 20px',fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',backdropFilter:'blur(20px)',boxShadow:'0 4px 24px rgba(37,99,235,0.22)'}}>
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sheet */}
            <motion.div key="sh" className="cpm-root" initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{type:'spring',stiffness:280,damping:32,mass:1.1}}
              style={{position:'fixed',bottom:0,left:0,right:0,zIndex:9999,maxHeight:'95vh',display:'flex',flexDirection:'column',borderRadius:'26px 26px 0 0',background:SHEET_BG,border:'1px solid rgba(255,255,255,0.09)',borderBottom:'none',boxShadow:'0 -16px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.06)'}}>

              {/* Top accent line */}
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,borderRadius:'26px 26px 0 0',background:'linear-gradient(90deg,transparent 0%,#2563eb 30%,rgba(59,130,246,0.9) 50%,#2563eb 70%,transparent 100%)'}}/>

              {/* Handle */}
              <div style={{display:'flex',justifyContent:'center',padding:'10px 0 0',flexShrink:0}}>
                <div style={{width:38,height:4,borderRadius:99,background:'rgba(255,255,255,0.14)'}}/>
              </div>

              {/* Scroll body */}
              <div className="cpm-scroll" style={{flex:1}}>

                {/* ── HERO ──────────────────────────────────────── */}
                <div style={{position:'relative',height:240,overflow:'hidden',flexShrink:0}}>
                  <img src={heroImg} alt={coach.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',animation:'cpm-hero-in 0.6s cubic-bezier(0.16,1,0.3,1) both'}}/>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(6,8,18,0.97) 100%)'}}/>
                  <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 75% 25%,rgba(37,99,235,0.14) 0%,transparent 60%)'}}/>

                  {/* Action buttons */}
                  <div style={{position:'absolute',top:13,left:14,right:14,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:0.08,duration:0.35}}
                      style={{display:'flex',alignItems:'center',gap:5,fontSize:10,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase',color:'#38bdf8',background:'rgba(0,0,0,0.62)',border:'1px solid rgba(56,189,248,0.25)',borderRadius:20,padding:'5px 11px',backdropFilter:'blur(12px)'}}>
                      🏅 Coach
                    </motion.div>
                    <div style={{display:'flex',gap:7}}>
                      {[
                        {I:Heart, act:()=>setLiked(l=>!l),on:liked,ac:'#f472b6'},
                        {I:Share2,act:()=>showToast('Link copied 🔗'),on:false},
                        {I:X,     act:onClose,on:false},
                      ].map(({I,act,on,ac},i)=>(
                        <motion.button key={i} initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}} transition={{delay:0.1+i*0.05,type:'spring',stiffness:260,damping:24}}
                          onClick={act} className="cpm-btn"
                          style={{width:35,height:35,borderRadius:'50%',background:'rgba(0,0,0,0.58)',border:'1px solid rgba(255,255,255,0.14)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)'}}>
                          <I style={{width:14,height:14,color:on?ac:'#fff',fill:on&&ac?ac:'none',transition:'all 0.2s'}}/>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Hero identity */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'0 18px 16px'}}>
                    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.05,type:'spring',stiffness:220,damping:28}}>
                      <div style={{display:'flex',gap:6,marginBottom:9,flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:900,letterSpacing:'0.07em',textTransform:'uppercase',color:'#34d399',background:'rgba(16,185,129,0.18)',border:'1px solid rgba(52,211,153,0.35)',borderRadius:20,padding:'3px 9px'}}>
                          <CheckCircle style={{width:9,height:9}}/>Verified Coach
                        </span>
                        <span style={{fontSize:10,fontWeight:900,textTransform:'uppercase',color:'#38bdf8',background:'rgba(56,189,248,0.12)',border:'1px solid rgba(56,189,248,0.25)',borderRadius:20,padding:'3px 9px'}}>
                          🟢 Available
                        </span>
                        {coach.match_score&&(
                          <span style={{fontSize:10,fontWeight:900,textTransform:'uppercase',color:'#c084fc',background:'rgba(168,85,247,0.12)',border:'1px solid rgba(192,132,252,0.3)',borderRadius:20,padding:'3px 9px',display:'inline-flex',alignItems:'center',gap:4}}>
                            <Sparkles style={{width:9,height:9}}/>{coach.match_score}% Match
                          </span>
                        )}
                      </div>
                      <h2 style={{fontSize:25,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',lineHeight:1.12,margin:'0 0 12px',textShadow:'0 2px 16px rgba(0,0,0,0.6)'}}>{coach.name}</h2>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <div style={{width:33,height:33,borderRadius:'50%',background:'linear-gradient(135deg,rgba(37,99,235,0.55),rgba(37,99,235,0.22))',border:'1.5px solid rgba(59,130,246,0.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:'#60a5fa',boxShadow:'0 0 10px rgba(37,99,235,0.3)'}}>
                            {ini(coach.name)}
                          </div>
                          <div>
                            <div style={{fontSize:12.5,fontWeight:800,color:'#fff',lineHeight:1}}>{coach.title}</div>
                            <div style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}>
                              <MapPin style={{width:10,height:10,color:'rgba(255,255,255,0.35)'}}/>
                              <span style={{fontSize:10,color:'rgba(255,255,255,0.38)',fontWeight:600}}>{coach.location}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                          <div style={{display:'flex',gap:1}}>
                            {[1,2,3,4,5].map(s=><Star key={s} style={{width:10,height:10,fill:s<=Math.round(avgRating)?'#fbbf24':'rgba(255,255,255,0.15)',color:s<=Math.round(avgRating)?'#fbbf24':'rgba(255,255,255,0.15)'}}/>)}
                          </div>
                          <span style={{fontSize:12,fontWeight:800,color:'#fbbf24'}}>{avgRating}</span>
                          <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>({coach.review_count})</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* ── Match Score banner ─────────────────────────── */}
                {coach.match_score&&(
                  <div style={{margin:'0 18px',marginTop:14,padding:'12px 16px',borderRadius:14,background:'linear-gradient(135deg,rgba(168,85,247,0.1),rgba(99,102,241,0.08))',border:'1px solid rgba(168,85,247,0.22)',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,borderRadius:12,background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Sparkles style={{width:18,height:18,color:'#c084fc'}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:3}}>{coach.match_score}% match for your goals</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Based on: {userGoals.join(', ')}</div>
                    </div>
                    <div style={{position:'relative',width:40,height:40,flexShrink:0}}>
                      <svg width="40" height="40" viewBox="0 0 40 40" style={{transform:'rotate(-90deg)'}}>
                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="3"/>
                        <circle cx="20" cy="20" r="16" fill="none" stroke="#c084fc" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${2*Math.PI*16}`}
                          strokeDashoffset={`${2*Math.PI*16*(1-coach.match_score/100)}`}
                          style={{transition:'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)'}}/>
                      </svg>
                      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:'#c084fc'}}>{coach.match_score}</div>
                    </div>
                  </div>
                )}

                {/* ── Tab bar ────────────────────────────────────── */}
                <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.06)',paddingLeft:18,marginTop:14}}>
                  {['about','classes','reviews'].map(t=>(
                    <button key={t} className="cpm-btn" onClick={()=>setTab(t)}
                      style={{padding:'12px 16px',fontSize:12,fontWeight:800,textTransform:'capitalize',letterSpacing:'0.02em',cursor:'pointer',background:'none',border:'none',borderBottom:`2px solid ${tab===t?'#2563eb':'transparent'}`,color:tab===t?'#60a5fa':'rgba(255,255,255,0.32)',transition:'color 0.2s,border-color 0.2s',marginBottom:-1}}>
                      {t}
                    </button>
                  ))}
                </div>

                {/* ── Tab content ────────────────────────────────── */}
                <div style={{padding:'18px 18px',display:'flex',flexDirection:'column',gap:18}}>
                  <AnimatePresence mode="wait">

                    {/* ══ ABOUT ══════════════════════════════════ */}
                    {tab==='about'&&(
                      <motion.div key="about" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.22}}
                        style={{display:'flex',flexDirection:'column',gap:18}}>

                        {/* Stat cards */}
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                          <StatCard icon={TrendingUp} label="Experience" value={`${coach.experience_years} yrs`} color="#38bdf8"/>
                          <StatCard icon={Users}      label="Clients"    value={`${coach.total_clients}`}         color="#818cf8"/>
                          <StatCard icon={Zap}        label="Sessions"   value={`${(coach.sessions_completed/1000).toFixed(1)}k`} color="#34d399"/>
                        </div>

                        {/* Verification depth */}
                        {coach.verification&&(
                          <div style={{background:CARD_BG,border:CARD_BORDER,borderRadius:16,padding:'13px 15px'}}>
                            <SectionHead>Verification</SectionHead>
                            <div style={{display:'flex',gap:8}}>
                              {[
                                {icon:ScanFace,     label:'ID Verified',           ok:coach.verification.id},
                                {icon:BadgeCheck,   label:'Certs Verified',        ok:coach.verification.certifications},
                                {icon:ClipboardCheck,label:'Background Checked',   ok:coach.verification.background},
                              ].map(({icon:Ic,label,ok},i)=>(
                                <div key={i} style={{flex:1,textAlign:'center',padding:'10px 6px',borderRadius:12,background:ok?'rgba(52,211,153,0.07)':'rgba(255,255,255,0.03)',border:`1px solid ${ok?'rgba(52,211,153,0.25)':'rgba(255,255,255,0.07)'}`}}>
                                  <Ic style={{width:16,height:16,color:ok?'#34d399':'rgba(255,255,255,0.2)',margin:'0 auto 5px'}}/>
                                  <div style={{fontSize:9,fontWeight:800,color:ok?'#34d399':'rgba(255,255,255,0.25)',textAlign:'center',lineHeight:1.3}}>{label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bio */}
                        {coach.bio&&(
                          <div>
                            <SectionHead>About</SectionHead>
                            <p style={{fontSize:13.5,color:'rgba(255,255,255,0.6)',lineHeight:1.7,margin:0}}>{coach.bio}</p>
                          </div>
                        )}

                        {/* Training Philosophy */}
                        {coach.philosophy&&(
                          <div style={{padding:'14px 16px',borderRadius:16,background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',position:'relative',overflow:'hidden'}}>
                            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>
                            <SectionHead>My Approach</SectionHead>
                            <p style={{fontSize:13.5,color:'rgba(255,255,255,0.6)',lineHeight:1.7,margin:0,fontStyle:'italic'}}>"{coach.philosophy}"</p>
                          </div>
                        )}

                        {/* Client Achievements */}
                        {coach.achievements?.length>0&&(
                          <div>
                            <SectionHead>Client Achievements</SectionHead>
                            <div style={{display:'flex',flexDirection:'column',gap:7}}>
                              {coach.achievements.map((a,i)=>(
                                <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                                  style={{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',borderRadius:14,background:CARD_BG,border:CARD_BORDER}}>
                                  <Trophy style={{width:15,height:15,color:'#fbbf24',flexShrink:0,filter:'drop-shadow(0 0 5px rgba(251,191,36,0.5))'}}/>
                                  <span style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.82)'}}>{a}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Before / After */}
                        {coach.transformations?.length>0&&(
                          <div>
                            <SectionHead>Client Transformations</SectionHead>
                            <div style={{display:'flex',flexDirection:'column',gap:10}}>
                              {coach.transformations.map((t,i)=>(
                                <div key={i} style={{borderRadius:16,overflow:'hidden',background:CARD_BG,border:CARD_BORDER}}>
                                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',position:'relative'}}>
                                    <div style={{position:'relative'}}>
                                      <img src={t.before} alt="Before" style={{width:'100%',height:110,objectFit:'cover',display:'block'}}/>
                                      <div style={{position:'absolute',bottom:6,left:6,fontSize:9.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',color:'#fff',background:'rgba(0,0,0,0.7)',padding:'3px 8px',borderRadius:6}}>Before</div>
                                    </div>
                                    <div style={{position:'relative'}}>
                                      <img src={t.after} alt="After" style={{width:'100%',height:110,objectFit:'cover',display:'block'}}/>
                                      <div style={{position:'absolute',bottom:6,right:6,fontSize:9.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',color:'#34d399',background:'rgba(0,0,0,0.7)',padding:'3px 8px',borderRadius:6}}>After</div>
                                    </div>
                                    {/* Divider */}
                                    <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:2,background:'rgba(6,8,18,1)',transform:'translateX(-50%)'}}/>
                                    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:24,height:24,borderRadius:'50%',background:'#060810',border:'1.5px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'rgba(255,255,255,0.5)',fontWeight:800,zIndex:2}}>→</div>
                                  </div>
                                  <div style={{padding:'9px 13px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                    <span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.75)'}}>{t.caption}</span>
                                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontWeight:600}}>{t.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Weekly Schedule Snapshot */}
                        {coach.weekly_schedule?.length>0&&(
                          <div>
                            <SectionHead>Weekly Availability</SectionHead>
                            <div style={{background:CARD_BG,border:CARD_BORDER,borderRadius:16,overflow:'hidden'}}>
                              {coach.weekly_schedule.map((d,i,arr)=>(
                                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 14px',borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.05)':'none',opacity:d.slots.length===0?0.35:1}}>
                                  <div style={{width:34,fontSize:10,fontWeight:800,color:d.slots.length?'rgba(255,255,255,0.55)':'rgba(255,255,255,0.2)',letterSpacing:'0.08em'}}>{d.day}</div>
                                  {d.slots.length>0?(
                                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                      {d.slots.map((s,j)=>(
                                        <span key={j} style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,background:'rgba(37,99,235,0.1)',border:'1px solid rgba(59,130,246,0.2)',color:'#60a5fa'}}>{s}</span>
                                      ))}
                                    </div>
                                  ):(
                                    <span style={{fontSize:11,color:'rgba(255,255,255,0.2)',fontWeight:600}}>Rest day</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Details */}
                        <div style={{background:CARD_BG,border:CARD_BORDER,borderRadius:16,overflow:'hidden'}}>
                          <div style={{padding:'12px 15px 10px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><SectionHead>Details</SectionHead></div>
                          <div style={{padding:'6px 15px 12px'}}>
                            {[
                              {I:Shield,    l:'Member since',    v:coach.member_since},
                              {I:MapPin,    l:'Location',        v:coach.location},
                              {I:Clock,     l:'Response time',   v:coach.response_time},
                              {I:Star,      l:'Avg rating',      v:`${avgRating} / 5.0`},
                              {I:Languages, l:'Languages',       v:(coach.languages||[]).join(', ')},
                              ...(coach.price_per_session?[{I:Tag,l:'Per session',v:`£${coach.price_per_session}`}]:[]),
                            ].map(({I,l,v},i,arr)=>(
                              <div key={l} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 0',borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
                                <div style={{width:30,height:30,borderRadius:9,background:'rgba(56,189,248,0.1)',border:'1px solid rgba(56,189,248,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                  <I style={{width:13,height:13,color:'#38bdf8'}}/>
                                </div>
                                <span style={{fontSize:12,color:'rgba(255,255,255,0.32)',fontWeight:600,flex:1}}>{l}</span>
                                <span style={{fontSize:13,color:'#fff',fontWeight:700,textAlign:'right'}}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Certifications */}
                        {(coach.certifications||[]).length>0&&(
                          <div>
                            <SectionHead>Certifications</SectionHead>
                            <div style={{background:CARD_BG,border:CARD_BORDER,borderRadius:16,overflow:'hidden'}}>
                              {coach.certifications.map((c,i,arr)=>{
                                const name=typeof c==='string'?c:c.name;
                                const sub=typeof c==='string'?null:`${c.org} · ${c.year}`;
                                return(
                                  <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                                    style={{display:'flex',alignItems:'center',gap:12,padding:'12px 15px',borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                                    <div style={{width:32,height:32,borderRadius:10,background:'rgba(56,189,248,0.1)',border:'1px solid rgba(56,189,248,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                      <Award style={{width:14,height:14,color:'#38bdf8'}}/>
                                    </div>
                                    <div style={{flex:1}}>
                                      <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.88)',lineHeight:1.3}}>{name}</div>
                                      {sub&&<div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:2}}>{sub}</div>}
                                    </div>
                                    <CheckCircle style={{width:14,height:14,color:'#34d399',flexShrink:0}}/>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Quick actions */}
                        <div>
                          <SectionHead>Quick Actions</SectionHead>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {[
                              {label:'Ask a Question',   sub:'Get a reply in < 1hr',   icon:MessageSquare, pre:`Hi ${coach.name?.split(' ')[0]}, I have a quick question about your coaching…`},
                              {label:'Request Custom Plan',sub:'Tailored to your goals', icon:Target,        pre:`Hi ${coach.name?.split(' ')[0]}, I'd love a custom training plan. My goals are…`},
                              {label:'Check Availability',sub:'See open slots',          icon:Calendar,      pre:`Hi ${coach.name?.split(' ')[0]}, when do you have availability this week?`},
                              {label:'Refer a Friend',   sub:'You both get 10% off',    icon:UserPlus,      act:()=>showToast('Referral link copied!')},
                            ].map((a,i)=>(
                              <button key={i} className="cpm-btn" onClick={()=>a.act?a.act():openMsg(a.pre)}
                                style={{padding:'13px',borderRadius:14,background:CARD_BG,border:CARD_BORDER,textAlign:'left',cursor:'pointer',display:'flex',flexDirection:'column',gap:5}}>
                                <a.icon style={{width:16,height:16,color:'#38bdf8'}}/>
                                <div style={{fontSize:12.5,fontWeight:800,color:'#fff',lineHeight:1.2}}>{a.label}</div>
                                <div style={{fontSize:10.5,color:'rgba(255,255,255,0.35)',fontWeight:500}}>{a.sub}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Booking policy */}
                        <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',background:'rgba(251,191,36,0.05)',border:'1px solid rgba(251,191,36,0.15)',borderRadius:14}}>
                          <AlertCircle style={{width:14,height:14,color:'#fbbf24',flexShrink:0,marginTop:1}}/>
                          <div>
                            <div style={{fontSize:11,fontWeight:800,color:'#fbbf24',marginBottom:3}}>Booking Policy</div>
                            <div style={{fontSize:11.5,color:'rgba(255,255,255,0.42)',lineHeight:1.55}}>Cancel up to 4 hours before your session for a full refund. Late cancellations may incur a fee.</div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ══ CLASSES ══════════════════════════════════ */}
                    {tab==='classes'&&(
                      <ClassesTab coach={coach} bookedClasses={bookedClasses} onClassSelect={onClassSelect} showToast={showToast}/>
                    )}

                    {/* ══ REVIEWS ══════════════════════════════════ */}
                    {tab==='reviews'&&(
                      <motion.div key="reviews" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.22}}
                        style={{display:'flex',flexDirection:'column',gap:16}}>
                        <div style={{background:CARD_BG,border:CARD_BORDER,borderRadius:16,padding:'16px'}}>
                          <div style={{display:'flex',gap:16,alignItems:'center'}}>
                            <div style={{textAlign:'center',flexShrink:0}}>
                              <div style={{fontSize:44,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1}}>{avgRating}</div>
                              <div style={{display:'flex',gap:2,justifyContent:'center',marginTop:5}}>
                                {[1,2,3,4,5].map(s=><Star key={s} style={{width:12,height:12,fill:s<=Math.round(avgRating)?'#fbbf24':'rgba(255,255,255,0.12)',color:s<=Math.round(avgRating)?'#fbbf24':'rgba(255,255,255,0.12)'}}/>)}
                              </div>
                              <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:5,fontWeight:600}}>{coach.review_count} reviews</div>
                            </div>
                            <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
                              {ratCounts.map(({s,n,p})=>(
                                <div key={s} style={{display:'flex',alignItems:'center',gap:7}}>
                                  <span style={{fontSize:10,color:'rgba(255,255,255,0.32)',fontWeight:700,width:8,flexShrink:0}}>{s}</span>
                                  <Star style={{width:9,height:9,fill:'#fbbf24',color:'#fbbf24',flexShrink:0}}/>
                                  <div style={{flex:1,height:5,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                                    <div style={{height:'100%',width:`${p}%`,background:'#fbbf24',borderRadius:99,transition:'width 1s cubic-bezier(0.16,1,0.3,1)'}}/>
                                  </div>
                                  <span style={{fontSize:10,color:'rgba(255,255,255,0.22)',width:12,textAlign:'right',flexShrink:0}}>{n}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button className="cpm-btn" onClick={()=>showToast('Review form coming soon…')}
                          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px',borderRadius:14,fontSize:13,fontWeight:800,cursor:'pointer',border:'1px solid rgba(56,189,248,0.25)',background:'rgba(56,189,248,0.08)',color:'#38bdf8'}}>
                          <MessageSquare style={{width:14,height:14}}/>Write a Review
                        </button>
                        <div style={{display:'flex',flexDirection:'column',gap:10}}>
                          {(moreRev?reviews:reviews.slice(0,2)).map((r,i)=>(
                            <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                              style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'13px 14px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                                <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(56,189,248,0.44),rgba(56,189,248,0.22))',border:'1px solid rgba(56,189,248,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:'#38bdf8',flexShrink:0}}>{r.initials}</div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:12,fontWeight:700,color:'#fff'}}>{r.name}</div>
                                  <div style={{display:'flex',gap:2,marginTop:2}}>{[1,2,3,4,5].map(s=><Star key={s} style={{width:9,height:9,fill:s<=r.rating?'#fbbf24':'rgba(255,255,255,0.1)',color:s<=r.rating?'#fbbf24':'rgba(255,255,255,0.1)'}}/>)}</div>
                                </div>
                                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                                  <span style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontWeight:600}}>{r.date}</span>
                                  {r.tag&&<span style={{fontSize:9.5,fontWeight:700,padding:'2px 8px',borderRadius:99,background:'rgba(56,189,248,0.1)',border:'1px solid rgba(56,189,248,0.2)',color:'#38bdf8'}}>{r.tag}</span>}
                                </div>
                              </div>
                              <p style={{fontSize:12.5,color:'rgba(255,255,255,0.55)',lineHeight:1.62,margin:0}}>{r.text}</p>
                            </motion.div>
                          ))}
                        </div>
                        {reviews.length>2&&(
                          <button className="cpm-btn" onClick={()=>setMoreRev(s=>!s)}
                            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'11px',borderRadius:12,fontSize:12,fontWeight:700,cursor:'pointer',border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.38)'}}>
                            {moreRev?<><ChevronUp style={{width:14,height:14}}/>Show Less</>:<><ChevronDown style={{width:14,height:14}}/>Show All {reviews.length} Reviews</>}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div style={{height:8}}/>
                </div>
              </div>

              {/* ── FIXED FOOTER ────────────────────────────────── */}
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.18,type:'spring',stiffness:200,damping:28}}
                style={{flexShrink:0,padding:'10px 18px 28px',background:'linear-gradient(to top,#060810 55%,transparent)',borderTop:'1px solid rgba(255,255,255,0.05)'}}>

                {/* Session packages */}
                {(coach.packages||[]).length>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.28)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:8}}>Session Packages</div>
                    <div style={{display:'flex',gap:7}}>
                      {coach.packages.map((pkg,i)=>(
                        <motion.button key={i} className="cpm-btn cpm-pkg" onClick={()=>setSelPkg(i)}
                          animate={{scale:selPkg===i?1:0.97}}
                          style={{flex:1,padding:'10px 6px',borderRadius:14,border:`1.5px solid ${selPkg===i?'#2563eb':'rgba(255,255,255,0.09)'}`,background:selPkg===i?'rgba(37,99,235,0.15)':'rgba(255,255,255,0.03)',cursor:'pointer',position:'relative',textAlign:'center',transition:'border-color 0.2s,background 0.2s'}}>
                          {pkg.popular&&(
                            <div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',fontSize:8.5,fontWeight:900,color:'#fbbf24',background:'rgba(251,191,36,0.18)',border:'1px solid rgba(251,191,36,0.35)',borderRadius:99,padding:'2px 8px',whiteSpace:'nowrap',letterSpacing:'0.06em',textTransform:'uppercase'}}>Popular</div>
                          )}
                          <div style={{fontSize:13,fontWeight:900,color:selPkg===i?'#fff':'rgba(255,255,255,0.6)',lineHeight:1}}>{pkg.sessions}x</div>
                          <div style={{fontSize:15,fontWeight:900,color:selPkg===i?'#fff':'rgba(255,255,255,0.7)',letterSpacing:'-0.02em',margin:'3px 0 1px'}}>£{pkg.price}</div>
                          {pkg.discount&&<div style={{fontSize:9.5,fontWeight:800,color:selPkg===i?'#34d399':'rgba(52,211,153,0.6)'}}>{pkg.discount}</div>}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next slots preview */}
                {(coach.availability_slots||[]).length>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.28)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:8}}>Next Available Slots</div>
                    <div className="cpm-hscroll" style={{display:'flex',gap:7}}>
                      {(coach.availability_slots||[]).slice(0,5).map((sl,i)=>(
                        <button key={i} className="cpm-btn cpm-slot" onClick={()=>showToast(`Slot selected: ${sl.date} at ${sl.time}`)}
                          style={{flexShrink:0,padding:'8px 12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.03)',textAlign:'center',cursor:'pointer',transition:'all 0.15s',minWidth:70}}>
                          <div style={{fontSize:9.5,fontWeight:700,color:'rgba(255,255,255,0.4)',marginBottom:3}}>{sl.date}</div>
                          <div style={{fontSize:12.5,fontWeight:800,color:'#fff'}}>{sl.time}</div>
                          <div style={{fontSize:9,color:'rgba(52,211,153,0.8)',fontWeight:700,marginTop:2}}>{sl.spots} spots</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability line */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',animation:'cpm-pulse 2s ease-in-out infinite'}}/>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600}}>Responds in {coach.response_time}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:800,color:'rgba(255,255,255,0.5)'}}>
                    {selPkgObj?`£${selPkgObj.price} for ${selPkgObj.sessions} session${selPkgObj.sessions>1?'s':''}`:`£${coach.price_per_session}/session`}
                  </span>
                </div>

                {/* CTA row */}
                <div style={{display:'flex',gap:9}}>
                  {/* Message */}
                  <button className="cpm-btn" onClick={()=>openMsg('')}
                    style={{width:52,height:52,borderRadius:16,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <MessageSquare style={{width:18,height:18,color:'rgba(255,255,255,0.5)'}}/>
                  </button>

                  {/* Free Consult (if available) */}
                  {coach.free_consultation&&(
                    <button className="cpm-btn" onClick={handleConsult}
                      style={{flex:1,height:52,borderRadius:16,fontSize:13,fontWeight:800,cursor:'pointer',border:'1px solid rgba(52,211,153,0.35)',background:consultAnim?'rgba(52,211,153,0.2)':'rgba(52,211,153,0.08)',color:'#34d399',display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:'all 0.2s',transform:consultAnim?'scale(0.96)':'scale(1)'}}>
                      <Calendar style={{width:15,height:15}}/>Free Consult
                    </button>
                  )}

                  {/* Book Now */}
                  <button className="cpm-btn" onClick={handleBook}
                    style={{flex:2,height:52,borderRadius:16,fontSize:15,fontWeight:900,cursor:'pointer',border:'none',letterSpacing:'-0.01em',position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#2563eb,#1d4ed8)',color:'#fff',boxShadow:'0 6px 28px rgba(37,99,235,0.5),inset 0 1px 0 rgba(255,255,255,0.2)',transform:bookAnim?'scale(0.96) translateY(2px)':'scale(1) translateY(0)',transition:'transform 0.18s cubic-bezier(0.34,1.5,0.64,1)'}}>
                    <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:'inherit'}}>
                      <div style={{position:'absolute',top:0,bottom:0,width:'40%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)',animation:'cpm-shimmer 4s cubic-bezier(0.4,0,0.6,1) infinite 2s'}}/>
                    </div>
                    <span style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
                      Book Now <ChevronRight style={{width:15,height:15}} strokeWidth={2.5}/>
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <MessageModal open={msgOpen} onClose={()=>setMsgOpen(false)} coach={coach} preText={msgPreText} showToast={showToast}/>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLASSES TAB — separated for clarity
═══════════════════════════════════════════════════════════ */
const DIFF_FILTERS = ['All','All Levels','Intermediate','Advanced'];
const TIME_FILTERS = ['All','Morning','Afternoon','Evening'];

function IntensityMeter({value}){
  const segments=10;
  const getColor=(i)=>{
    if(i>=value) return 'rgba(255,255,255,0.07)';
    if(value<=3)  return '#34d399';
    if(value<=6)  return '#fbbf24';
    if(value<=8)  return '#fb923c';
    return '#f87171';
  };
  return(
    <div style={{display:'flex',gap:2.5,alignItems:'center'}}>
      {Array.from({length:segments},(_,i)=>(
        <div key={i} style={{width:14,height:5,borderRadius:2,background:getColor(i),transition:'background 0.3s'}}/>
      ))}
      <span style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.35)',marginLeft:4}}>{value}/10</span>
    </div>
  );
}

function ClassesTab({coach,bookedClasses,onClassSelect,showToast}){
  const [diffFilter,setDiffFilter]=useState('All');
  const [timeFilter,setTimeFilter]=useState('All');
  const [typeFilter,setTypeFilter]=useState('All');
  const [showFilters,setShowFilters]=useState(false);

  const classes=coach.classes||[];
  const classTypes=['All',...new Set(classes.map(c=>CFG[classType(c.name)].label))];

  const filtered=classes.filter(cls=>{
    if(diffFilter!=='All'){
      const map={'All Levels':'all_levels','Intermediate':'intermediate','Advanced':'advanced'};
      if(cls.difficulty!==map[diffFilter]) return false;
    }
    if(timeFilter!=='All'){
      const h=parseInt((cls.schedule||'').split(':')[0]||'0');
      if(timeFilter==='Morning'&&(h<5||h>=12))    return false;
      if(timeFilter==='Afternoon'&&(h<12||h>=17)) return false;
      if(timeFilter==='Evening'&&h<17)             return false;
    }
    if(typeFilter!=='All'&&CFG[classType(cls.name)].label!==typeFilter) return false;
    return true;
  });

  return(
    <motion.div key="classes" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.22}}
      style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Filter bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:10.5,fontWeight:800,color:'rgba(255,255,255,0.28)',letterSpacing:'0.14em',textTransform:'uppercase'}}>{filtered.length} Classes</div>
        <button className="cpm-btn" onClick={()=>setShowFilters(s=>!s)}
          style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:99,fontSize:11,fontWeight:800,border:`1px solid ${showFilters?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.1)'}`,background:showFilters?'rgba(37,99,235,0.1)':'rgba(255,255,255,0.04)',color:showFilters?'#60a5fa':'rgba(255,255,255,0.45)'}}>
          <Filter style={{width:11,height:11}}/> Filters {(diffFilter!=='All'||timeFilter!=='All'||typeFilter!=='All')&&'•'}
        </button>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
            <div style={{display:'flex',flexDirection:'column',gap:10,paddingBottom:4}}>
              {[
                {label:'Difficulty', opts:DIFF_FILTERS,  val:diffFilter, set:setDiffFilter},
                {label:'Time',       opts:TIME_FILTERS,  val:timeFilter, set:setTimeFilter},
                {label:'Type',       opts:classTypes,    val:typeFilter, set:setTypeFilter},
              ].map(f=>(
                <div key={f.label}>
                  <div style={{fontSize:9.5,fontWeight:800,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{f.label}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {f.opts.map(o=>(
                      <button key={o} className="cpm-btn" onClick={()=>f.set(o)}
                        style={{padding:'5px 12px',borderRadius:99,fontSize:11,fontWeight:700,border:`1px solid ${f.val===o?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.09)'}`,background:f.val===o?'rgba(37,99,235,0.15)':'rgba(255,255,255,0.03)',color:f.val===o?'#60a5fa':'rgba(255,255,255,0.45)'}}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class list */}
      {filtered.length===0&&(
        <div style={{textAlign:'center',padding:'28px 0',color:'rgba(255,255,255,0.25)',fontSize:13}}>No classes match these filters.</div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.map((cls,i)=>{
          const tk=classType(cls.name);
          const cc=CFG[tk];
          const cap=cls.capacity||0;
          const enr=cls.enrolled||0;
          const left=cap-enr;
          const pct=cap?Math.min(100,Math.round(enr/cap*100)):0;
          const full=left<=0;
          const hot=left>0&&left<=3;
          const isBooked=bookedClasses.includes(cls.id);
          const barColor=full?'linear-gradient(90deg,#dc2626,#f87171)':pct>65?'linear-gradient(90deg,#d97706,#fbbf24)':`linear-gradient(90deg,${cc.color}88,${cc.color})`;

          return(
            <motion.div key={cls.id||i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
              onClick={()=>onClassSelect&&onClassSelect({...cls,instructor:coach.name,coach_name:coach.name})}
              style={{background:CARD_BG,border:isBooked?'1px solid rgba(52,211,153,0.35)':CARD_BORDER,borderRadius:16,overflow:'hidden',cursor:onClassSelect?'pointer':'default',position:'relative',transition:'border-color 0.2s'}}>

              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${cc.color}88,transparent)`}}/>

              <div style={{padding:'14px 15px 12px',display:'flex',gap:13,alignItems:'flex-start'}}>
                {/* Icon */}
                <div style={{width:44,height:44,borderRadius:14,background:cc.bg,border:`1px solid ${cc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,boxShadow:`0 0 14px ${cc.glow}`}}>
                  {cc.emoji}
                </div>

                <div style={{flex:1,minWidth:0}}>
                  {/* Name + badges */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                      <span style={{fontSize:14,fontWeight:800,color:'#fff'}}>{cls.name}</span>
                      {isBooked&&<span style={{fontSize:9,fontWeight:900,padding:'2px 7px',borderRadius:99,background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399',textTransform:'uppercase'}}>✓ Booked</span>}
                      {hot&&!full&&!isBooked&&<span style={{fontSize:9,fontWeight:900,padding:'2px 7px',borderRadius:99,background:'rgba(251,191,36,0.12)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',textTransform:'uppercase'}}>🔥 {left} left</span>}
                      {full&&!isBooked&&<span style={{fontSize:9,fontWeight:900,padding:'2px 7px',borderRadius:99,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',color:'#f87171',textTransform:'uppercase'}}>Full</span>}
                    </div>
                    {onClassSelect&&<ChevronRight style={{width:15,height:15,color:'rgba(255,255,255,0.25)',flexShrink:0}}/>}
                  </div>

                  {/* Meta */}
                  <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:8}}>
                    {[{I:Clock,v:cls.schedule},{I:Calendar,v:cls.days},{I:Zap,v:`${cls.duration_minutes}min`},{I:MapPin,v:cls.location}].filter(x=>x.v).map(({I,v},j)=>(
                      <div key={j} style={{display:'flex',alignItems:'center',gap:4}}>
                        <I style={{width:10,height:10,color:'rgba(255,255,255,0.3)'}}/>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.42)',fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Intensity meter */}
                  {cls.intensity&&(
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:9.5,fontWeight:700,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5}}>Intensity</div>
                      <IntensityMeter value={cls.intensity}/>
                    </div>
                  )}

                  {/* Best For tags */}
                  {cls.best_for?.length>0&&(
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
                      {cls.best_for.map((tag,j)=>(
                        <span key={j} style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:99,background:cc.bg,border:`1px solid ${cc.border}`,color:cc.color}}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Capacity bar */}
                  {cap>0&&(
                    <div>
                      <Bar pct={pct} color={barColor} h={4}/>
                      <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                        <span style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontWeight:600}}>{enr}/{cap} enrolled</span>
                        <span style={{fontSize:10,fontWeight:700,color:full?'#f87171':pct>65?'#fbbf24':cc.color}}>{full?'Class full':`${left} spot${left===1?'':'s'} left`}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}