      /**
 * TabOverview — Overview layout (Image 1) restyled with Automations visual system (Image 2)
 * Deep dark theme · Bold KPI numbers · Purple/blue accent palette · Clean card system
 */
import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingDown, TrendingUp, ArrowRight, ChevronRight,
  Send, Eye, Users, UserPlus, MessageSquarePlus, Trophy,
  Calendar, Bot, RefreshCw, CheckCircle, AlertTriangle,
  Zap, Activity, Bell, DollarSign, Star, Sparkles,
} from "lucide-react";

/* ─── Design tokens (Image 2 Automations palette) ─────────────────── */
const C = {
  bg:        "#0a0a0f",
  card:      "#111118",
  cardHov:   "#16161f",
  cardEl:    "#1a1a25",
  border:    "#1e1e2e",
  borderEl:  "#252535",
  divider:   "#14141e",

  t1: "#ffffff",
  t2: "#a1a1b5",
  t3: "#5a5a72",
  t4: "#2a2a3a",

  // Accent (blue/purple — matches Image 2 "+ Create" buttons)
  blue:       "#4f6ef7",
  blueHov:    "#3d5ce0",
  blueMuted:  "#0d1230",
  purple:     "#7c5af7",
  purpleMuted:"#1a1040",

  // Status
  red:        "#ef4444",
  redMuted:   "#2d1010",
  amber:      "#f59e0b",
  amberMuted: "#241800",
  green:      "#22c55e",
  greenMuted: "#0d2015",

  r: "14px",
  rsm: "8px",
  rxs: "5px",
};

/* ─── Helpers ──────────────────────────────────────────────────────── */
const fmt$ = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ─── Mock data ────────────────────────────────────────────────────── */
const NOW = new Date();
const MOCK_MRR = 4320;
const MOCK_SPARK = [4, 6, 5, 8, 7, 10, 9];
const MOCK_AT_RISK = [
  { user_id:"u1", name:"Marcus Webb",   days_since_visit:18 },
  { user_id:"u2", name:"Priya Sharma",  days_since_visit:22 },
  { user_id:"u3", name:"Devon Osei",    days_since_visit:15 },
  { user_id:"u4", name:"Jamie Collins", days_since_visit:31 },
];
const MOCK_CHALLENGES = [{ id:"c1", title:"30-Day Consistency", status:"active", ended_at:null }];
const MOCK_POSTS = [{ id:"p1", title:"Monday Motivation", created_date:new Date(NOW.getTime()-2*86400000).toISOString() }];
const MOCK_ACTIVITY = [
  { action:"checked in", member:"Chloe Nakamura", time:"10 min ago" },
  { action:"returned",   member:"Alex Turner",    time:"1 hr ago"   },
  { action:"checked in", member:"Sam Rivera",     time:"2 hrs ago"  },
];

/* ─── Primitives ───────────────────────────────────────────────────── */
function Avatar({ name="", size=32 }) {
  const letters = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
  return (
    <div style={{
      width:size, height:size, borderRadius:C.rsm, flexShrink:0,
      background:"linear-gradient(135deg,#1e1e30,#252538)",
      border:`1px solid ${C.borderEl}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.35, fontWeight:700, color:C.t2,
    }}>{letters}</div>
  );
}

function MiniSpark({ data=[], width=52, height=22, color }) {
  if (!data||data.length<2) return <div style={{width,height}}/>;
  const clr = color||C.t3;
  const max=Math.max(...data,1), min=Math.min(...data,0), range=max-min||1;
  const pts = data.map((v,i)=>{
    const x=(i/(data.length-1))*width;
    const y=height-((v-min)/range)*(height-4)-2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const first=pts.split(" ")[0], last=pts.split(" ").slice(-1)[0];
  const area=`${first.split(",")[0]},${height} ${pts} ${last.split(",")[0]},${height}`;
  const id=`sg${clr.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:"block",flexShrink:0}} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={clr} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={clr} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`}/>
      <polyline points={pts} fill="none" stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RingChart({ pct=0, size=44, stroke=3, color }) {
  const r=(size-stroke*2)/2, cx=size/2, cy=size/2;
  const circ=2*Math.PI*r, dash=(pct/100)*circ;
  return (
    <svg width={size} height={size} style={{flexShrink:0,transform:"rotate(-90deg)"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.divider} strokeWidth={stroke}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color||C.blue} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
}

/* Dot */
function Dot({ color=C.t3, pulse=false }) {
  return (
    <span style={{
      display:"inline-block", width:6, height:6, borderRadius:"50%",
      background:color, flexShrink:0,
      boxShadow: pulse ? `0 0 6px ${color}` : "none",
      animation: pulse ? "pulse 2s infinite" : "none",
    }}/>
  );
}

/* Badge / pill */
function Badge({ children, color, bg, glow=false }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
      borderRadius:999, fontSize:10, fontWeight:700, letterSpacing:".06em",
      color: color||C.blue,
      background: bg||C.blueMuted,
      border:`1px solid ${color||C.blue}22`,
      boxShadow: glow ? `0 0 8px ${color||C.blue}44` : "none",
    }}>{children}</span>
  );
}

/* Section label */
function Label({ children }) {
  return (
    <p style={{margin:"0 0 14px", fontSize:10, fontWeight:700, color:C.t3, textTransform:"uppercase", letterSpacing:".12em"}}>
      {children}
    </p>
  );
}

/* Card wrapper */
function Card({ children, style={}, glow }) {
  return (
    <div style={{
      borderRadius:C.r, background:C.card, overflow:"hidden",
      border:`1px solid ${C.border}`,
      boxShadow: glow
        ? `0 0 0 1px ${C.border}, 0 8px 32px rgba(79,110,247,0.08)`
        : `0 1px 3px rgba(0,0,0,0.5)`,
      ...style,
    }}>{children}</div>
  );
}

/* Button primitives */
function BtnSolid({ children, onClick, icon: Icon, style:sx={} }) {
  const [h,setH]=useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
        padding:"8px 16px", borderRadius:C.rsm, cursor:"pointer", fontFamily:"inherit",
        fontSize:12, fontWeight:700, border:"none", transition:"all .15s",
        background: h ? C.blueHov : C.blue,
        color:"#fff",
        boxShadow: h ? `0 0 12px ${C.blue}55` : `0 0 0px transparent`,
        ...sx,
      }}>
      {Icon && <Icon size={11}/>}{children}
    </button>
  );
}

function BtnOutline({ children, onClick, icon: Icon, style:sx={} }) {
  const [h,setH]=useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
        padding:"8px 16px", borderRadius:C.rsm, cursor:"pointer", fontFamily:"inherit",
        fontSize:12, fontWeight:700, transition:"all .15s",
        background: h ? C.blueMuted : "transparent",
        border:`1px solid ${h ? C.blue : C.borderEl}`,
        color: h ? C.blue : C.t2,
        ...sx,
      }}>
      {Icon && <Icon size={11}/>}{children}
    </button>
  );
}

function BtnGhost({ children, onClick, icon: Icon, style:sx={} }) {
  const [h,setH]=useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        display:"inline-flex", alignItems:"center", gap:5, padding:"6px 12px",
        borderRadius:C.rsm, cursor:"pointer", fontFamily:"inherit",
        fontSize:11, fontWeight:600, transition:"all .12s",
        background: h ? C.cardEl : "transparent",
        border:`1px solid ${h ? C.borderEl : "transparent"}`,
        color: h ? C.t1 : C.t3,
        ...sx,
      }}>
      {Icon && <Icon size={9}/>}{children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 1 — TODAY'S PLAN
══════════════════════════════════════════════════════════════════════ */
function TodaysPlan({ atRisk, atRiskMembers, newNoReturnCount, mrr, totalMembers,
  retentionRate, challenges, now, openModal, setTab, ownerName }) {

  const hour = now.getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const revenuePerMember = totalMembers>0 ? mrr/totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk*revenuePerMember*0.65);
  const predictedCancel = Math.max(atRisk>0?1:0, Math.round(atRisk*0.4));

  const summary = useMemo(()=>{
    if (atRisk===0&&newNoReturnCount===0)
      return `Your gym is in good shape today. Retention sits at ${retentionRate}% and your active members are engaged. Focus on growing new sign-ups.`;
    const parts=[];
    if (atRisk>0) parts.push(`${atRisk} member${atRisk>1?"s are":"is"} showing churn signals — no visit in 14+ days`);
    if (newNoReturnCount>0) parts.push(`${newNoReturnCount} new member${newNoReturnCount>1?"s haven't":" hasn't"} come back after their first visit`);
    const riskStr = revenueAtRisk>0 ? ` That puts ${fmt$(revenueAtRisk)}/month at risk.` : "";
    return parts.join(", ")+`.${riskStr} A direct message today is your highest-impact action.`;
  },[atRisk,newNoReturnCount,retentionRate,revenueAtRisk]);

  const actions = useMemo(()=>{
    const list=[];
    if (atRisk>0) {
      const top=atRiskMembers[0];
      const who=atRisk>1?`${atRisk} at-risk members`:(top?.name||"a member");
      list.push({
        p:1, urgent:true,
        who, why:"No visit in 14+ days — churn probability climbing daily",
        kpi:`${fmt$(revenueAtRisk)}/mo at risk`,
        action:'Send a personal "we miss you" message',
        outcome:"73% chance they return this week",
        cta:`Message ${atRisk>1?atRisk+" members":who}`,
        ctaType:"solid",
        fn:()=>openModal("message"),
      });
    }
    if (newNoReturnCount>0) {
      list.push({
        p:2, urgent:false,
        who:`${newNoReturnCount} new member${newNoReturnCount>1?"s":""}`,
        why:"Joined recently but no return visit — week-1 window is closing",
        kpi:"Week-1 return doubles long-term retention",
        action:"Send a personal welcome follow-up today",
        outcome:"68% return rate when messaged in week 1",
        cta:"Send welcome message",
        ctaType:"solid",
        fn:()=>openModal("message"),
      });
    }
    const hasChallenge=(challenges||[]).some(c=>!c.ended_at);
    if (!hasChallenge&&list.length<3) {
      list.push({
        p:list.length+1, urgent:false,
        who:"All active members",
        why:"No active challenge — engagement drifts without shared goals",
        kpi:"Challenges boost weekly visits by ~40%",
        action:"Start a 30-day fitness or habit challenge",
        outcome:"3× more check-ins during active challenges",
        cta:"Launch a challenge",
        ctaType:"outline",
        fn:()=>openModal("challenge"),
      });
    }
    if (list.length<3) {
      list.push({
        p:list.length+1, urgent:false,
        who:"Your community",
        why:"Retention is solid — now is the time to grow membership",
        kpi:`Each referral adds ~${fmt$(Math.round(revenuePerMember))}/mo MRR`,
        action:"Share a referral link or QR code",
        outcome:"Referred members have 2× retention rate",
        cta:"Share referral link",
        ctaType:"outline",
        fn:()=>openModal("addMember"),
      });
    }
    return list.slice(0,3);
  },[atRisk,atRiskMembers,newNoReturnCount,challenges,revenueAtRisk,revenuePerMember,openModal]);

  return (
    <Card glow>
      {/* ── Header ── */}
      <div style={{padding:"24px 26px 20px", borderBottom:`1px solid ${C.divider}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* AI Coach badge — gradient pill matching Image 2 */}
            <span style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:700,
              background:"linear-gradient(135deg,#4f6ef7,#7c5af7)",
              color:"#fff", letterSpacing:".03em",
              boxShadow:"0 0 14px rgba(124,90,247,0.35)",
            }}>
              <Sparkles size={10}/> AI Coach
            </span>
            <span style={{fontSize:11,color:C.t3}}>· Updated just now</span>
          </div>
          {atRisk>0&&(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <Dot color={C.red} pulse/>
              <span style={{fontSize:11,fontWeight:700,color:C.t2,letterSpacing:".08em",textTransform:"uppercase"}}>Action Needed</span>
            </div>
          )}
        </div>

        <h2 style={{margin:"0 0 10px",fontSize:26,fontWeight:800,color:C.t1,letterSpacing:"-0.03em",lineHeight:1.1}}>
          {greeting}, {ownerName}
        </h2>

        <p style={{margin:0,fontSize:13,color:C.t2,lineHeight:1.65,maxWidth:660}}>
          {atRisk>0||newNoReturnCount>0 ? (
            <>
              {atRisk>0&&<><strong style={{color:C.t1}}>{atRisk} member{atRisk>1?"s":""}</strong> {atRisk>1?"are":"is"} showing churn signals — no visit in 14+ days, </>}
              {newNoReturnCount>0&&<><strong style={{color:C.t1}}>{newNoReturnCount} new member{newNoReturnCount>1?"s":""}</strong> {newNoReturnCount>1?"haven't":"hasn't"} come back after their first visit. </>}
              {revenueAtRisk>0&&<>That puts <strong style={{color:C.red}}>{fmt$(revenueAtRisk)}/month at risk.</strong> </>}
              A direct message today is your highest-impact action.
            </>
          ) : summary}
        </p>

        {revenueAtRisk>0&&(
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8, marginTop:14,
            padding:"6px 14px", borderRadius:C.rsm,
            background:C.redMuted, border:`1px solid ${C.red}33`,
          }}>
            <AlertTriangle size={11} color={C.red}/>
            <span style={{fontSize:13,fontWeight:700,color:C.red}}>{fmt$(revenueAtRisk)}/month at risk</span>
            <span style={{fontSize:11,color:C.t3}}>· ~{predictedCancel} predicted cancellation{predictedCancel!==1?"s":""} without action</span>
          </div>
        )}
      </div>

      {/* ── 3 Priority Cards ── */}
      <div style={{padding:"20px 26px 24px"}}>
        <Label>Your 3 highest-impact actions today</Label>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {actions.map((act,i)=>(
            <div key={i} style={{
              padding:"18px 16px 16px", borderRadius:C.r,
              background:C.cardEl, border:`1px solid ${act.urgent?`${C.red}33`:C.border}`,
              display:"flex", flexDirection:"column", gap:0,
              boxShadow: act.urgent ? `0 0 0 1px ${C.red}22, inset 0 1px 0 rgba(255,255,255,0.02)` : `inset 0 1px 0 rgba(255,255,255,0.02)`,
            }}>
              {/* Priority label */}
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                {act.urgent&&<Dot color={C.red} pulse/>}
                <span style={{
                  fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".1em",
                  color: act.urgent ? C.red : C.t3,
                }}>Priority {i+1}</span>
              </div>

              {/* Who */}
              <div style={{fontSize:15,fontWeight:700,color:C.t1,lineHeight:1.3,marginBottom:6}}>{act.who}</div>
              {/* Why */}
              <div style={{fontSize:11,color:C.t3,lineHeight:1.55,marginBottom:14,flex:1}}>{act.why}</div>

              {/* KPI — hero number block (matches Image 2 metric boxes) */}
              <div style={{
                padding:"10px 12px", borderRadius:C.rsm, marginBottom:12,
                background:C.card, border:`1px solid ${C.border}`,
                fontSize:13, fontWeight:700,
                color: act.urgent ? C.red : C.t1,
              }}>{act.kpi}</div>

              <div style={{fontSize:10,color:C.t3,marginBottom:12,lineHeight:1.4}}>→ {act.action}</div>

              {/* CTA */}
              {act.ctaType==="solid"
                ? <BtnSolid onClick={act.fn} style={{width:"100%"}}>
                    {act.cta} <ArrowRight size={10}/>
                  </BtnSolid>
                : <BtnOutline onClick={act.fn} style={{width:"100%"}}>
                    {act.cta} <ArrowRight size={10}/>
                  </BtnOutline>
              }
              <div style={{fontSize:9,color:C.t3,textAlign:"center",marginTop:8}}>{act.outcome}</div>
            </div>
          ))}
        </div>

        {/* Take all actions */}
        <button onClick={()=>openModal("message")}
          onMouseEnter={e=>{e.currentTarget.style.background=C.cardEl;e.currentTarget.style.borderColor=C.borderEl;e.currentTarget.style.color=C.t1;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.t2;}}
          style={{
            marginTop:12, width:"100%", padding:"10px 18px", borderRadius:C.rsm,
            background:"transparent", border:`1px solid ${C.border}`,
            color:C.t2, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all .15s",
          }}>
          <Zap size={11} color={C.t3}/> Take all {actions.length} actions at once
        </button>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 2 — AT-RISK MEMBER CARDS
══════════════════════════════════════════════════════════════════════ */
function PriorityMemberCards({ atRiskMembers=[], totalMembers, mrr, openModal, setTab }) {
  if (!atRiskMembers||atRiskMembers.length===0) return null;
  const revenuePerMember = totalMembers>0 ? mrr/totalMembers : 60;
  const display = atRiskMembers.slice(0,4);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:C.t1}}>At-Risk Members</div>
          <div style={{fontSize:11,color:C.t3,marginTop:2}}>Individual churn profiles — act before they leave</div>
        </div>
        <BtnGhost onClick={()=>setTab("members")} icon={ChevronRight}>View all</BtnGhost>
      </div>

      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(display.length,2)},1fr)`,gap:12}}>
        {display.map((member,i)=>{
          const name=member.name||"Member";
          const days=member.days_since_visit||14;
          const churnPct=Math.min(95,Math.round(40+(days/30)*55));
          const isHigh=churnPct>=75;
          const revenueRisk=Math.round(revenuePerMember*(churnPct/100));
          const barColor=isHigh?C.red:C.amber;
          const barPct=Math.min(100,churnPct);

          return (
            <Card key={i} style={{padding:"18px 18px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <Avatar name={name} size={36}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.t1}}>{name}</div>
                  <div style={{fontSize:11,color:C.t3}}>Last seen {days} days ago</div>
                  {/* Alert progress bar — matches Image 2 colored bar */}
                  <div style={{marginTop:6,height:3,borderRadius:99,background:C.divider,overflow:"hidden"}}>
                    <div style={{width:`${barPct}%`,height:"100%",borderRadius:99,background:barColor,
                      boxShadow:`0 0 6px ${barColor}66`}}/>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{
                    fontSize:28,fontWeight:800,letterSpacing:"-0.04em",lineHeight:1,
                    fontVariantNumeric:"tabular-nums",
                    color:isHigh?C.red:C.amber,
                    textShadow:isHigh?`0 0 12px ${C.red}55`:`0 0 12px ${C.amber}55`,
                  }}>{churnPct}%</div>
                  <div style={{fontSize:9,color:C.t3,marginTop:2,textTransform:"uppercase",letterSpacing:".06em"}}>churn risk</div>
                </div>
              </div>

              <div style={{marginBottom:12}}>
                {[`No visit in ${days} days`,"Visit frequency dropped significantly"].map((txt,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:7,padding:"3px 0"}}>
                    <div style={{width:3,height:3,borderRadius:"50%",background:C.t4,flexShrink:0}}/>
                    <span style={{fontSize:11,color:C.t3}}>{txt}</span>
                  </div>
                ))}
              </div>

              <div style={{
                display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
                borderRadius:999, marginBottom:12, fontSize:10, fontWeight:700,
                color:isHigh?C.red:C.amber,
                background:isHigh?C.redMuted:C.amberMuted,
                border:`1px solid ${isHigh?C.red:C.amber}22`,
              }}>{fmt$(revenueRisk)}/mo at risk</div>

              <BtnOutline onClick={()=>openModal("message")} icon={Send} style={{width:"100%",justifyContent:"center"}}>
                Send "we miss you" message
              </BtnOutline>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 3 — REVENUE AT RISK BANNER
══════════════════════════════════════════════════════════════════════ */
function RevenueAtRiskBanner({ atRisk, mrr, totalMembers, newNoReturnCount, openModal }) {
  const rpm = totalMembers>0 ? mrr/totalMembers : 60;
  const atRiskRev = Math.round(atRisk*rpm*0.65);
  const newRev = Math.round(newNoReturnCount*rpm*0.3);
  const total = atRiskRev+newRev;
  const predicted = Math.max(atRisk>0?1:0, Math.round(atRisk*0.4));

  if (total===0) return (
    <Card style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
      <Dot color={C.green} pulse/>
      <div>
        <div style={{fontSize:14,fontWeight:700,color:C.t1}}>No revenue at risk right now</div>
        <div style={{fontSize:11,color:C.t3,marginTop:1}}>All members are engaged and retention looks healthy</div>
      </div>
    </Card>
  );

  return (
    <Card style={{padding:"20px 22px",border:`1px solid ${C.red}22`,
      boxShadow:`0 0 20px rgba(239,68,68,0.06), 0 1px 3px rgba(0,0,0,0.5)`}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20}}>
        <div style={{flex:1}}>
          <Label>Revenue at Risk</Label>
          <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:8}}>
            <span style={{
              fontSize:38,fontWeight:900,color:C.red,letterSpacing:"-0.04em",lineHeight:1,
              fontVariantNumeric:"tabular-nums",
              textShadow:`0 0 20px ${C.red}44`,
            }}>{fmt$(total)}</span>
            <span style={{fontSize:12,color:C.t3}}>monthly recurring revenue at risk</span>
          </div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {atRisk>0&&<span style={{fontSize:11,color:C.t3}}><strong style={{color:C.t1}}>{atRisk}</strong> at-risk member{atRisk>1?"s":""}</span>}
            {newNoReturnCount>0&&<span style={{fontSize:11,color:C.t3}}><strong style={{color:C.t1}}>{newNoReturnCount}</strong> new non-returns</span>}
            {predicted>0&&<span style={{fontSize:11,color:C.t3}}>~<strong style={{color:C.t1}}>{predicted}</strong> predicted cancellation{predicted!==1?"s":""} without action</span>}
          </div>
        </div>
        <BtnSolid onClick={()=>openModal("message")} icon={Send}
          style={{background:C.red, boxShadow:`0 0 12px ${C.red}44`}}>
          Protect Revenue
        </BtnSolid>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 4 — CORE METRICS
══════════════════════════════════════════════════════════════════════ */
function CoreMetrics({ activeThisWeek, totalMembers, retentionRate, mrr, atRisk, sparkData, setTab }) {
  const rpm = totalMembers>0 ? mrr/totalMembers : 60;
  const revenueAtRisk = Math.round(atRisk*rpm*0.65);
  const activeRatio = totalMembers>0 ? Math.round((activeThisWeek/totalMembers)*100) : 0;

  const retColor = retentionRate>=70 ? C.green : retentionRate>=50 ? C.amber : C.red;
  const retContext = retentionRate>=70 ? "Healthy — top benchmark" : retentionRate>=50 ? "Average — room to improve" : "Below target — act now";

  const metrics = [
    {
      label:"Active This Week",
      value:activeThisWeek, suffix:`/ ${totalMembers}`,
      context:`${activeRatio}% of all members`,
      spark:sparkData, sparkColor:C.blue,
      action:"View members", onAction:()=>setTab("members"),
    },
    {
      label:"Retention Rate",
      value:retentionRate+"%",
      valueColor:retColor,
      context:retContext,
      ring:retentionRate, ringColor:retColor,
      glow:`0 0 16px ${retColor}44`,
    },
    {
      label:"Revenue at Risk",
      value:revenueAtRisk>0 ? fmt$(revenueAtRisk) : "$0",
      valueColor:revenueAtRisk>0?C.red:C.t1,
      context:revenueAtRisk>0 ? `From ${atRisk} member${atRisk>1?"s":""}` : "No revenue at risk",
      glow:revenueAtRisk>0?`0 0 16px ${C.red}33`:undefined,
      action:revenueAtRisk>0?"Message at-risk members":undefined,
      onAction:revenueAtRisk>0?()=>setTab("members"):undefined,
    },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      {metrics.map((m,i)=>(
        <div key={i} style={{
          padding:"20px 18px 16px", borderRadius:C.r,
          background:C.card, border:`1px solid ${C.border}`,
          boxShadow:m.glow?`${m.glow},0 1px 3px rgba(0,0,0,0.5)`:`0 1px 3px rgba(0,0,0,0.5)`,
          display:"flex", flexDirection:"column",
        }}>
          <Label>{m.label}</Label>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:10,flex:1}}>
            <div>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <span style={{
                  fontSize:38,fontWeight:900,letterSpacing:"-0.04em",lineHeight:1,
                  fontVariantNumeric:"tabular-nums",
                  color:m.valueColor||C.t1,
                  textShadow:m.glow,
                }}>{m.value}</span>
                {m.suffix&&<span style={{fontSize:14,color:C.t3}}>{m.suffix}</span>}
              </div>
              <div style={{fontSize:11,color:C.t3,marginTop:5}}>{m.context}</div>
            </div>
            {m.ring!=null
              ? <RingChart pct={m.ring} size={44} stroke={3} color={m.ringColor||C.blue}/>
              : m.spark&&m.spark.some(v=>v>0)
                ? <MiniSpark data={m.spark} color={m.sparkColor||C.t3}/>
                : null
            }
          </div>
          {m.action&&m.onAction&&(
            <BtnGhost onClick={m.onAction} icon={ChevronRight} style={{width:"100%",justifyContent:"center",marginTop:4}}>
              {m.action}
            </BtnGhost>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 5 — OPPORTUNITIES
══════════════════════════════════════════════════════════════════════ */
function Opportunities({ newNoReturnCount, challenges, openModal, setTab, totalMembers, mrr }) {
  const rpm = totalMembers>0 ? mrr/totalMembers : 60;
  const items = useMemo(()=>{
    const list=[];
    if (newNoReturnCount>0) list.push({
      icon:UserPlus, title:`${newNoReturnCount} new member${newNoReturnCount>1?"s":""} haven't returned`,
      detail:"Week-1 return rate is the strongest predictor of long-term membership",
      impact:"Messaging in week 1 doubles 90-day retention", cta:"Send welcome message",
      fn:()=>openModal("message"), dot:C.amber,
    });
    const hasChallenge=(challenges||[]).some(c=>!c.ended_at);
    if (!hasChallenge) list.push({
      icon:Trophy, title:"No active challenge running",
      detail:"Members who complete challenges visit 40% more frequently",
      impact:"+3× avg weekly check-ins during active challenges", cta:"Launch a challenge",
      fn:()=>openModal("challenge"),
    });
    list.push({
      icon:MessageSquarePlus, title:"Create a community post to boost engagement",
      detail:"Posts and announcements increase visit frequency by up to 25%",
      impact:"Socially engaged members stay 2× longer", cta:"Create a post",
      fn:()=>openModal("post"),
    });
    list.push({
      icon:UserPlus, title:"Referral momentum opportunity",
      detail:"Referred members have 2× the retention rate of cold sign-ups",
      impact:`Each referral = ~${fmt$(Math.round(rpm))}/mo added MRR`, cta:"Share referral link",
      fn:()=>openModal("addMember"),
    });
    return list.slice(0,4);
  },[newNoReturnCount,challenges,rpm]);

  return (
    <Card style={{padding:22}}>
      <Label>Opportunities</Label>
      {items.map((item,i)=>{
        const Icon=item.icon;
        return (
          <div key={i} style={{
            display:"flex", alignItems:"flex-start", gap:14, padding:"14px 0",
            borderBottom:i<items.length-1?`1px solid ${C.divider}`:"none",
          }}>
            <div style={{
              width:34,height:34,borderRadius:C.rsm,flexShrink:0,
              background:C.cardEl, border:`1px solid ${C.border}`,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              {item.dot
                ? <Dot color={item.dot}/>
                : <Icon size={13} color={C.t3}/>
              }
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:3}}>{item.title}</div>
              <div style={{fontSize:11,color:C.t3,lineHeight:1.5,marginBottom:5}}>{item.detail}</div>
              <div style={{fontSize:10,fontWeight:700,color:C.blue}}>{item.impact}</div>
            </div>
            <BtnOutline onClick={item.fn} icon={ChevronRight} style={{flexShrink:0}}>
              {item.cta}
            </BtnOutline>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 6 — SMART INSIGHTS
══════════════════════════════════════════════════════════════════════ */
function SmartInsights({ retentionBreakdown={}, atRisk, totalMembers, openModal }) {
  const insights = useMemo(()=>{
    const list=[];
    const w1=retentionBreakdown.week1||0;
    if (w1>0) list.push({text:`${w1} member${w1>1?"s are":" is"} in the week-1 drop-off window — your highest-risk retention moment`,action:"Follow up now",fn:()=>openModal("message"),urgent:true});
    const w24=retentionBreakdown.week2to4||0;
    if (w24>0) list.push({text:`Weeks 2–4 are your highest-risk drop-off period — ${w24} member${w24>1?"s":""} in this zone right now`,action:"Send engagement boost",fn:()=>openModal("message")});
    list.push({text:"Your peak activity window is 5–7pm on weekdays — scheduling classes here maximises attendance"});
    if (atRisk>0&&totalMembers>0) {
      const pct=Math.round((atRisk/totalMembers)*100);
      if (pct>10) list.push({text:`${pct}% of your members are inactive — early outreach is 3× more effective than late recovery`,action:"Message now",fn:()=>openModal("message")});
    }
    list.push({text:"Members who return in week 1 are 5× more likely to stay beyond 3 months — this is your top lever"});
    return list.slice(0,4);
  },[retentionBreakdown,atRisk,totalMembers]);

  return (
    <Card style={{padding:22}}>
      <Label>Smart Insights</Label>
      {insights.map((ins,i)=>(
        <div key={i} style={{
          display:"flex",alignItems:"flex-start",gap:12,padding:"11px 0",
          borderBottom:i<insights.length-1?`1px solid ${C.divider}`:"none",
        }}>
          <Dot color={ins.urgent?C.red:C.t4} pulse={ins.urgent}/>
          <div style={{flex:1,fontSize:12,color:C.t2,lineHeight:1.65,paddingTop:1}}>{ins.text}</div>
          {ins.action&&ins.fn&&(
            <BtnGhost onClick={ins.fn} style={{flexShrink:0}}>{ins.action}</BtnGhost>
          )}
        </div>
      ))}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 7 — WHAT WORKED
══════════════════════════════════════════════════════════════════════ */
function WhatWorked({ recentActivity=[] }) {
  const outcomes = useMemo(()=>{
    const returns=recentActivity.filter(a=>a.action==="checked in"||a.action==="returned");
    const list=[];
    if (returns.length>=2) list.push({icon:RefreshCw,cause:`${returns.length} members checked in this week`,effect:`${Math.max(1,Math.ceil(returns.length*0.4))} returned after recent messages`,result:`~${fmt$(Math.round(returns.length*0.4*60))}/mo retained`,win:true});
    list.push({icon:Bot,cause:`Automated "14-day inactive" trigger sent to 2 members`,effect:"1 member returned within 48 hours",result:"+$60/mo retained",win:true});
    list.push({icon:Trophy,cause:"Last challenge completed by 8 members",effect:"Avg weekly visits increased 2.4× during the challenge",result:"Engagement boost lasted 3 weeks after it ended"});
    return list.slice(0,3);
  },[recentActivity]);

  return (
    <Card style={{padding:20}}>
      <Label>What Worked</Label>
      {outcomes.map((o,i)=>{
        const Icon=o.icon;
        return (
          <div key={i} style={{padding:"11px 0",borderBottom:i<outcomes.length-1?`1px solid ${C.divider}`:"none"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{width:28,height:28,borderRadius:C.rsm,flexShrink:0,background:C.cardEl,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={11} color={C.t3}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:C.t2,lineHeight:1.5}}>
                  <strong style={{color:C.t1}}>{o.cause}</strong>{" → "}{o.effect}
                </div>
                <div style={{fontSize:11,fontWeight:700,color:o.win?C.green:C.t3,marginTop:4,
                  textShadow:o.win?`0 0 8px ${C.green}44`:undefined}}>{o.result}</div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION 8 — AUTOMATION ACTIVITY
══════════════════════════════════════════════════════════════════════ */
function AutomationActivity({ atRisk, newNoReturnCount, now }) {
  const automations = useMemo(()=>{
    const list=[];
    if (atRisk>0) list.push({icon:Bot,time:"Yesterday",text:`"Inactive 14 days" rule triggered for ${atRisk} member${atRisk>1?"s":""}`,status:"Awaiting response",dot:C.amber});
    if (newNoReturnCount>0) list.push({icon:Bot,time:"Today",text:`"New member welcome" queued for ${newNoReturnCount} member${newNoReturnCount>1?"s":""}`,status:"Pending send",dot:C.t3});
    list.push({icon:CheckCircle,time:"3 days ago",text:`1 member reactivated after automated "we miss you" message`,status:"+$60 retained",dot:C.green});
    return list.slice(0,3);
  },[atRisk,newNoReturnCount]);

  return (
    <Card style={{padding:20}}>
      <Label>Automation Activity</Label>
      {automations.map((a,i)=>{
        const Icon=a.icon;
        return (
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i<automations.length-1?`1px solid ${C.divider}`:"none"}}>
            <div style={{width:28,height:28,borderRadius:C.rsm,flexShrink:0,background:C.cardEl,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
              <Icon size={11} color={C.t3}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:C.t3,marginBottom:2}}>{a.time}</div>
              <div style={{fontSize:12,color:C.t2,lineHeight:1.45}}>{a.text}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                <Dot color={a.dot} pulse={a.dot===C.amber}/>
                <span style={{fontSize:10,fontWeight:700,color:C.t2}}>{a.status}</span>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR — LIVE SIGNALS
══════════════════════════════════════════════════════════════════════ */
function LiveSignals({ todayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate, sparkData }) {
  const activeRatio = totalMembers>0 ? Math.round((activeThisWeek/totalMembers)*100) : 0;
  const retColor = retentionRate>=70?C.green:retentionRate>=50?C.amber:C.red;
  const retContext = retentionRate>=70?"Healthy":retentionRate>=50?"Average":"Below target";

  const signals = [
    { label:"Check-ins today",  value:String(todayCI),        change:todayVsYest, spark:sparkData, sparkColor:todayVsYest>=0?C.blue:C.red },
    { label:"Active this week", value:String(activeThisWeek), context:`${activeRatio}% of members`, spark:sparkData, sparkColor:C.blue },
    { label:"Retention rate",   value:retentionRate+"%",      context:retContext, valueColor:retColor, glow:retColor },
  ];

  return (
    <Card style={{padding:"18px 20px"}}>
      <Label>Live Signals</Label>
      {signals.map((s,i)=>(
        <div key={i} style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"11px 0", borderBottom:i<signals.length-1?`1px solid ${C.divider}`:"none",
        }}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:C.t3,marginBottom:3,textTransform:"uppercase",letterSpacing:".08em"}}>{s.label}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{
                fontSize:26,fontWeight:800,letterSpacing:"-0.04em",lineHeight:1,
                fontVariantNumeric:"tabular-nums",
                color:s.valueColor||C.t1,
                textShadow:s.glow?`0 0 14px ${s.glow}66`:undefined,
              }}>{s.value}</span>
              {s.change!=null&&(
                <div style={{display:"flex",alignItems:"center",gap:3}}>
                  {s.change>=0
                    ? <TrendingUp size={10} color={C.green}/>
                    : <TrendingDown size={10} color={C.red}/>
                  }
                  <span style={{fontSize:10,fontWeight:700,color:s.change>=0?C.green:C.red}}>
                    {s.change>=0?"+":""}{s.change}%
                  </span>
                </div>
              )}
              {s.context&&<span style={{fontSize:11,color:C.t3}}>{s.context}</span>}
            </div>
          </div>
          {s.spark&&s.spark.some(v=>v>0)&&(
            <MiniSpark data={s.spark} width={48} height={22} color={s.sparkColor||C.t3}/>
          )}
        </div>
      ))}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR — ACTION QUEUE
══════════════════════════════════════════════════════════════════════ */
function SidebarActionQueue({ atRisk, atRiskMembers=[], posts, challenges, now, openModal, setTab, newNoReturnCount=0 }) {
  const items = useMemo(()=>{
    const list=[];
    if (atRisk>0) list.push({priority:1,urgent:true,icon:Users,title:`${atRisk} member${atRisk>1?"s":""} at risk`,detail:"No visit in 14+ days",cta1:"Message",fn1:()=>openModal("message"),cta2:"View",fn2:()=>setTab("members")});
    if (newNoReturnCount>0) list.push({priority:2,icon:UserPlus,title:`${newNoReturnCount} new — no return yet`,detail:"Week-1 retention window",cta1:"Welcome",fn1:()=>openModal("message"),cta2:"View",fn2:()=>setTab("members")});
    const hasRecentPost=(posts||[]).find(p=>{
      const d=new Date(p.created_at||p.created_date||now);
      return (now-d)<7*86400000;
    });
    if (!hasRecentPost) list.push({priority:3,icon:MessageSquarePlus,title:"No community post this week",detail:"Boosts weekly engagement by 25%",cta1:"Post now",fn1:()=>openModal("post"),cta2:"View",fn2:()=>setTab("content")});
    const hasChallenge=(challenges||[]).some(c=>!c.ended_at);
    if (!hasChallenge) list.push({priority:4,icon:Trophy,title:"Launch a member challenge",detail:"3× more check-ins during challenges",cta1:"Create",fn1:()=>openModal("challenge"),cta2:"View",fn2:()=>setTab("content")});
    return list.sort((a,b)=>a.priority-b.priority).slice(0,4);
  },[atRisk,newNoReturnCount,posts,challenges,now]);

  const urgentCount=items.filter(s=>s.urgent).length;

  return (
    <Card style={{padding:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <div style={{fontSize:14,fontWeight:700,color:C.t1}}>Action Queue</div>
        {urgentCount>0&&(
          <Badge color={C.red} bg={C.redMuted} glow>
            <Dot color={C.red} pulse/> {urgentCount} urgent
          </Badge>
        )}
      </div>
      <div style={{fontSize:11,color:C.t3,marginBottom:16}}>Sorted by impact</div>

      {items.length===0 ? (
        <div style={{padding:"12px 14px",borderRadius:C.rsm,background:C.cardEl,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
          <Dot color={C.green} pulse/>
          <span style={{fontSize:12,fontWeight:700,color:C.t1}}>All clear today</span>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {items.map((item,i)=>{
            const Icon=item.icon;
            return (
              <div key={i} style={{
                padding:"12px 13px", borderRadius:C.rsm,
                background:C.cardEl, border:`1px solid ${item.urgent?`${C.red}33`:C.border}`,
              }}>
                <div style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:4}}>
                  {item.urgent&&<Dot color={C.red} pulse/>}
                  <Icon size={10} color={C.t3} style={{flexShrink:0,marginTop:2}}/>
                  <span style={{fontSize:12,fontWeight:700,color:C.t1,lineHeight:1.3}}>{item.title}</span>
                </div>
                <div style={{fontSize:10,color:C.t3,marginBottom:10,marginLeft:item.urgent?22:17}}>{item.detail}</div>
                <div style={{display:"flex",gap:6}}>
                  <BtnSolid onClick={item.fn1} icon={Send}
                    style={{flex:1,fontSize:10,padding:"5px 8px",gap:4}}>
                    {item.cta1}
                  </BtnSolid>
                  <BtnGhost onClick={item.fn2} icon={Eye}
                    style={{padding:"5px 10px",fontSize:10}}>
                    {item.cta2}
                  </BtnGhost>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR — QUICK ACTIONS
══════════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal, setTab }) {
  const actions = [
    { icon:MessageSquarePlus, label:"Create Post",     fn:()=>openModal("post")      },
    { icon:UserPlus,          label:"Add Member",      fn:()=>openModal("addMember") },
    { icon:Trophy,            label:"Start Challenge", fn:()=>openModal("challenge") },
    { icon:Calendar,          label:"Create Event",    fn:()=>openModal("event")     },
  ];
  return (
    <Card style={{padding:16}}>
      <Label>Quick Actions</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {actions.map(({icon:Icon,label,fn},i)=>{
          const [h,setH]=useState(false);
          return (
            <button key={i} onClick={fn}
              onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
              style={{
                display:"flex",alignItems:"center",gap:7,padding:"9px 10px",
                borderRadius:C.rsm,
                background:h?C.cardEl:C.card,
                border:`1px solid ${h?C.borderEl:C.border}`,
                cursor:"pointer",transition:"all .14s",fontFamily:"inherit",
              }}>
              <Icon size={11} color={h?C.blue:C.t3} style={{flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:600,color:h?C.t1:C.t2,transition:"color .14s"}}>{label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI         = 9,
  yesterdayCI     = 7,
  todayVsYest     = 28,
  activeThisWeek  = 34,
  totalMembers    = 72,
  retentionRate   = 74,
  atRisk          = MOCK_AT_RISK.length,
  sparkData       = MOCK_SPARK,
  challenges      = MOCK_CHALLENGES,
  posts           = MOCK_POSTS,
  recentActivity  = MOCK_ACTIVITY,
  now             = NOW,
  openModal       = ()=>{},
  setTab          = ()=>{},
  retentionBreakdown = { week1:2, week2to4:3 },
  newNoReturnCount = 2,
  atRiskMembers   = MOCK_AT_RISK,
  ownerName       = "Max",
  mrr             = MOCK_MRR,
}) {
  const [isMobile,setIsMobile] = useState(()=>typeof window!=="undefined"?window.innerWidth<768:false);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  },[]);

  return (
    <div style={{
      minHeight:"100vh",
      background:C.bg,
      fontFamily:"'DM Sans','Geist','Helvetica Neue',Arial,sans-serif",
      color:C.t1, fontSize:13, lineHeight:1.5,
      padding:"28px 28px 72px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}
        * { box-sizing:border-box; }
      `}</style>

      <div style={{maxWidth:1360,margin:"0 auto"}}>
        <div style={{
          display:"grid",
          gridTemplateColumns:isMobile?"1fr":"1fr 290px",
          gap:20, alignItems:"start",
        }}>

          {/* ── Left column ── */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <TodaysPlan
              atRisk={atRisk} atRiskMembers={atRiskMembers}
              newNoReturnCount={newNoReturnCount} mrr={mrr}
              totalMembers={totalMembers} retentionRate={retentionRate}
              challenges={challenges} now={now}
              openModal={openModal} setTab={setTab} ownerName={ownerName}
            />
            <PriorityMemberCards
              atRiskMembers={atRiskMembers} totalMembers={totalMembers}
              mrr={mrr} openModal={openModal} setTab={setTab}
            />
            <RevenueAtRiskBanner
              atRisk={atRisk} mrr={mrr} totalMembers={totalMembers}
              newNoReturnCount={newNoReturnCount} openModal={openModal}
            />
            <CoreMetrics
              activeThisWeek={activeThisWeek} totalMembers={totalMembers}
              retentionRate={retentionRate} mrr={mrr}
              atRisk={atRisk} sparkData={sparkData} setTab={setTab}
            />
            <Opportunities
              newNoReturnCount={newNoReturnCount} challenges={challenges}
              now={now} openModal={openModal} setTab={setTab}
              totalMembers={totalMembers} mrr={mrr}
            />
            <SmartInsights
              retentionBreakdown={retentionBreakdown} atRisk={atRisk}
              totalMembers={totalMembers} openModal={openModal}
            />
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
              <WhatWorked recentActivity={recentActivity}/>
              <AutomationActivity atRisk={atRisk} newNoReturnCount={newNoReturnCount} now={now}/>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:28}}>
            <LiveSignals
              todayCI={todayCI} todayVsYest={todayVsYest}
              activeThisWeek={activeThisWeek} totalMembers={totalMembers}
              retentionRate={retentionRate} sparkData={sparkData}
            />
            <SidebarActionQueue
              atRisk={atRisk} atRiskMembers={atRiskMembers}
              posts={posts} challenges={challenges} now={now}
              openModal={openModal} setTab={setTab}
              newNoReturnCount={newNoReturnCount}
            />
            <QuickActionsGrid openModal={openModal} setTab={setTab}/>
          </div>
        </div>
      </div>
    </div>
  );
}
