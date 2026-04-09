import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Flame, ChevronRight, Droplets, Zap, ScanBarcode, X,
  Search, Clock, Star, BookMarked, ChevronDown, ChevronUp,
  Plus, Minus, Check, Pencil, TrendingUp, Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM
   Palette: near-black · white hierarchy · #C8FF00 acid green accent
   One accent. That's it.
───────────────────────────────────────────────────────────── */
const C = {
  card:        'rgba(255,255,255,0.038)',
  cardDeep:    'rgba(0,0,0,0.35)',
  overlay:     'rgba(0,0,0,0.75)',
  line:        'rgba(255,255,255,0.07)',
  lineMid:     'rgba(255,255,255,0.11)',
  t1:          '#F3F4F6',
  t2:          'rgba(243,244,246,0.50)',
  t3:          'rgba(243,244,246,0.28)',
  accent:      '#C8FF00',
  accentDim:   'rgba(200,255,0,0.08)',
  accentLine:  'rgba(200,255,0,0.20)',
  danger:      '#FF5757',
  dangerDim:   'rgba(255,87,87,0.08)',
  dangerLine:  'rgba(255,87,87,0.18)',
  mP:          'rgba(255,255,255,0.90)',
  mC:          'rgba(255,255,255,0.50)',
  mF:          'rgba(255,255,255,0.28)',
  rad:  14,
  rSm:   9,
  rXs:   7,
};
const F = `'Onest', 'DM Sans', system-ui, sans-serif`;
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box}
  input,select,button{font-family:${F}}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  input::placeholder{color:rgba(243,244,246,0.25)}
  select option{background:#12141C;color:#F3F4F6}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scanBar{0%{top:18px;opacity:0}10%{opacity:0.7}90%{opacity:0.7}100%{top:calc(100% - 18px);opacity:0}}
`;

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────── */
const DB = [
  {id:'f01',name:'Chicken Breast (grilled)',brand:'Generic',          cal:165, protein:31,  carbs:0,  fat:3.6,serving:'100g',      servingG:100},
  {id:'f02',name:'Salmon Fillet',           brand:'Generic',          cal:208, protein:20,  carbs:0,  fat:13, serving:'100g',      servingG:100},
  {id:'f03',name:'Greek Yoghurt (0% fat)',  brand:'Fage',             cal:57,  protein:10,  carbs:3.6,fat:0.2,serving:'100g',      servingG:100},
  {id:'f04',name:'Eggs (large)',            brand:'Generic',          cal:78,  protein:6,   carbs:0.6,fat:5,  serving:'1 egg',     servingG:60 },
  {id:'f05',name:'Whey Protein Powder',     brand:'Optimum Nutrition',cal:120, protein:24,  carbs:3,  fat:1.5,serving:'1 scoop',   servingG:30 },
  {id:'f06',name:'Tuna (canned in water)',  brand:'John West',        cal:109, protein:25,  carbs:0,  fat:1,  serving:'100g',      servingG:100},
  {id:'f07',name:'Cottage Cheese',          brand:'Generic',          cal:98,  protein:11,  carbs:3.4,fat:4.3,serving:'100g',      servingG:100},
  {id:'f08',name:'Oats (rolled)',           brand:'Quaker',           cal:389, protein:17,  carbs:66, fat:7,  serving:'100g',      servingG:100},
  {id:'f09',name:'Brown Rice (cooked)',     brand:'Generic',          cal:111, protein:2.6, carbs:23, fat:0.9,serving:'100g',      servingG:100},
  {id:'f10',name:'Wholemeal Bread',         brand:'Hovis',            cal:217, protein:8.7, carbs:39, fat:2.7,serving:'2 slices',  servingG:70 },
  {id:'f11',name:'Sweet Potato (baked)',    brand:'Generic',          cal:90,  protein:2,   carbs:21, fat:0.1,serving:'100g',      servingG:100},
  {id:'f12',name:'Banana',                 brand:'Generic',          cal:89,  protein:1.1, carbs:23, fat:0.3,serving:'1 medium',  servingG:118},
  {id:'f13',name:'Pasta (cooked)',          brand:'Generic',          cal:131, protein:5,   carbs:25, fat:1.1,serving:'100g',      servingG:100},
  {id:'f14',name:'Almonds (raw)',           brand:'Generic',          cal:579, protein:21,  carbs:22, fat:50, serving:'30g',       servingG:30 },
  {id:'f15',name:'Protein Bar',             brand:'Grenade',          cal:207, protein:21,  carbs:20, fat:7,  serving:'1 bar',     servingG:60 },
  {id:'f16',name:'Avocado',                brand:'Generic',          cal:160, protein:2,   carbs:9,  fat:15, serving:'½ fruit',   servingG:75 },
  {id:'f17',name:'Milk (semi-skimmed)',     brand:'Generic',          cal:50,  protein:3.4, carbs:4.8,fat:1.8,serving:'100ml',     servingG:100},
  {id:'f18',name:'Peanut Butter',           brand:'Meridian',         cal:598, protein:25,  carbs:13, fat:51, serving:'2 tbsp',    servingG:32 },
  {id:'f19',name:'Blueberries',            brand:'Generic',          cal:57,  protein:0.7, carbs:14, fat:0.3,serving:'100g',      servingG:100},
  {id:'f20',name:'Mixed Salad Leaves',      brand:'Generic',          cal:17,  protein:1.3, carbs:2,  fat:0.2,serving:'100g',      servingG:100},
];
const RECENTS   = ['f01','f08','f05','f15','f09','f12'];
const FREQUENTS = ['f01','f05','f08','f04','f18'];
const SAVED = [
  {id:'sm1',name:'High-protein breakfast',items:[
    {...DB.find(f=>f.id==='f04'),qty:3},
    {...DB.find(f=>f.id==='f03'),qty:1},
  ]},
  {id:'sm2',name:'Bulk lunch',items:[
    {...DB.find(f=>f.id==='f01'),qty:2},
    {...DB.find(f=>f.id==='f09'),qty:2},
  ]},
];
const BARCODES = [
  {id:'b1',name:'Quaker Instant Oats',    brand:'Quaker', cal:150,protein:5, carbs:27,fat:2.5,serving:'1 packet',servingG:43 },
  {id:'b2',name:'Grenade Carb Killa Bar', brand:'Grenade',cal:219,protein:21,carbs:22,fat:7,  serving:'1 bar',   servingG:63 },
  {id:'b3',name:'Müller Light Yoghurt',   brand:'Müller', cal:98, protein:5, carbs:14,fat:1.9,serving:'1 pot',   servingG:175},
];
const BASE_NUTRITION = {
  calories:{target:2400},protein:{target:180},carbs:{target:260},fats:{target:70},
  water:{glasses:5,target:8},streak:4,
  weekDays:[true,true,false,true,true,false,false],
};
const BASE_MEALS = {
  Breakfast:[{...DB.find(f=>f.id==='f08'),qty:1,logId:'l1'}],
  Lunch:    [{...DB.find(f=>f.id==='f01'),qty:2,logId:'l2'},{...DB.find(f=>f.id==='f09'),qty:2,logId:'l3'}],
  Dinner:   [],
  Snacks:   [{...DB.find(f=>f.id==='f15'),qty:1,logId:'l4'}],
};
const ICONS = {Breakfast:'☀',Lunch:'⛅',Dinner:'◑',Snacks:'◇'};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
let _n = 100;
const uid = () => `l${++_n}`;
const macro = i => ({
  cal:Math.round(i.cal*i.qty), protein:Math.round(i.protein*i.qty),
  carbs:Math.round(i.carbs*i.qty), fat:Math.round(i.fat*i.qty),
});
const totals = meals => {
  let c=0,p=0,ch=0,f=0;
  Object.values(meals).flat().forEach(i=>{const m=macro(i);c+=m.cal;p+=m.protein;ch+=m.carbs;f+=m.fat;});
  return {cal:c,protein:p,carbs:ch,fat:f};
};
const useDebounce=(v,d)=>{
  const[db,set]=useState(v);
  useEffect(()=>{const t=setTimeout(()=>set(v),d);return()=>clearTimeout(t);},[v,d]);
  return db;
};

/* ─────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────── */
const Card=({children,style,animate})=>(
  <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:C.rad,padding:'20px 18px',marginBottom:10,animation:animate?'fadeUp 0.3s ease both':undefined,...style}}>
    {children}
  </div>
);
const Label=({children,right})=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
    <span style={{fontSize:10.5,letterSpacing:'0.10em',textTransform:'uppercase',fontWeight:700,color:C.t3}}>{children}</span>
    {right}
  </div>
);
const HR=({my=6})=><div style={{height:1,background:C.line,margin:`${my}px 0`}}/>;
const GhostBtn=({children,onClick,active,style})=>(
  <button onClick={onClick} style={{background:'none',border:`1px solid ${active?C.accentLine:C.line}`,borderRadius:C.rXs,color:active?C.accent:C.t2,fontSize:12,fontWeight:600,padding:'5px 11px',cursor:'pointer',fontFamily:F,display:'flex',alignItems:'center',gap:5,transition:'all 0.2s',...style}}>{children}</button>
);
const PrimaryBtn=({children,onClick,disabled})=>(
  <button onClick={onClick} disabled={disabled} style={{width:'100%',height:50,borderRadius:C.rSm,background:disabled?C.line:C.accent,border:'none',color:disabled?C.t3:'#000',fontSize:14,fontWeight:800,cursor:disabled?'not-allowed':'pointer',fontFamily:F,letterSpacing:'0.01em',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'opacity 0.15s'}}>{children}</button>
);
const QBtn=({onClick,children})=>(
  <button onClick={onClick} style={{width:34,height:34,borderRadius:C.rXs,background:'rgba(255,255,255,0.06)',border:`1px solid ${C.line}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{children}</button>
);

/* ─────────────────────────────────────────────────────────────
   BOTTOM SHEET
───────────────────────────────────────────────────────────── */
const Sheet=({onClose,children,tall})=>(
  <div style={{position:'fixed',inset:0,zIndex:400,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
    <div style={{position:'absolute',inset:0,background:C.overlay}} onClick={onClose}/>
    <div style={{position:'relative',background:'#0D0F17',border:`1px solid ${C.lineMid}`,borderRadius:'20px 20px 0 0',padding:'16px 18px 44px',maxHeight:tall?'94vh':'88vh',overflowY:'auto'}}>
      <div style={{width:32,height:3,borderRadius:99,background:C.line,margin:'0 auto 22px'}}/>
      {children}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────── */
const Toast=({msg,on})=>(
  <div style={{position:'fixed',bottom:30,left:'50%',transform:`translateX(-50%) translateY(${on?0:8}px)`,opacity:on?1:0,transition:'opacity 0.2s,transform 0.2s',background:'#1A1D28',border:`1px solid ${C.lineMid}`,borderRadius:99,padding:'9px 20px',fontSize:13,color:C.t1,fontWeight:500,boxShadow:'0 8px 32px rgba(0,0,0,0.6)',whiteSpace:'nowrap',zIndex:600,pointerEvents:'none',fontFamily:F}}>
    {msg}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   CALORIE RING
───────────────────────────────────────────────────────────── */
const CalorieRing=({consumed,target})=>{
  const pct=Math.min((consumed/target)*100,100),over=consumed>target;
  const R=44,sz=108,circ=2*Math.PI*R,arc=circ*0.80,fill=arc*(pct/100),col=over?C.danger:C.accent;
  return(
    <div style={{position:'relative',width:sz,height:sz,flexShrink:0}}>
      <svg width={sz} height={sz}>
        <circle cx={sz/2} cy={sz/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} strokeDasharray={`${arc} ${circ-arc}`} strokeLinecap="round" transform={`rotate(150 ${sz/2} ${sz/2})`}/>
        <circle cx={sz/2} cy={sz/2} r={R} fill="none" stroke={col} strokeWidth={6} strokeDasharray={`${fill} ${circ-fill}`} strokeLinecap="round" transform={`rotate(150 ${sz/2} ${sz/2})`} style={{transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)',filter:`drop-shadow(0 0 6px ${col}99)`}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:22,fontWeight:800,color:C.t1,letterSpacing:'-0.04em',lineHeight:1}}>{Math.round(pct)}%</span>
        <span style={{fontSize:10,color:C.t3,marginTop:3,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}}>of goal</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MACRO BARS
───────────────────────────────────────────────────────────── */
const MacroBars=({consumed,nutrition})=>{
  const rows=[
    {label:'Protein',      cur:consumed.protein,target:nutrition.protein.target,bar:C.mP},
    {label:'Carbohydrates',cur:consumed.carbs,  target:nutrition.carbs.target,  bar:C.mC},
    {label:'Fat',          cur:consumed.fat,    target:nutrition.fats.target,   bar:C.mF},
  ];
  return(
    <div>{rows.map(({label,cur,target,bar})=>{
      const pct=Math.min((cur/target)*100,100),over=cur>target;
      return(
        <div key={label} style={{marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
            <span style={{fontSize:12.5,color:C.t2,fontWeight:500}}>{label}</span>
            <div style={{display:'flex',alignItems:'baseline',gap:2}}>
              <span style={{fontSize:13,fontWeight:700,color:over?C.danger:C.t1}}>{cur}g</span>
              <span style={{fontSize:11,color:C.t3}}> / {target}g</span>
            </div>
          </div>
          <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:99,width:`${pct}%`,background:over?C.danger:bar,transition:'width 1s cubic-bezier(.4,0,.2,1)'}}/>
          </div>
        </div>
      );
    })}</div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MACRO ROW INLINE
───────────────────────────────────────────────────────────── */
const MacroRow=({protein,carbs,fat})=>(
  <div style={{display:'flex',gap:14}}>
    {[['P',protein,C.t2],['C',carbs,C.t3],['F',fat,C.t3]].map(([l,v,c])=>(
      <span key={l} style={{fontSize:11.5,color:c,fontWeight:500}}>
        <span style={{color:C.t3,fontWeight:400}}>{l} </span>{v}g
      </span>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   STAT ROW
───────────────────────────────────────────────────────────── */
const StatRow=({consumed,nutrition})=>{
  const rem=Math.max(nutrition.calories.target-consumed.cal,0);
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20}}>
      {[['Goal',nutrition.calories.target.toLocaleString()],['Consumed',consumed.cal.toLocaleString()],['Remaining',rem.toLocaleString()]].map(([l,v])=>(
        <div key={l} style={{background:C.cardDeep,border:`1px solid ${C.line}`,borderRadius:C.rSm,padding:'12px 10px',textAlign:'center'}}>
          <p style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700,margin:'0 0 5px'}}>{l}</p>
          <p style={{fontSize:18,fontWeight:800,color:C.t1,margin:0,letterSpacing:'-0.03em'}}>{v}</p>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   INSIGHT BANNER
───────────────────────────────────────────────────────────── */
const InsightBanner=({text,onDismiss})=>(
  <div style={{background:C.accentDim,border:`1px solid ${C.accentLine}`,borderRadius:C.rSm,padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:10,marginBottom:20}}>
    <TrendingUp size={13} color={C.accent} style={{flexShrink:0,marginTop:2}}/>
    <p style={{flex:1,fontSize:13,color:C.accent,lineHeight:1.55,margin:0,opacity:0.85}}>{text}</p>
    <button onClick={onDismiss} style={{background:'none',border:'none',cursor:'pointer',padding:0,color:C.accent,fontSize:18,lineHeight:1,opacity:0.45,flexShrink:0}}>×</button>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   WATER TRACKER
───────────────────────────────────────────────────────────── */
const WaterTracker=({glasses,target,onAdd})=>(
  <>
    <Label>Hydration</Label>
    <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
      {Array.from({length:target}).map((_,i)=>(
        <div key={i} onClick={i===glasses?onAdd:undefined} style={{width:17,height:22,borderRadius:4,background:i<glasses?'rgba(255,255,255,0.72)':'rgba(255,255,255,0.05)',border:`1px solid ${i<glasses?'rgba(255,255,255,0.18)':C.line}`,cursor:i===glasses?'pointer':'default',transition:'background 0.25s'}}/>
      ))}
    </div>
    <p style={{fontSize:12,color:C.t3,margin:0}}><span style={{fontWeight:700,color:C.t2}}>{glasses}</span> / {target} glasses</p>
  </>
);

/* ─────────────────────────────────────────────────────────────
   WEEK DOTS
───────────────────────────────────────────────────────────── */
const WeekDots=({days})=>{
  const L=['M','T','W','T','F','S','S'],n=days.filter(Boolean).length;
  return(
    <>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        {days.map((on,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,flex:1}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:on?C.accentDim:'rgba(255,255,255,0.04)',border:`1px solid ${on?C.accentLine:C.line}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.3s'}}>
              {on&&<Check size={10} color={C.accent} strokeWidth={2.5}/>}
            </div>
            <span style={{fontSize:10,color:on?C.accent:C.t3,fontWeight:on?700:400}}>{L[i]}</span>
          </div>
        ))}
      </div>
      <p style={{fontSize:12.5,color:C.t2,margin:0}}><span style={{fontWeight:800,color:C.t1}}>{n}/7</span> days on track</p>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────
   FOOD ROW
───────────────────────────────────────────────────────────── */
const FoodRow=({food,onSelect})=>(
  <button onClick={()=>onSelect(food)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'12px 0',background:'none',border:'none',borderTop:`1px solid ${C.line}`,cursor:'pointer',textAlign:'left',fontFamily:F,transition:'opacity 0.15s'}}>
    <div style={{flex:1,minWidth:0}}>
      <p style={{fontSize:14,fontWeight:600,color:C.t1,margin:'0 0 3px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{food.name}</p>
      <p style={{fontSize:11.5,color:C.t3,margin:0}}>{food.brand} · {food.serving}</p>
    </div>
    <div style={{textAlign:'right',flexShrink:0}}>
      <p style={{fontSize:15,fontWeight:800,color:C.t1,margin:'0 0 1px',letterSpacing:'-0.02em'}}>{food.cal}</p>
      <p style={{fontSize:10,color:C.t3,margin:0}}>kcal</p>
    </div>
    <ChevronRight size={13} color={C.t3}/>
  </button>
);

/* ─────────────────────────────────────────────────────────────
   FOOD DETAIL SHEET
───────────────────────────────────────────────────────────── */
const FoodDetailSheet=({food,section,onConfirm,onClose})=>{
  const [qty,setQty]=useState(1);
  const cal=Math.round(food.cal*qty),pr=Math.round(food.protein*qty),ca=Math.round(food.carbs*qty),fa=Math.round(food.fat*qty);
  return(
    <Sheet onClose={onClose}>
      <button onClick={onClose} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:C.t2,fontSize:13,fontWeight:600,marginBottom:20,padding:0,fontFamily:F}}>
        <ArrowLeft size={14} color={C.t2}/>Back
      </button>
      <p style={{fontSize:11,color:C.t3,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700}}>{food.brand}</p>
      <h3 style={{fontSize:20,fontWeight:800,color:C.t1,margin:'0 0 22px',lineHeight:1.25,letterSpacing:'-0.02em'}}>{food.name}</h3>
      <div style={{textAlign:'center',background:C.cardDeep,borderRadius:C.rad,padding:'24px 16px',marginBottom:18,border:`1px solid ${C.line}`}}>
        <p style={{fontSize:56,fontWeight:800,color:C.t1,letterSpacing:'-0.05em',lineHeight:1,margin:'0 0 4px'}}>{cal}</p>
        <p style={{fontSize:13,color:C.t3,margin:'0 0 16px',fontWeight:500}}>kilocalories</p>
        <MacroRow protein={pr} carbs={ca} fat={fa}/>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <p style={{fontSize:10.5,color:C.t3,margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:700}}>Serving size</p>
          <p style={{fontSize:15,color:C.t1,fontWeight:700,margin:0}}>{food.serving}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:0}}>
          <QBtn onClick={()=>setQty(q=>Math.max(0.5,+(q-0.5).toFixed(1)))}><Minus size={13} color={C.t1}/></QBtn>
          <div style={{width:54,textAlign:'center',fontSize:20,fontWeight:800,color:C.t1,letterSpacing:'-0.03em'}}>{qty}</div>
          <QBtn onClick={()=>setQty(q=>+(q+0.5).toFixed(1))}><Plus size={13} color={C.t1}/></QBtn>
        </div>
      </div>
      <HR my={10}/>
      <div style={{marginBottom:22}}>
        {[['Protein',pr],['Carbohydrates',ca],['Fat',fa]].map(([l,v],i,a)=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:i<a.length-1?`1px solid ${C.line}`:'none'}}>
            <span style={{fontSize:13.5,color:C.t2}}>{l}</span>
            <span style={{fontSize:14,fontWeight:700,color:C.t1}}>{v}g</span>
          </div>
        ))}
      </div>
      <PrimaryBtn onClick={()=>onConfirm({section,food,qty})}>
        <Plus size={15} color="#000" strokeWidth={3}/>Add to {section}
      </PrimaryBtn>
    </Sheet>
  );
};

/* ─────────────────────────────────────────────────────────────
   SEARCH INPUT
───────────────────────────────────────────────────────────── */
const SearchInput=({value,onChange,loading})=>(
  <div style={{position:'relative'}}>
    <Search size={14} color={C.t3} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Search foods, brands…" autoFocus style={{width:'100%',height:44,borderRadius:C.rSm,background:'rgba(255,255,255,0.05)',border:`1px solid ${C.lineMid}`,color:C.t1,fontSize:14,fontFamily:F,paddingLeft:38,paddingRight:value?36:14,outline:'none',caretColor:C.accent}}/>
    {value&&!loading&&<button onClick={()=>onChange('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.t3,padding:2,display:'flex'}}><X size={13}/></button>}
    {loading&&<div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',animation:'spin 0.8s linear infinite',display:'flex'}}><Loader2 size={13} color={C.t3}/></div>}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   ADD FOOD SHEET
───────────────────────────────────────────────────────────── */
function AddFoodSheet({section,onAdd,onClose}){
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(false);
  const [selected,setSelected]=useState(null);
  const [tab,setTab]=useState('search');
  const [quickCal,setQuickCal]=useState('');
  const [quickOpen,setQuickOpen]=useState(false);
  const dbQ=useDebounce(query,240);
  useEffect(()=>{if(!dbQ){setLoading(false);return;}setLoading(true);const t=setTimeout(()=>setLoading(false),350);return()=>clearTimeout(t);},[dbQ]);
  const results=useMemo(()=>{if(!dbQ)return[];const q=dbQ.toLowerCase();return DB.filter(f=>f.name.toLowerCase().includes(q)||f.brand.toLowerCase().includes(q)).slice(0,10);},[dbQ]);
  const recents=RECENTS.map(id=>DB.find(f=>f.id===id)).filter(Boolean);
  const frequents=FREQUENTS.map(id=>DB.find(f=>f.id===id)).filter(Boolean);
  const confirm=({section:s,food,qty})=>{onAdd(s,food,qty);onClose();};
  const quickAdd=()=>{const n=parseInt(quickCal,10);if(!n||n<1)return;onAdd(section,{id:`q${Date.now()}`,name:`${n} kcal (manual)`,brand:'Manual entry',cal:n,protein:0,carbs:0,fat:0,serving:'1 entry',servingG:1},1);onClose();};
  if(selected)return <FoodDetailSheet food={selected} section={section} onConfirm={confirm} onClose={()=>setSelected(null)}/>;
  return(
    <Sheet onClose={onClose} tall>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16,lineHeight:1}}>{ICONS[section]}</span>
          <p style={{fontSize:17,fontWeight:800,color:C.t1,margin:0,letterSpacing:'-0.02em'}}>Add to {section}</p>
        </div>
        <GhostBtn onClick={()=>setQuickOpen(o=>!o)} active={quickOpen}>
          <Zap size={11} color={quickOpen?C.accent:C.t3}/>Quick add
        </GhostBtn>
      </div>
      {quickOpen&&(
        <div style={{background:C.accentDim,border:`1px solid ${C.accentLine}`,borderRadius:C.rSm,padding:'14px 16px',marginBottom:16,animation:'fadeUp 0.2s ease both'}}>
          <p style={{fontSize:12,color:C.accent,margin:'0 0 10px',fontWeight:600,opacity:0.8}}>Enter calories directly</p>
          <div style={{display:'flex',gap:8}}>
            <input type="number" placeholder="e.g. 350" value={quickCal} onChange={e=>setQuickCal(e.target.value)} style={{flex:1,height:42,borderRadius:C.rXs,background:'rgba(255,255,255,0.07)',border:`1px solid ${C.lineMid}`,color:C.t1,fontSize:16,fontFamily:F,paddingLeft:14,outline:'none',caretColor:C.accent,fontWeight:700}}/>
            <button onClick={quickAdd} disabled={!quickCal} style={{width:44,height:42,borderRadius:C.rXs,background:C.accent,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:quickCal?1:0.4}}><Check size={16} color="#000" strokeWidth={3}/></button>
          </div>
        </div>
      )}
      <div style={{display:'flex',background:C.cardDeep,borderRadius:C.rXs,padding:3,marginBottom:18,border:`1px solid ${C.line}`}}>
        {[['search','Search'],['saved','Saved Meals']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,height:32,borderRadius:C.rXs-2,border:'none',cursor:'pointer',background:tab===k?'rgba(255,255,255,0.08)':'transparent',color:tab===k?C.t1:C.t3,fontSize:12.5,fontWeight:tab===k?700:500,fontFamily:F,transition:'all 0.2s'}}>{l}</button>
        ))}
      </div>
      {tab==='search'&&(
        <>
          <div style={{marginBottom:16}}><SearchInput value={query} onChange={setQuery} loading={loading}/></div>
          {dbQ&&!loading&&results.length===0&&(
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <AlertCircle size={20} color={C.t3} style={{marginBottom:10,opacity:0.5}}/>
              <p style={{fontSize:14,color:C.t2,margin:'0 0 4px',fontWeight:600}}>No results</p>
              <p style={{fontSize:12,color:C.t3,margin:0}}>Try a different name or brand.</p>
            </div>
          )}
          {results.length>0&&(
            <div style={{marginBottom:16}}>
              <p style={{fontSize:11,color:C.t3,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',margin:'0 0 4px'}}>{results.length} result{results.length!==1?'s':''}</p>
              {results.map(f=><FoodRow key={f.id} food={f} onSelect={setSelected}/>)}
            </div>
          )}
          {!dbQ&&(
            <>
              {recents.length>0&&<div style={{marginBottom:20}}><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}><Clock size={11} color={C.t3}/><span style={{fontSize:10.5,color:C.t3,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Recent</span></div>{recents.map(f=><FoodRow key={f.id} food={f} onSelect={setSelected}/>)}</div>}
              {frequents.length>0&&<div style={{marginBottom:20}}><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}><Star size={11} color={C.t3}/><span style={{fontSize:10.5,color:C.t3,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Frequent</span></div>{frequents.map(f=><FoodRow key={f.id} food={f} onSelect={setSelected}/>)}</div>}
            </>
          )}
        </>
      )}
      {tab==='saved'&&(
        SAVED.length===0
          ?<div style={{textAlign:'center',padding:'36px 16px'}}><p style={{fontSize:14,fontWeight:700,color:C.t2,margin:'0 0 4px'}}>No saved meals</p><p style={{fontSize:12,color:C.t3,margin:0}}>Log meals and save them to reuse later.</p></div>
          :SAVED.map(m=>{
            const tot=m.items.reduce((s,i)=>s+Math.round(i.cal*i.qty),0);
            return(
              <button key={m.id} onClick={()=>{m.items.forEach(i=>onAdd(section,i,i.qty));onClose();}} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:C.rSm,marginBottom:8,background:C.card,border:`1px solid ${C.line}`,cursor:'pointer',textAlign:'left',fontFamily:F,transition:'background 0.15s'}}>
                <BookMarked size={15} color={C.t3} style={{flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14,fontWeight:700,color:C.t1,margin:'0 0 3px'}}>{m.name}</p>
                  <p style={{fontSize:12,color:C.t3,margin:0}}>{m.items.length} foods</p>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <p style={{fontSize:16,fontWeight:800,color:C.t1,margin:'0 0 1px',letterSpacing:'-0.02em'}}>{tot}</p>
                  <p style={{fontSize:10,color:C.t3,margin:0}}>kcal</p>
                </div>
              </button>
            );
          })
      )}
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────────
   BARCODE SCANNER
───────────────────────────────────────────────────────────── */
function BarcodeModal({onAdd,onClose}){
  const [phase,setPhase]=useState('scanning');
  const [result,setResult]=useState(null);
  const [section,setSection]=useState('Snacks');
  const [qty,setQty]=useState(1);
  useEffect(()=>{const t=setTimeout(()=>{setResult(BARCODES[Math.floor(Math.random()*BARCODES.length)]);setPhase('found');},2200);return()=>clearTimeout(t);},[]);
  const cal=result?Math.round(result.cal*qty):0;
  return(
    <Sheet onClose={onClose}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
        <ScanBarcode size={16} color={C.t2}/>
        <p style={{fontSize:16,fontWeight:800,color:C.t1,margin:0,letterSpacing:'-0.02em'}}>Scan Barcode</p>
      </div>
      <div style={{borderRadius:C.rad,overflow:'hidden',position:'relative',marginBottom:22,height:170,background:'rgba(0,0,0,0.6)',border:`1px solid ${phase==='found'?C.accentLine:C.line}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'border-color 0.4s'}}>
        {[{top:14,left:14,borderTop:`2px solid ${C.accent}`,borderLeft:`2px solid ${C.accent}`},{top:14,right:14,borderTop:`2px solid ${C.accent}`,borderRight:`2px solid ${C.accent}`},{bottom:14,left:14,borderBottom:`2px solid ${C.accent}`,borderLeft:`2px solid ${C.accent}`},{bottom:14,right:14,borderBottom:`2px solid ${C.accent}`,borderRight:`2px solid ${C.accent}`}].map((s,i)=>(
          <div key={i} style={{position:'absolute',width:18,height:18,...s}}/>
        ))}
        {phase==='scanning'&&<div style={{position:'absolute',left:14,right:14,height:1,background:`linear-gradient(90deg, transparent, ${C.accent}, transparent)`,animation:'scanBar 1.6s ease-in-out infinite',opacity:0.7}}/>}
        {phase==='scanning'&&<div style={{textAlign:'center',pointerEvents:'none'}}><div style={{animation:'spin 1.2s linear infinite',display:'inline-block',marginBottom:10}}><Loader2 size={22} color={C.t3}/></div><p style={{fontSize:12.5,color:C.t3,margin:0,fontWeight:500}}>Scanning…</p></div>}
        {phase==='found'&&result&&<div style={{textAlign:'center',animation:'fadeUp 0.25s ease both'}}><div style={{width:40,height:40,borderRadius:'50%',background:C.accentDim,border:`1px solid ${C.accentLine}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}><Check size={18} color={C.accent} strokeWidth={2.5}/></div><p style={{fontSize:13.5,fontWeight:700,color:C.t1,margin:'0 0 2px'}}>{result.name}</p><p style={{fontSize:11.5,color:C.t3,margin:0}}>{result.brand}</p></div>}
      </div>
      {phase==='found'&&result&&(
        <div style={{animation:'fadeUp 0.3s ease both'}}>
          <div style={{background:C.cardDeep,borderRadius:C.rSm,border:`1px solid ${C.line}`,padding:'14px 16px',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div><p style={{fontSize:14,fontWeight:700,color:C.t1,margin:'0 0 2px'}}>{result.name}</p><p style={{fontSize:12,color:C.t3,margin:0}}>{result.serving}</p></div>
              <div style={{textAlign:'right'}}><p style={{fontSize:26,fontWeight:800,color:C.t1,letterSpacing:'-0.04em',margin:'0 0 1px',lineHeight:1}}>{cal}</p><p style={{fontSize:10,color:C.t3,margin:0}}>kcal</p></div>
            </div>
            <MacroRow protein={Math.round(result.protein*qty)} carbs={Math.round(result.carbs*qty)} fat={Math.round(result.fat*qty)}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
            <div>
              <p style={{fontSize:10.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:700,margin:'0 0 7px'}}>Quantity</p>
              <div style={{display:'flex',alignItems:'center'}}>
                <QBtn onClick={()=>setQty(q=>Math.max(0.5,+(q-0.5).toFixed(1)))}><Minus size={12} color={C.t1}/></QBtn>
                <div style={{flex:1,textAlign:'center',fontSize:18,fontWeight:800,color:C.t1,letterSpacing:'-0.03em'}}>{qty}</div>
                <QBtn onClick={()=>setQty(q=>+(q+0.5).toFixed(1))}><Plus size={12} color={C.t1}/></QBtn>
              </div>
            </div>
            <div>
              <p style={{fontSize:10.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:700,margin:'0 0 7px'}}>Meal</p>
              <select value={section} onChange={e=>setSection(e.target.value)} style={{width:'100%',height:36,borderRadius:C.rXs,background:'rgba(255,255,255,0.06)',border:`1px solid ${C.lineMid}`,color:C.t1,fontSize:13,fontFamily:F,paddingLeft:10,outline:'none'}}>
                {['Breakfast','Lunch','Dinner','Snacks'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <PrimaryBtn onClick={()=>{onAdd(section,result,qty);onClose();}}><Plus size={15} color="#000" strokeWidth={3}/>Add to {section}</PrimaryBtn>
        </div>
      )}
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────────
   MEAL SECTION
───────────────────────────────────────────────────────────── */
function MealSection({section,items,onAdd,onDelete,divider}){
  const [open,setOpen]=useState(true);
  const sectionCal=items.reduce((s,i)=>s+macro(i).cal,0);
  return(
    <>
      {divider&&<HR/>}
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0 0'}}>
          <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:F}}>
            <span style={{fontSize:14,lineHeight:1}}>{ICONS[section]}</span>
            <span style={{fontSize:14,fontWeight:800,color:C.t1,letterSpacing:'-0.01em'}}>{section}</span>
            {sectionCal>0&&<span style={{fontSize:12.5,color:C.t3,fontWeight:500}}>{sectionCal} kcal</span>}
            {open?<ChevronUp size={13} color={C.t3}/>:<ChevronDown size={13} color={C.t3}/>}
          </button>
          <button onClick={()=>onAdd(section)} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.05)',border:`1px solid ${C.line}`,borderRadius:C.rXs,padding:'5px 11px',cursor:'pointer',fontSize:12,fontWeight:700,color:C.t2,fontFamily:F,transition:'background 0.15s'}}>
            <Plus size={11} color={C.t2} strokeWidth={2.5}/>Add
          </button>
        </div>
        {open&&(
          <div style={{paddingBottom:6,paddingTop:2}}>
            {items.length===0
              ?<p style={{fontSize:12,color:C.t3,padding:'10px 0 6px',margin:0}}>Nothing logged yet</p>
              :items.map((m,i)=>{
                const mc=macro(m);
                return(
                  <div key={m.logId} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderTop:`1px solid ${C.line}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:14,color:C.t1,margin:'0 0 4px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</p>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        {m.qty>1&&<span style={{fontSize:11.5,color:C.t3}}>{m.qty}×</span>}
                        <MacroRow protein={mc.protein} carbs={mc.carbs} fat={mc.fat}/>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <p style={{fontSize:15,fontWeight:800,color:C.t1,margin:'0 0 1px',letterSpacing:'-0.02em'}}>{mc.cal}</p>
                      <p style={{fontSize:10,color:C.t3,margin:0}}>kcal</p>
                    </div>
                    <button onClick={()=>onDelete(section,i)} style={{width:28,height:28,borderRadius:C.rXs,background:C.dangerDim,border:`1px solid ${C.dangerLine}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.15s'}}>
                      <X size={11} color={C.danger}/>
                    </button>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT
───────────────────────────────────────────────────────────── */
export default function NutritionTab(){
  const [nutrition,setNutrition]=useState(BASE_NUTRITION);
  const [meals,setMeals]=useState(BASE_MEALS);
  const [addingTo,setAddingTo]=useState(null);
  const [scanner,setScanner]=useState(false);
  const [insight,setInsight]=useState(true);
  const [toast,setToast]=useState({msg:'',on:false});
  const timer=useRef(null);

  const consumed=useMemo(()=>totals(meals),[meals]);

  const showToast=useCallback(msg=>{
    clearTimeout(timer.current);
    setToast({msg,on:true});
    timer.current=setTimeout(()=>setToast(t=>({...t,on:false})),2200);
  },[]);

  const handleAdd=useCallback((section,food,qty)=>{
    setMeals(m=>({...m,[section]:[...(m[section]||[]),{...food,qty,logId:uid()}]}));
    showToast(`Added — ${food.name}`);
  },[showToast]);

  const handleDelete=useCallback((section,idx)=>{
    const name=meals[section][idx]?.name??'Item';
    setMeals(m=>({...m,[section]:m[section].filter((_,i)=>i!==idx)}));
    showToast(`Removed — ${name}`);
  },[meals,showToast]);

  const handleWater=useCallback(()=>{
    setNutrition(n=>({...n,water:{...n.water,glasses:Math.min(n.water.glasses+1,n.water.target)}}));
    showToast('Water logged');
  },[showToast]);

  const proteinLeft=nutrition.protein.target-consumed.protein;
  const calLeft=nutrition.calories.target-consumed.cal;
  const insightText=consumed.cal>=nutrition.calories.target
    ?'Daily calorie goal reached — excellent discipline.'
    :proteinLeft>0
    ?`${proteinLeft}g protein remaining to hit your daily target.`
    :`${calLeft} kcal remaining for today.`;

  return(
    <div style={{display:'flex',flexDirection:'column',paddingBottom:40,fontFamily:F}}>
      <style>{CSS}</style>

      {/* OVERVIEW */}
      <Card animate>
        <Label>Daily Overview</Label>
        <div style={{display:'flex',alignItems:'center',gap:22,marginBottom:22}}>
          <CalorieRing consumed={consumed.cal} target={nutrition.calories.target}/>
          <div style={{flex:1}}>
            <p style={{fontSize:11,color:C.t3,margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700}}>Calories consumed</p>
            <p style={{fontSize:40,fontWeight:800,color:C.t1,lineHeight:1,margin:'0 0 3px',letterSpacing:'-0.05em'}}>{consumed.cal.toLocaleString()}<span style={{fontSize:15,fontWeight:400,color:C.t3,letterSpacing:0}}> kcal</span></p>
            <p style={{fontSize:13,color:C.t3,margin:0}}>of {nutrition.calories.target.toLocaleString()} kcal</p>
          </div>
        </div>
        {insight&&<InsightBanner text={insightText} onDismiss={()=>setInsight(false)}/>}
        <StatRow consumed={consumed} nutrition={nutrition}/>
        <MacroBars consumed={consumed} nutrition={nutrition}/>
      </Card>

      {/* ADD FOOD */}
      <Card>
        <Label>Add Food</Label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          {[
            {label:'Protein Shake', sub:'30g protein · 180 kcal',icon:<Droplets size={14} color={C.t2}/>,food:{id:'qs',name:'Protein Shake',brand:'Manual',cal:180,protein:30,carbs:6,fat:3,serving:'1 shake',servingG:1}},
            {label:'Quick 500 kcal',sub:'Rapid energy entry',    icon:<Zap size={14} color={C.t2}/>,     food:{id:'qe',name:'500 kcal (manual)',brand:'Manual',cal:500,protein:20,carbs:60,fat:18,serving:'1 entry',servingG:1}},
          ].map(opt=>(
            <button key={opt.label} onClick={()=>handleAdd('Snacks',opt.food,1)} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:C.rSm,padding:'14px 13px',cursor:'pointer',textAlign:'left',fontFamily:F,transition:'background 0.15s'}}>
              <div style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.05)',border:`1px solid ${C.line}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>{opt.icon}</div>
              <p style={{fontSize:13.5,fontWeight:700,color:C.t1,margin:'0 0 3px'}}>{opt.label}</p>
              <p style={{fontSize:11.5,color:C.t3,margin:0}}>{opt.sub}</p>
            </button>
          ))}
        </div>
        <button onClick={()=>setScanner(true)} style={{width:'100%',display:'flex',alignItems:'center',gap:13,background:C.card,border:`1px solid ${C.line}`,borderRadius:C.rSm,padding:'13px 14px',cursor:'pointer',fontFamily:F,transition:'background 0.15s'}}>
          <div style={{width:34,height:34,borderRadius:C.rXs,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.line}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><ScanBarcode size={15} color={C.t2}/></div>
          <div style={{textAlign:'left',flex:1}}>
            <p style={{fontSize:14,fontWeight:700,color:C.t1,margin:'0 0 2px'}}>Scan Barcode</p>
            <p style={{fontSize:12,color:C.t3,margin:0}}>Identify packaged foods instantly</p>
          </div>
          <ChevronRight size={13} color={C.t3}/>
        </button>
      </Card>

      {/* MEAL LOG */}
      <Card>
        <Label>Meal Log</Label>
        {['Breakfast','Lunch','Dinner','Snacks'].map((s,i)=>(
          <MealSection key={s} section={s} items={meals[s]||[]} onAdd={setAddingTo} onDelete={handleDelete} divider={i>0}/>
        ))}
      </Card>

      {/* WEEKLY */}
      <Card>
        <Label>Weekly Consistency</Label>
        <WeekDots days={nutrition.weekDays}/>
      </Card>

      {/* WATER + STREAK */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <Card style={{marginBottom:0,padding:16}}><WaterTracker glasses={nutrition.water.glasses} target={nutrition.water.target} onAdd={handleWater}/></Card>
        <Card style={{marginBottom:0,padding:16}}>
          <Label>Streak</Label>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,marginBottom:4}}>
            <Flame size={20} color={C.accent} style={{filter:`drop-shadow(0 0 8px ${C.accent}66)`}}/>
            <span style={{fontSize:38,fontWeight:800,color:C.t1,lineHeight:1,letterSpacing:'-0.05em'}}>{nutrition.streak}</span>
          </div>
          <p style={{fontSize:12,color:C.t3,margin:0}}>days on track</p>
        </Card>
      </div>

      {/* GOAL */}
      <Card>
        <Label right={<GhostBtn><Pencil size={10} color={C.t3}/>Edit</GhostBtn>}>Current Goal</Label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[['Goal','Muscle Gain'],['Calories',`${nutrition.calories.target.toLocaleString()} kcal`],['Protein',`${nutrition.protein.target}g`]].map(([l,v])=>(
            <div key={l} style={{background:C.cardDeep,border:`1px solid ${C.line}`,borderRadius:C.rSm,padding:'13px 10px',textAlign:'center'}}>
              <p style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700,margin:'0 0 5px'}}>{l}</p>
              <p style={{fontSize:13.5,fontWeight:800,color:C.t1,margin:0,lineHeight:1.2,letterSpacing:'-0.01em'}}>{v}</p>
            </div>
          ))}
        </div>
      </Card>

      {addingTo&&<AddFoodSheet section={addingTo} onAdd={handleAdd} onClose={()=>setAddingTo(null)}/>}
      {scanner&&<BarcodeModal onAdd={handleAdd} onClose={()=>setScanner(false)}/>}
      <Toast msg={toast.msg} on={toast.on}/>
    </div>
  );
}
