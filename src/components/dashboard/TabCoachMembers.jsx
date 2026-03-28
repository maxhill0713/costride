import { useState, useMemo, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES  — "Enterprise Precision" aesthetic
   Philosophy: monochrome base · status colour only on indicators · 8px grid
   white KPI figures · surgical use of accent blue · zero decorative noise
───────────────────────────────────────────────────────────────────────────── */
const S = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  /* surfaces */
  --bg:       #080909;
  --surf:     #0e0f10;
  --card:     #121314;
  --card2:    #161718;
  --overlay:  rgba(0,0,0,0.75);

  /* borders */
  --b:        rgba(255,255,255,0.06);
  --bhi:      rgba(255,255,255,0.11);
  --bact:     rgba(255,255,255,0.18);

  /* accent — used ONLY for selected/active states */
  --blue:     #3b82f6;
  --blue-dim: rgba(59,130,246,0.09);
  --blue-mid: rgba(59,130,246,0.18);
  --blue-bdr: rgba(59,130,246,0.30);

  /* status — used ONLY for dots, badges, critical numbers */
  --red:    #ef4444;   --rd: rgba(239,68,68,0.08);   --rb: rgba(239,68,68,0.22);
  --amber:  #f59e0b;   --ad: rgba(245,158,11,0.08);  --ab: rgba(245,158,11,0.22);
  --green:  #22c55e;   --gd: rgba(34,197,94,0.08);   --gb: rgba(34,197,94,0.22);

  /* typography */
  --t1: #f1f3f5;
  --t2: #8b949e;
  --t3: #484f58;
  --t4: #2d3139;

  /* geometry */
  --r:  8px;
  --rs: 5px;

  /* layout */
  --sw:  220px;
  --pw:  392px;
  --hkpi: 72px;
  --hdr-h: 52px;
  --fbar-h: 41px;
  --tb-h: 44px;

  /* transitions */
  --tr: 0.12s ease;

  font-family:'DM Sans',sans-serif;
}

body{ background:var(--bg); color:var(--t1); font-size:13.5px; }
button,select,input{ font-family:'DM Sans',sans-serif; }
input[type="date"],input[type="time"]{ color-scheme:dark; }

/* ── SCROLLBARS ─────────────────────────────────────────────────────────── */
::-webkit-scrollbar{ width:3px; height:3px; }
::-webkit-scrollbar-thumb{ background:var(--b); border-radius:2px; }

/* ── APP SHELL ──────────────────────────────────────────────────────────── */
.app{ display:flex; height:100vh; overflow:hidden; }
.main{ flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
.body-split{ flex:1; display:flex; overflow:hidden; }

/* ── SIDEBAR ─────────────────────────────────────────────────────────────── */
.sb{
  width:var(--sw); flex-shrink:0;
  background:var(--surf);
  border-right:1px solid var(--b);
  display:flex; flex-direction:column;
}
.sb-top{
  height:var(--hdr-h);
  display:flex; align-items:center;
  padding:0 14px;
  border-bottom:1px solid var(--b);
  gap:9px;
}
.sb-ico{
  width:26px; height:26px; border-radius:5px;
  background:var(--card2); border:1px solid var(--bhi);
  display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:11.5px; color:var(--t1); flex-shrink:0;
  letter-spacing:-.01em;
}
.sb-gname{ font-size:12.5px; font-weight:600; color:var(--t1); }
.sb-grole{ font-size:10px; color:var(--t3); font-weight:500; }

.sb-nav{ flex:1; padding:8px 0; }
.sb-lbl{
  font-size:9.5px; color:var(--t3); text-transform:uppercase;
  letter-spacing:.09em; font-weight:600;
  padding:8px 14px 4px;
}
.sb-item{
  display:flex; align-items:center; gap:8px;
  padding:7px 14px;
  cursor:pointer; color:var(--t2); font-size:13px; font-weight:500;
  transition:var(--tr); border-left:2px solid transparent;
  user-select:none;
}
.sb-item:hover{ color:var(--t1); background:rgba(255,255,255,0.02); }
.sb-item.on{ color:var(--t1); background:var(--blue-dim); border-left-color:var(--blue); }
.sb-item svg{ opacity:.55; flex-shrink:0; }
.sb-item.on svg{ opacity:1; }

.sb-foot{
  margin-top:auto; border-top:1px solid var(--b);
  padding:8px 0;
}
.sb-new{
  display:flex; align-items:center; gap:7px;
  margin:6px 10px 2px;
  padding:7px 10px;
  background:var(--blue); color:#fff;
  border-radius:var(--rs); font-size:12.5px; font-weight:600;
  cursor:pointer; transition:var(--tr); border:none;
  justify-content:center;
}
.sb-new:hover{ background:#2563eb; }
.sb-link{
  display:flex; align-items:center; gap:8px;
  padding:6px 14px; font-size:12px; color:var(--t3);
  cursor:pointer; transition:var(--tr);
}
.sb-link:hover{ color:var(--t2); }
.sb-link.out{ color:rgba(239,68,68,0.55); }
.sb-link.out:hover{ color:var(--red); }

/* ── KPI BAR — top of content ────────────────────────────────────────────── */
.kpi-bar{
  display:grid; grid-template-columns:repeat(5,1fr);
  border-bottom:1px solid var(--b);
  flex-shrink:0;
  background:var(--surf);
}
.kpi{
  padding:14px 20px 13px;
  border-right:1px solid var(--b);
  transition:var(--tr); cursor:default;
}
.kpi:last-child{ border-right:none; }
.kpi.clickable{ cursor:pointer; }
.kpi.clickable:hover{ background:var(--card); }
.kpi-lbl{
  font-size:9.5px; text-transform:uppercase; letter-spacing:.09em;
  color:var(--t3); font-weight:600; margin-bottom:5px;
}
.kpi-val{
  font-size:26px; font-weight:700; letter-spacing:-.03em;
  line-height:1; color:#fff;
  font-family:'DM Mono',monospace;
}
.kpi-sub{ font-size:10.5px; color:var(--t3); margin-top:4px; }
.kpi-dot{
  display:inline-block; width:6px; height:6px; border-radius:50%;
  margin-right:5px; margin-bottom:1px; vertical-align:middle;
}

/* ── HEADER ──────────────────────────────────────────────────────────────── */
.hdr{
  height:var(--hdr-h);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 22px;
  border-bottom:1px solid var(--b);
  background:var(--surf); flex-shrink:0;
}
.hdr-l{ display:flex; align-items:baseline; gap:10px; }
.hdr-l h1{ font-size:15px; font-weight:700; letter-spacing:-.02em; }
.hdr-l p{ font-size:11.5px; color:var(--t3); font-weight:400; }
.hdr-r{ display:flex; align-items:center; gap:6px; }

/* ── BUTTONS ─────────────────────────────────────────────────────────────── */
.btn{
  display:inline-flex; align-items:center; gap:5px;
  padding:5px 12px; border-radius:var(--rs);
  font-size:12px; font-weight:500; cursor:pointer;
  border:none; transition:var(--tr);
}
.btn-gh{
  background:transparent; color:var(--t2);
  border:1px solid var(--b);
}
.btn-gh:hover{ background:rgba(255,255,255,0.04); color:var(--t1); border-color:var(--bhi); }
.btn-sm{ padding:4px 10px; font-size:11.5px; }

.iBtn{
  width:28px; height:28px; border-radius:var(--rs);
  display:flex; align-items:center; justify-content:center;
  background:transparent; color:var(--t2); border:1px solid var(--b);
  cursor:pointer; transition:var(--tr); font-size:13px;
}
.iBtn:hover{ background:rgba(255,255,255,0.04); color:var(--t1); border-color:var(--bhi); }

.avatar-chip{
  width:28px; height:28px; border-radius:50%;
  background:var(--card2); border:1px solid var(--bhi);
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:700; color:var(--t2);
  cursor:pointer; flex-shrink:0;
}

/* ── FILTER BAR ──────────────────────────────────────────────────────────── */
.fbar{
  display:flex; align-items:center; gap:2px;
  padding:6px 22px;
  border-bottom:1px solid var(--b);
  background:var(--surf); flex-shrink:0;
  overflow-x:auto;
}
.fbar::-webkit-scrollbar{ display:none; }
.ft{
  display:inline-flex; align-items:center; gap:4px;
  padding:4px 9px; border-radius:20px;
  border:1px solid transparent;
  font-size:12px; font-weight:500; color:var(--t3);
  cursor:pointer; white-space:nowrap; transition:var(--tr);
}
.ft:hover{ color:var(--t2); border-color:var(--b); }
.ft.on{ color:var(--t1); background:var(--blue-dim); border-color:var(--blue-bdr); }
.ft .n{
  font-size:10px; font-weight:600;
  padding:1px 5px; border-radius:10px;
  background:var(--t4); color:var(--t3);
  font-family:'DM Mono',monospace;
}
.ft.on .n{ background:var(--blue-mid); color:var(--blue); }
.ft.rt .n{ background:var(--rd); color:var(--red); }
.ft.at .n{ background:var(--ad); color:var(--amber); }
.fdiv{ width:1px; height:12px; background:var(--b); flex-shrink:0; margin:0 3px; }

/* ── TOOLBAR ─────────────────────────────────────────────────────────────── */
.tb{
  display:flex; align-items:center; gap:7px;
  padding:7px 22px;
  border-bottom:1px solid var(--b);
  background:var(--card); flex-shrink:0;
}
.sw{ flex:1; max-width:320px; position:relative; }
.si{ position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--t3); font-size:12px; pointer-events:none; }
.sinp{
  width:100%; padding:5px 9px 5px 28px;
  background:var(--surf); border:1px solid var(--b);
  border-radius:var(--rs); color:var(--t1); font-size:12.5px;
  outline:none; transition:var(--tr);
}
.sinp::placeholder{ color:var(--t3); }
.sinp:focus{ border-color:var(--blue-bdr); background:var(--card); }
.kbd{
  position:absolute; right:8px; top:50%; transform:translateY(-50%);
  font-size:10px; color:var(--t3); background:var(--card2);
  border:1px solid var(--b); border-radius:3px; padding:1px 4px;
  font-family:'DM Mono',monospace; pointer-events:none;
}
.ssel{
  padding:5px 8px; background:var(--surf);
  border:1px solid var(--b); border-radius:var(--rs);
  color:var(--t2); font-size:12px; cursor:pointer;
  outline:none; transition:var(--tr);
}
.ssel:hover{ border-color:var(--bhi); color:var(--t1); }
.tb-r{ display:flex; align-items:center; gap:5px; margin-left:auto; }
.tgl{ display:flex; border:1px solid var(--b); border-radius:var(--rs); overflow:hidden; }
.tgl-btn{
  padding:4px 10px; background:transparent; color:var(--t3);
  border:none; cursor:pointer; font-size:12px;
  transition:var(--tr); font-family:'DM Sans',sans-serif;
}
.tgl-btn:hover{ background:rgba(255,255,255,0.03); color:var(--t2); }
.tgl-btn.on{ background:var(--blue-dim); color:var(--blue); }

/* ── CLIENT LIST ─────────────────────────────────────────────────────────── */
.clist{ flex:1; overflow-y:auto; }
.ghdr{
  position:sticky; top:0; z-index:3;
  display:flex; align-items:center; gap:7px;
  padding:7px 22px 5px;
  background:var(--bg);
  font-size:9.5px; font-weight:700; text-transform:uppercase;
  letter-spacing:.1em;
}
.ghdr::after{ content:''; flex:1; height:1px; background:var(--b); }
.ghdr.r{ color:var(--red); }
.ghdr.a{ color:var(--amber); }
.ghdr.g{ color:var(--green); }

.crow{
  display:flex; align-items:center; gap:12px;
  padding:11px 22px;
  border-bottom:1px solid var(--b);
  cursor:pointer; transition:background var(--tr);
  border-left:2px solid transparent;
  position:relative;
}
.crow:hover{ background:rgba(255,255,255,0.015); }
.crow.sel{ background:var(--blue-dim); border-left-color:var(--blue) !important; }
.crow.at-risk{ border-left-color:rgba(239,68,68,0.4); }
.crow.needs-attention{ border-left-color:rgba(245,158,11,0.4); }

.cav{
  width:34px; height:34px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:12px; flex-shrink:0;
}

.ci{ flex:1; min-width:0; }
.cnr{ display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
.cn{ font-size:13.5px; font-weight:600; }
.tag{
  font-size:9px; font-weight:700;
  padding:1px 5px; border-radius:3px;
  text-transform:uppercase; letter-spacing:.04em;
}
.treg{ background:var(--card2); color:var(--t3); border:1px solid var(--b); }
.tnew{ background:var(--blue-dim); color:var(--blue); border:1px solid var(--blue-bdr); }
.tvip{ background:rgba(234,179,8,0.07); color:#eab308; border:1px solid rgba(234,179,8,0.2); }

.cm{ display:flex; align-items:center; gap:12px; margin-top:3px; flex-wrap:wrap; }
.mi{ display:flex; align-items:center; gap:3px; font-size:11.5px; color:var(--t2); }
.sd{ width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.sdg{ background:var(--green); } .sda{ background:var(--amber); } .sdr{ background:var(--red); }
.tup{ color:var(--green); font-size:11px; }
.tdn{ color:var(--red); font-size:11px; }
.tfl{ color:var(--t3); font-size:11px; }

.flags{ display:flex; gap:3px; flex-wrap:wrap; margin-top:5px; }
.fl{ font-size:10px; font-weight:500; padding:2px 6px; border-radius:3px; }
.flr{ background:var(--rd); color:var(--red); border:1px solid var(--rb); }
.fla{ background:var(--ad); color:var(--amber); border:1px solid var(--ab); }
.flg{ background:rgba(255,255,255,0.04); color:var(--t3); border:1px solid var(--b); }

.cr{ display:flex; align-items:center; gap:6px; flex-shrink:0; }
.score-badge{
  min-width:34px; height:34px; border-radius:var(--rs);
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:700; flex-shrink:0;
  font-family:'DM Mono',monospace; padding:0 4px;
}
.sbr{ background:var(--rd); color:var(--red); border:1px solid var(--rb); }
.sba{ background:var(--ad); color:var(--amber); border:1px solid var(--ab); }
.sbg{ background:var(--gd); color:var(--green); border:1px solid var(--gb); }

.ract{
  width:26px; height:26px; border-radius:var(--rs);
  display:flex; align-items:center; justify-content:center;
  border:1px solid var(--b); background:transparent;
  color:var(--t3); cursor:pointer; transition:var(--tr); font-size:12px;
}
.ract:hover{ color:var(--t1); border-color:var(--bhi); background:rgba(255,255,255,0.04); }
.chev{ color:var(--t4); font-size:12px; transition:var(--tr); }
.crow:hover .chev{ color:var(--t2); }

.empty-list{ padding:56px 24px; text-align:center; color:var(--t3); font-size:12.5px; }

/* ── DETAIL PANEL ────────────────────────────────────────────────────────── */
.panel{
  width:var(--pw); flex-shrink:0;
  background:var(--surf); border-left:1px solid var(--b);
  display:flex; flex-direction:column; overflow:hidden;
}
@keyframes pi{ from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
.pan{ animation:pi .16s ease; display:flex; flex-direction:column; height:100%; overflow:hidden; }

.pempty{
  flex:1; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap:6px; padding:40px 24px; text-align:center; color:var(--t3);
}
.pempty .ei{ font-size:20px; opacity:.2; margin-bottom:4px; }
.pempty h4{ font-size:13px; font-weight:600; color:var(--t2); }
.pempty p{ font-size:11.5px; line-height:1.65; max-width:220px; }

.ph{ padding:14px 16px 12px; border-bottom:1px solid var(--b); flex-shrink:0; }
.ph-top{ display:flex; align-items:flex-start; gap:10px; margin-bottom:12px; }
.phav{
  width:38px; height:38px; border-radius:50%;
  flex-shrink:0; display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:13px;
}
.pname{ font-size:14px; font-weight:700; letter-spacing:-.01em; }
.psub{
  display:flex; align-items:center; gap:5px;
  font-size:11px; color:var(--t2); margin-top:3px; flex-wrap:wrap;
}
.pclose{
  margin-left:auto; width:24px; height:24px; border-radius:var(--rs);
  display:flex; align-items:center; justify-content:center;
  color:var(--t3); cursor:pointer; border:1px solid var(--b);
  font-size:10px; flex-shrink:0; transition:var(--tr);
}
.pclose:hover{ color:var(--t1); border-color:var(--bhi); }

.qas{ display:flex; gap:5px; }
.qa{
  flex:1; padding:6px 5px;
  background:var(--card); border:1px solid var(--b);
  border-radius:var(--rs); color:var(--t2); font-size:11.5px;
  font-weight:500; cursor:pointer; transition:var(--tr);
  display:flex; align-items:center; justify-content:center; gap:4px;
}
.qa:hover{ background:var(--card2); color:var(--t1); border-color:var(--bhi); }
.qa.qp{ background:var(--blue-dim); border-color:var(--blue-bdr); color:var(--blue); }
.qa.qp:hover{ background:var(--blue-mid); }
.qa.qbook{ background:var(--gd); border-color:var(--gb); color:var(--green); }
.qa.qbook:hover{ background:rgba(34,197,94,0.14); }

.pb{ flex:1; overflow-y:auto; padding:14px 16px 24px; }
.psec{ margin-bottom:18px; }
.pst{
  font-size:9.5px; font-weight:700; text-transform:uppercase;
  letter-spacing:.09em; color:var(--t3); margin-bottom:8px;
  display:flex; align-items:center; gap:6px;
}
.pst::after{ content:''; flex:1; height:1px; background:var(--b); }

/* score bar */
.sbc{
  background:var(--card); border:1px solid var(--b);
  border-radius:var(--r); padding:12px 14px;
}
.sbt{
  display:flex; align-items:baseline;
  justify-content:space-between; margin-bottom:8px;
}
.sbl{ font-size:11.5px; color:var(--t2); }
.sbv{
  font-size:22px; font-weight:700; letter-spacing:-.03em;
  font-family:'DM Mono',monospace;
}
.sbtr{ height:3px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
.sbf{ height:100%; border-radius:2px; transition:width .7s cubic-bezier(.4,0,.2,1); }
.sblb{
  display:flex; justify-content:space-between;
  margin-top:5px; font-size:10px; color:var(--t3);
}

/* metrics grid */
.mg{ display:grid; grid-template-columns:1fr 1fr; gap:5px; }
.mc{
  background:var(--card); border:1px solid var(--b);
  border-radius:var(--r); padding:9px 11px;
}
.mcl{
  font-size:9.5px; color:var(--t3); text-transform:uppercase;
  letter-spacing:.07em; font-weight:600; margin-bottom:4px;
}
.mcv{
  font-size:16px; font-weight:700; line-height:1;
  letter-spacing:-.01em; color:var(--t1);
  font-family:'DM Mono',monospace;
}
.mcsm{ font-size:13px; font-family:'DM Sans',sans-serif; }
.mcg{ color:var(--green); } .mcr{ color:var(--red); } .mca{ color:var(--amber); }
.mcs{ font-size:10px; color:var(--t3); margin-top:2px; }

/* last interaction row */
.lintb{
  background:var(--card); border:1px solid var(--b);
  border-radius:var(--r); padding:10px 14px;
  display:flex; align-items:center; justify-content:space-between; gap:8px;
}
.lirow{ display:flex; flex-direction:column; gap:2px; }
.lilbl{ font-size:9.5px; color:var(--t3); font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
.lival{ font-size:12.5px; font-weight:600; color:var(--t1); }
.lidiv{ width:1px; height:26px; background:var(--b); }

/* insights */
.ins{
  background:var(--card); border:1px solid var(--b);
  border-radius:var(--r); padding:10px 12px;
  margin-bottom:5px; border-left:2px solid transparent;
}
.ins.ic{ border-left-color:var(--red); }
.ins.iw{ border-left-color:var(--amber); }
.ins.ii{ border-left-color:var(--blue); }
.insh{ display:flex; align-items:flex-start; justify-content:space-between; gap:5px; }
.inst{ font-size:12px; font-weight:600; color:var(--t1); }
.insb{ font-size:11px; color:var(--t2); margin-top:3px; line-height:1.55; }
.insct{
  display:inline-flex; align-items:center; gap:3px;
  font-size:11px; color:var(--blue); font-weight:500;
  margin-top:6px; cursor:pointer;
}
.insct:hover{ text-decoration:underline; }

/* timeline */
.tli{
  display:flex; gap:10px; padding:7px 0;
  border-bottom:1px solid var(--b);
}
.tli:last-child{ border-bottom:none; }
.tld{
  width:6px; height:6px; border-radius:50%;
  flex-shrink:0; margin-top:5px;
}
.tlv{ background:var(--green); }
.tlm{ background:var(--red); }
.tlmsg{ background:var(--blue); }
.tlw{ background:var(--amber); }
.tllb{ font-size:12px; color:var(--t1); font-weight:500; }
.tlt{ font-size:10.5px; color:var(--t3); margin-top:1px; }

/* notes */
.notes-box{
  background:var(--card); border:1px solid var(--b);
  border-radius:var(--r); padding:10px 12px;
  font-size:11.5px; color:var(--t2); line-height:1.65;
}

/* ── MODAL ───────────────────────────────────────────────────────────────── */
.ov{
  position:fixed; inset:0;
  background:rgba(0,0,0,0.72);
  z-index:100; display:flex; align-items:center; justify-content:center;
  padding:20px; backdrop-filter:blur(3px);
}
@keyframes mIn{ from{opacity:0;transform:scale(.97)translateY(6px)} to{opacity:1;transform:scale(1)translateY(0)} }
.modal{
  background:var(--surf); border:1px solid var(--bhi);
  border-radius:var(--r); width:100%; max-width:420px;
  animation:mIn .16s ease; overflow:hidden;
}
.mhdr{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 18px; border-bottom:1px solid var(--b);
}
.mhdr h3{ font-size:14px; font-weight:700; }
.mcls{
  width:24px; height:24px; border-radius:var(--rs);
  display:flex; align-items:center; justify-content:center;
  border:1px solid var(--b); color:var(--t3); cursor:pointer;
  font-size:11px; transition:var(--tr);
}
.mcls:hover{ color:var(--t1); border-color:var(--bhi); }
.mbody{ padding:18px; }
.mfld{ margin-bottom:14px; }
.mfld label{
  display:block; font-size:10.5px; font-weight:600; color:var(--t2);
  text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px;
}
.mfld input,.mfld textarea,.mfld select{
  width:100%; padding:7px 10px;
  background:var(--card); border:1px solid var(--b);
  border-radius:var(--rs); color:var(--t1);
  font-family:'DM Sans',sans-serif; font-size:13px;
  outline:none; transition:var(--tr); resize:vertical;
}
.mfld input:focus,.mfld textarea:focus,.mfld select:focus{
  border-color:var(--blue-bdr); background:var(--card2);
}
.mfld textarea{ min-height:76px; }
.mfoot{
  display:flex; justify-content:flex-end; gap:7px;
  padding:12px 18px; border-top:1px solid var(--b);
}
.btn-pr{
  background:var(--blue); color:#fff; border:none;
  padding:6px 14px; border-radius:var(--rs);
  font-size:12.5px; font-weight:600; cursor:pointer; transition:var(--tr);
}
.btn-pr:hover{ background:#2563eb; }
.btn-danger{
  background:var(--rd); color:var(--red); border:1px solid var(--rb);
  padding:6px 14px; border-radius:var(--rs);
  font-size:12.5px; font-weight:600; cursor:pointer; transition:var(--tr);
}
.btn-danger:hover{ background:rgba(239,68,68,0.14); }

/* ── TOAST ───────────────────────────────────────────────────────────────── */
@keyframes tin{ from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
.toast{
  position:fixed; bottom:22px; right:22px; z-index:200;
  background:var(--card2); border:1px solid var(--b);
  border-radius:var(--r); padding:10px 15px;
  font-size:12.5px; font-weight:500;
  display:flex; align-items:center; gap:8px;
  animation:tin .18s ease; box-shadow:0 8px 24px rgba(0,0,0,.55);
  border-left:2px solid var(--green); color:var(--t1);
}
`;

/* ─── DATA ──────────────────────────────────────────────────────────────────── */
const INIT_CLIENTS = [
  {
    id:1, name:"Max Hill", initials:"MH", bg:"#1c1028",
    tags:["Regular"],
    status:"at-risk", score:24, trend:"down",
    lastVisit:"8d ago", lvDays:8, vpw:0.8, completion:0,
    lastMsg:"12d ago", lastAct:"8 days ago",
    booked:false, streak:0, total:6,
    phone:"+44 7700 900001", email:"max.hill@example.com",
    flags:["no-visit","declining","low-workout"],
    notes:"Showed strong commitment in first 6 weeks. Drop-off coincides with job change.",
    insights:[
      {lv:"ic",title:"No visit in 8 days",body:"Longest gap in 3 months — serious lapse risk.",cta:"Book a session now"},
      {lv:"ic",title:"Workout completion 0%",body:"Last 3 assigned workouts uncompleted.",cta:"Simplify programme"},
      {lv:"iw",title:"No contact in 12 days",body:"Client may feel neglected without recent outreach.",cta:"Send check-in message"},
    ],
    timeline:[
      {tp:"m",lb:"Missed booked session",tm:"2 days ago"},
      {tp:"m",lb:"Missed booked session",tm:"5 days ago"},
      {tp:"v",lb:"Gym visit",tm:"8 days ago"},
      {tp:"w",lb:"Workout not completed",tm:"9 days ago"},
      {tp:"msg",lb:"Coach sent message",tm:"12 days ago"},
      {tp:"v",lb:"Gym visit",tm:"15 days ago"},
    ],
  },
  {
    id:2, name:"Priya Sharma", initials:"PS", bg:"#0d2018",
    tags:["Regular","New"],
    status:"needs-attention", score:50, trend:"flat",
    lastVisit:"4d ago", lvDays:4, vpw:1.0, completion:40,
    lastMsg:"5d ago", lastAct:"4 days ago",
    booked:false, streak:1, total:8,
    phone:"+44 7700 900002", email:"priya.sharma@example.com",
    flags:["not-booked"],
    notes:"Joined referral from Emma. Interested in weight management programme.",
    insights:[
      {lv:"iw",title:"No session booked this week",body:"No upcoming sessions in the schedule.",cta:"Suggest available slots"},
      {lv:"iw",title:"Visit frequency below target",body:"Averaging 1.0/wk vs 2.0/wk goal.",cta:"Review schedule barriers"},
    ],
    timeline:[
      {tp:"v",lb:"Gym visit",tm:"4 days ago"},
      {tp:"w",lb:"Workout partially completed",tm:"4 days ago"},
      {tp:"msg",lb:"Client sent message",tm:"5 days ago"},
      {tp:"v",lb:"Gym visit",tm:"11 days ago"},
    ],
  },
  {
    id:3, name:"Jordan Blake", initials:"JB", bg:"#10102a",
    tags:["Regular","New"],
    status:"needs-attention", score:61, trend:"down",
    lastVisit:"4d ago", lvDays:4, vpw:3.8, completion:0,
    lastMsg:"3d ago", lastAct:"3 days ago",
    booked:true, streak:4, total:22,
    phone:"+44 7700 900003", email:"jordan.blake@example.com",
    flags:["low-workout"],
    notes:"High attendance but not engaging with assigned workouts. May need in-person guidance.",
    insights:[
      {lv:"iw",title:"Workouts not being completed",body:"High attendance but 0% workout completion.",cta:"Check workout difficulty"},
      {lv:"ii",title:"Attendance is above average",body:"3.8 visits/wk — capitalise with a progressive plan.",cta:"Assign new programme"},
    ],
    timeline:[
      {tp:"v",lb:"Gym visit",tm:"4 days ago"},
      {tp:"w",lb:"Workout not completed",tm:"4 days ago"},
      {tp:"msg",lb:"Coach sent message",tm:"3 days ago"},
      {tp:"v",lb:"Gym visit",tm:"5 days ago"},
      {tp:"v",lb:"Gym visit",tm:"6 days ago"},
    ],
  },
  {
    id:4, name:"Matthew Mottershead", initials:"MM", bg:"#0a1624",
    tags:["Regular"],
    status:"healthy", score:83, trend:"up",
    lastVisit:"3d ago", lvDays:3, vpw:1.3, completion:75,
    lastMsg:"1d ago", lastAct:"1 day ago",
    booked:true, streak:3, total:18,
    phone:"+44 7700 900004", email:"m.mottershead@example.com",
    flags:[],
    notes:"Consistent and self-motivated. Approaching target weight — discuss next phase.",
    insights:[
      {lv:"ii",title:"Consistent engagement",body:"Steady visits and strong completion rate.",cta:"Plan next progression phase"},
    ],
    timeline:[
      {tp:"msg",lb:"Client replied",tm:"1 day ago"},
      {tp:"v",lb:"Gym visit",tm:"3 days ago"},
      {tp:"w",lb:"Workout completed",tm:"3 days ago"},
      {tp:"msg",lb:"Coach sent message",tm:"2 days ago"},
      {tp:"v",lb:"Gym visit",tm:"7 days ago"},
    ],
  },
];

const FILTERS = [
  {id:"all",      label:"All Clients",      cls:"",   fn:()=>true},
  {id:"at-risk",  label:"At Risk",          cls:"rt", fn:c=>c.status==="at-risk"},
  {id:"not-booked",label:"Not Booked",      cls:"at", fn:c=>!c.booked},
  {id:"low-eng",  label:"Low Engagement",   cls:"at", fn:c=>c.completion<50},
  {id:"inactive", label:"Recently Inactive",cls:"",   fn:c=>c.lvDays>=5},
  null,
  {id:"new",    label:"New",    cls:"", fn:c=>c.tags.includes("New")},
  {id:"vip",    label:"VIP",    cls:"", fn:c=>c.tags.includes("VIP")},
  {id:"active", label:"Active", cls:"", fn:c=>c.status==="healthy"},
  {id:"lapsed", label:"Lapsed", cls:"", fn:c=>c.tags.includes("Lapsed")},
];

/* ─── HELPERS ───────────────────────────────────────────────────────────────── */
const statusLabel  = s => s==="at-risk"?"At Risk":s==="needs-attention"?"Needs Attention":"Healthy";
const scoreBadge   = s => s==="at-risk"?"sbr":s==="needs-attention"?"sba":"sbg";
const dotCls       = s => s==="at-risk"?"sdr":s==="needs-attention"?"sda":"sdg";
const scoreColor   = s => s==="at-risk"?"var(--red)":s==="needs-attention"?"var(--amber)":"var(--green)";
const tlDotCls     = t => ({v:"tlv",m:"tlm",msg:"tlmsg",w:"tlw"}[t]||"tlv");

function Trend({t}){
  if(t==="up")   return <span className="tup">↑ Improving</span>;
  if(t==="down") return <span className="tdn">↓ Declining</span>;
  return <span className="tfl">— Stable</span>;
}

function InsIco({lv}){
  const c=lv==="ic"?"var(--red)":lv==="iw"?"var(--amber)":"var(--blue)";
  const s=lv==="ic"?"⚠":lv==="iw"?"◉":"ℹ";
  return <span style={{color:c,fontSize:11,flexShrink:0,marginTop:1}}>{s}</span>;
}

function FlagChips({flags}){
  const map={
    "no-visit":{l:"No visit",c:"flr"},
    "declining":{l:"Declining",c:"fla"},
    "low-workout":{l:"Low workout",c:"fla"},
    "not-booked":{l:"Not booked",c:"flg"},
  };
  if(!flags?.length) return null;
  return(
    <div className="flags">
      {flags.map(f=>map[f]?<span key={f} className={`fl ${map[f].c}`}>{map[f].l}</span>:null)}
    </div>
  );
}

/* ─── TOAST ─────────────────────────────────────────────────────────────────── */
function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2600);return()=>clearTimeout(t)},[onDone]);
  return <div className="toast">✓ {msg}</div>;
}

/* ─── MODALS ─────────────────────────────────────────────────────────────────── */
function MessageModal({client,onClose,onSend}){
  const [msg,setMsg]=useState(`Hi ${client.name.split(" ")[0]}, just checking in — how are you getting on?`);
  return(
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mhdr">
          <h3>Send Message — {client.name}</h3>
          <div className="mcls" onClick={onClose}>✕</div>
        </div>
        <div className="mbody">
          <div className="mfld">
            <label>To</label>
            <input readOnly value={`${client.name} · ${client.email}`}/>
          </div>
          <div className="mfld">
            <label>Message</label>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)}/>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn btn-gh btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-pr" onClick={()=>{onSend(`Message sent to ${client.name}`);onClose();}}>Send Message</button>
        </div>
      </div>
    </div>
  );
}

function BookModal({client,onClose,onSend}){
  const [date,setDate]=useState("");
  const [time,setTime]=useState("09:00");
  const [type,setType]=useState("1-to-1 Session");
  return(
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mhdr">
          <h3>Book Session — {client.name}</h3>
          <div className="mcls" onClick={onClose}>✕</div>
        </div>
        <div className="mbody">
          <div className="mfld">
            <label>Session Type</label>
            <select value={type} onChange={e=>setType(e.target.value)}>
              <option>1-to-1 Session</option>
              <option>Group Class</option>
              <option>Online Check-in</option>
              <option>Assessment</option>
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div className="mfld">
              <label>Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </div>
            <div className="mfld">
              <label>Time</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)}/>
            </div>
          </div>
          <div className="mfld">
            <label>Notes (optional)</label>
            <textarea placeholder="Focus areas or goals for this session..."/>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn btn-gh btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-pr" onClick={()=>{
            if(!date){alert("Please select a date");return;}
            onSend(`Session booked for ${client.name}`);onClose();
          }}>Confirm Booking</button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({client,onClose,onSend}){
  const [prog,setProg]=useState("Strength Foundation");
  const [note,setNote]=useState("");
  const progs=["Strength Foundation","Fat Loss Phase 1","Hypertrophy Block","Cardio Endurance","Flexibility & Mobility","Custom Programme"];
  return(
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mhdr">
          <h3>Assign Workout — {client.name}</h3>
          <div className="mcls" onClick={onClose}>✕</div>
        </div>
        <div className="mbody">
          <div className="mfld">
            <label>Programme</label>
            <select value={prog} onChange={e=>setProg(e.target.value)}>
              {progs.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="mfld">
            <label>Coach Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add guidance or context for this assignment..."/>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn btn-gh btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-pr" onClick={()=>{onSend(`"${prog}" assigned to ${client.name}`);onClose();}}>Assign</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  {id:"today",    label:"Today",    icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>},
  {id:"clients",  label:"Clients",  icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1.5 13.5a4.5 4.5 0 019 0"/><circle cx="12" cy="6" r="2"/><path d="M14.5 13a3.5 3.5 0 00-5 0"/></svg>},
  {id:"schedule", label:"Schedule", icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 7h12M5 2v2M11 2v2"/></svg>},
  {id:"content",  label:"Content",  icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg>},
  {id:"profile",  label:"Profile",  icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 13.5a5.5 5.5 0 0111 0"/></svg>},
];

function Sidebar({onNewClient}){
  return(
    <div className="sb">
      <div className="sb-top">
        <div className="sb-ico">F</div>
        <div>
          <div className="sb-gname">Foundry Gym</div>
          <div className="sb-grole">Coach</div>
        </div>
      </div>
      <div className="sb-nav">
        <div className="sb-lbl">Navigation</div>
        {NAV_ITEMS.map(n=>(
          <div key={n.id} className={`sb-item${n.id==="clients"?" on":""}`}>
            {n.icon}
            {n.label}
          </div>
        ))}
      </div>
      <div className="sb-foot">
        <button className="sb-new" onClick={onNewClient}>+ New Client</button>
        <div style={{height:6}}/>
        <div className="sb-link">⊞ View Gym Page</div>
        <div className="sb-link">⊟ Member View</div>
        <div className="sb-link out">↩ Log Out</div>
      </div>
    </div>
  );
}

/* ─── DETAIL PANEL ───────────────────────────────────────────────────────────── */
function DetailPanel({client,onClose,onMsg,onBook,onAssign}){
  if(!client) return(
    <div className="panel">
      <div className="pempty">
        <div className="ei">⊡</div>
        <h4>No client selected</h4>
        <p>Click any client row to view their full profile, insights and engagement history.</p>
      </div>
    </div>
  );
  const sc=scoreColor(client.status);
  const compColor=client.completion>60?"var(--green)":client.completion>25?"var(--amber)":"var(--red)";
  return(
    <div className="panel">
      <div className="pan">
        <div className="ph">
          <div className="ph-top">
            <div className="phav" style={{background:client.bg}}>{client.initials}</div>
            <div style={{flex:1}}>
              <div className="pname">{client.name}</div>
              <div className="psub">
                <span className={`sd ${dotCls(client.status)}`}/>
                <span>{statusLabel(client.status)}</span>
                <span style={{color:"var(--t4)"}}>·</span>
                <Trend t={client.trend}/>
              </div>
            </div>
            <div className="pclose" onClick={onClose}>✕</div>
          </div>
          <div className="qas">
            <button className="qa qp" onClick={()=>onMsg(client)}>✉ Message</button>
            <button className="qa qbook" onClick={()=>onBook(client)}>📅 Book</button>
            <button className="qa" onClick={()=>onAssign(client)}>⊕ Assign</button>
          </div>
        </div>

        <div className="pb">
          {/* Retention score */}
          <div className="psec">
            <div className="pst">Retention Score</div>
            <div className="sbc">
              <div className="sbt">
                <span className="sbl">Overall health</span>
                <span className="sbv" style={{color:sc}}>{client.score}</span>
              </div>
              <div className="sbtr">
                <div className="sbf" style={{width:`${client.score}%`,background:`linear-gradient(90deg,${sc},${sc}88)`}}/>
              </div>
              <div className="sblb"><span>At Risk</span><span>Healthy</span></div>
            </div>
          </div>

          {/* Last interaction */}
          <div className="psec">
            <div className="pst">Last Interaction</div>
            <div className="lintb">
              <div className="lirow">
                <div className="lilbl">Last message</div>
                <div className="lival">{client.lastMsg}</div>
              </div>
              <div className="lidiv"/>
              <div className="lirow">
                <div className="lilbl">Last activity</div>
                <div className="lival">{client.lastAct}</div>
              </div>
              <div className="lidiv"/>
              <div className="lirow">
                <div className="lilbl">Next session</div>
                <div className={`lival ${client.booked?"mcg":"mcr"}`}>{client.booked?"Booked ✓":"Not booked"}</div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="psec">
            <div className="pst">Key Metrics</div>
            <div className="mg">
              <div className="mc"><div className="mcl">Last Visit</div><div className="mcv mcsm">{client.lastVisit}</div></div>
              <div className="mc"><div className="mcl">Visits / Week</div><div className="mcv">{client.vpw}</div><div className="mcs">avg this month</div></div>
              <div className="mc"><div className="mcl">Completion</div><div className="mcv" style={{color:compColor}}>{client.completion}%</div></div>
              <div className="mc"><div className="mcl">Streak</div><div className="mcv">{client.streak}<span style={{fontSize:11,fontFamily:"'DM Sans',sans-serif",color:"var(--t3)"}}> wk</span></div></div>
              <div className="mc"><div className="mcl">Total Visits</div><div className="mcv">{client.total}</div></div>
              <div className="mc">
                <div className="mcl">Contact</div>
                <div className="mcv mcsm" style={{cursor:"pointer",color:"var(--blue)"}} onClick={()=>onMsg(client)}>Message ↗</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes&&(
            <div className="psec">
              <div className="pst">Coach Notes</div>
              <div className="notes-box">{client.notes}</div>
            </div>
          )}

          {/* Insights */}
          <div className="psec">
            <div className="pst">Insights</div>
            {client.insights.map((ins,i)=>(
              <div key={i} className={`ins ${ins.lv}`}>
                <div className="insh">
                  <div className="inst">{ins.title}</div>
                  <InsIco lv={ins.lv}/>
                </div>
                <div className="insb">{ins.body}</div>
                <div className="insct">→ {ins.cta}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="psec">
            <div className="pst">Recent Activity</div>
            {client.timeline.map((tl,i)=>(
              <div key={i} className="tli">
                <span className={`tld ${tlDotCls(tl.tp)}`}/>
                <div>
                  <div className="tllb">{tl.lb}</div>
                  <div className="tlt">{tl.tm}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CLIENT ROW ─────────────────────────────────────────────────────────────── */
function ClientRow({client,selected,onClick,onMsg,onBook}){
  return(
    <div className={`crow ${client.status}${selected?" sel":""}`} onClick={onClick}>
      <div className="cav" style={{background:client.bg,color:"rgba(255,255,255,0.85)",fontSize:12,fontWeight:700}}>
        {client.initials}
      </div>
      <div className="ci">
        <div className="cnr">
          <span className="cn">{client.name}</span>
          {client.tags.map(t=>(
            <span key={t} className={`tag ${t==="New"?"tnew":t==="VIP"?"tvip":"treg"}`}>{t}</span>
          ))}
        </div>
        <div className="cm">
          <div className="mi">
            <span className={`sd ${dotCls(client.status)}`}/>
            <span>{client.lastVisit}</span>
          </div>
          <div className="mi">{client.vpw}/wk avg</div>
          <div className="mi">{client.completion}% completion</div>
          <Trend t={client.trend}/>
        </div>
        <FlagChips flags={client.flags}/>
      </div>
      <div className="cr">
        <div className={`score-badge ${scoreBadge(client.status)}`}>{client.score}</div>
        <div className="ract" title="Message" onClick={e=>{e.stopPropagation();onMsg(client);}}>✉</div>
        <div className="ract" title="Book session" onClick={e=>{e.stopPropagation();onBook(client);}}>📅</div>
        <span className="chev">›</span>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────────── */
export default function ClientsPage(){
  const [clients]                  = useState(INIT_CLIENTS);
  const [activeF,setActiveF]       = useState("all");
  const [selId,setSelId]           = useState(null);
  const [search,setSearch]         = useState("");
  const [sort,setSort]             = useState("priority");
  const [viewMode,setViewMode]     = useState("list");
  const [modal,setModal]           = useState(null);
  const [toast,setToast]           = useState(null);

  const showToast  = msg => setToast(msg);
  const selClient  = clients.find(c=>c.id===selId)||null;

  const counts = {};
  FILTERS.forEach(f=>{ if(f) counts[f.id]=clients.filter(f.fn).length; });

  const sorted = useMemo(()=>{
    const fn=FILTERS.find(f=>f&&f.id===activeF)?.fn||(()=>true);
    let list=clients.filter(fn);
    if(search) list=list.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
    const pri={"at-risk":0,"needs-attention":1,"healthy":2};
    if(sort==="priority")   return [...list].sort((a,b)=>pri[a.status]-pri[b.status]);
    if(sort==="score-asc")  return [...list].sort((a,b)=>a.score-b.score);
    if(sort==="score-desc") return [...list].sort((a,b)=>b.score-a.score);
    if(sort==="last-visit") return [...list].sort((a,b)=>a.lvDays-b.lvDays);
    if(sort==="name")       return [...list].sort((a,b)=>a.name.localeCompare(b.name));
    return list;
  },[clients,activeF,search,sort]);

  const groups = sort==="priority"
    ?[
      {key:"at-risk",        label:"At Risk",         cls:"r", rows:sorted.filter(c=>c.status==="at-risk")},
      {key:"needs-attention",label:"Needs Attention",  cls:"a", rows:sorted.filter(c=>c.status==="needs-attention")},
      {key:"healthy",        label:"Healthy",          cls:"g", rows:sorted.filter(c=>c.status==="healthy")},
    ].filter(g=>g.rows.length)
    :[{key:"all",label:null,rows:sorted}];

  const atRisk           = clients.filter(c=>c.status==="at-risk").length;
  const attention        = clients.filter(c=>c.status==="needs-attention").length;
  const activeThisMonth  = clients.filter(c=>c.lvDays<=30).length;
  const notBooked        = clients.filter(c=>!c.booked).length;

  const openMsg    = c => setModal({type:"msg",client:c});
  const openBook   = c => setModal({type:"book",client:c});
  const openAssign = c => setModal({type:"assign",client:c});

  return(
    <>
      <style>{S}</style>
      <div className="app">
        <Sidebar onNewClient={()=>showToast("New client flow opened")}/>

        <div className="main">

          {/* ── KPI BAR ── */}
          <div className="kpi-bar">
            <div className="kpi">
              <div className="kpi-lbl">Total Clients</div>
              <div className="kpi-val">{clients.length}</div>
              <div className="kpi-sub">assigned to you</div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Active This Month</div>
              <div className="kpi-val">{activeThisMonth}</div>
              <div className="kpi-sub">visited at least once</div>
            </div>
            <div className="kpi clickable" onClick={()=>setActiveF("at-risk")}>
              <div className="kpi-lbl">At Risk</div>
              <div className="kpi-val">{atRisk}</div>
              <div className="kpi-sub">
                <span className="kpi-dot" style={{background:"var(--red)"}}/>
                need immediate action
              </div>
            </div>
            <div className="kpi clickable" onClick={()=>setActiveF("not-booked")}>
              <div className="kpi-lbl">Not Booked</div>
              <div className="kpi-val">{notBooked}</div>
              <div className="kpi-sub">
                <span className="kpi-dot" style={{background:"var(--amber)"}}/>
                no upcoming session
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-lbl">Avg No-Show Rate</div>
              <div className="kpi-val">0%</div>
              <div className="kpi-sub">last 30 days</div>
            </div>
          </div>

          {/* ── HEADER ── */}
          <div className="hdr">
            <div className="hdr-l">
              <h1>Clients</h1>
              <p>{clients.length} clients · Foundry Gym</p>
            </div>
            <div className="hdr-r">
              <button className="btn btn-gh">⊞ Scan QR</button>
              <div className="iBtn" title="Messages">✉</div>
              <div className="avatar-chip">M</div>
            </div>
          </div>

          {/* ── FILTER BAR ── */}
          <div className="fbar">
            {FILTERS.map((f,i)=>
              f===null
                ?<div key={`d${i}`} className="fdiv"/>
                :<div key={f.id} className={`ft ${f.cls} ${activeF===f.id?"on":""}`} onClick={()=>setActiveF(f.id)}>
                  {f.label}<span className="n">{counts[f.id]}</span>
                </div>
            )}
          </div>

          {/* ── TOOLBAR ── */}
          <div className="tb">
            <div className="sw">
              <span className="si">⊙</span>
              <input
                className="sinp"
                placeholder="Search clients..."
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
              {!search && <span className="kbd">/</span>}
            </div>
            <select className="ssel" value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="priority">Sort: Priority</option>
              <option value="score-asc">Score: Low → High</option>
              <option value="score-desc">Score: High → Low</option>
              <option value="last-visit">Last Visit</option>
              <option value="name">Name A–Z</option>
            </select>
            <div className="tb-r">
              <div className="tgl">
                <button className={`tgl-btn${viewMode==="list"?" on":""}`} onClick={()=>setViewMode("list")}>☰ List</button>
                <button className={`tgl-btn${viewMode==="grid"?" on":""}`} onClick={()=>setViewMode("grid")}>⊞ Grid</button>
              </div>
              <button className="btn btn-gh btn-sm">⊟ Bulk</button>
              <button className="btn btn-gh btn-sm">↓ Export</button>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="body-split">
            <div className="clist">
              {groups.map(g=>(
                <div key={g.key}>
                  {g.label&&<div className={`ghdr ${g.cls}`}>● {g.label}</div>}
                  {g.rows.map(c=>(
                    <ClientRow
                      key={c.id}
                      client={c}
                      selected={selId===c.id}
                      onClick={()=>setSelId(selId===c.id?null:c.id)}
                      onMsg={openMsg}
                      onBook={openBook}
                    />
                  ))}
                </div>
              ))}
              {sorted.length===0&&(
                <div className="empty-list">
                  <div style={{fontSize:20,opacity:.2,marginBottom:8}}>⊡</div>
                  No clients match the current filter.
                </div>
              )}
            </div>

            <DetailPanel
              client={selClient}
              onClose={()=>setSelId(null)}
              onMsg={openMsg}
              onBook={openBook}
              onAssign={openAssign}
            />
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {modal?.type==="msg"    && <MessageModal client={modal.client} onClose={()=>setModal(null)} onSend={showToast}/>}
      {modal?.type==="book"   && <BookModal    client={modal.client} onClose={()=>setModal(null)} onSend={showToast}/>}
      {modal?.type==="assign" && <AssignModal  client={modal.client} onClose={()=>setModal(null)} onSend={showToast}/>}

      {/* ── TOAST ── */}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </>
  );
}
