import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
// TAX YEAR DATA — all 4 years
// ═══════════════════════════════════════════════════════════════════
const TY = {
  "2023/24": { label:"Last year",    pa:12570, basic:37700, niPT:12570, niUEL:50270, niMain:0.10, niUp:0.02, stdAA:40000, tapThr:200000, tapAdj:260000, minAA:10000, cLow:0.19, cHigh:0.25, cLL:50000, cHL:250000, divA:1000,  dB:0.0875, dH:0.3375, penRates:[[13259,.051],[26831,.065],[32691,.083],[49078,.093],[62924,.1268],[Infinity,.1265]], empR:0.2068 },
  "2024/25": { label:"Current year", pa:12570, basic:37700, niPT:12570, niUEL:50270, niMain:0.08, niUp:0.02, stdAA:60000, tapThr:200000, tapAdj:260000, minAA:10000, cLow:0.19, cHigh:0.25, cLL:50000, cHL:250000, divA:500,   dB:0.0875, dH:0.3375, penRates:[[13259,.051],[26831,.065],[32691,.083],[49078,.093],[62924,.1268],[Infinity,.1265]], empR:0.2068 },
  "2025/26": { label:"Next year",    pa:12570, basic:37700, niPT:12570, niUEL:50270, niMain:0.08, niUp:0.02, stdAA:60000, tapThr:200000, tapAdj:260000, minAA:10000, cLow:0.19, cHigh:0.25, cLL:50000, cHL:250000, divA:500,   dB:0.0875, dH:0.3375, penRates:[[13259,.051],[26831,.065],[32691,.083],[49078,.093],[62924,.1268],[Infinity,.1265]], empR:0.2068 },
  "2026/27": { label:"Future",       pa:12570, basic:37700, niPT:12570, niUEL:50270, niMain:0.08, niUp:0.02, stdAA:60000, tapThr:200000, tapAdj:260000, minAA:10000, cLow:0.19, cHigh:0.25, cLL:50000, cHL:250000, divA:500,   dB:0.0875, dH:0.3375, penRates:[[13259,.051],[26831,.065],[32691,.083],[49078,.093],[62924,.1268],[Infinity,.1265]], empR:0.2068 },
};
const TY_KEYS = Object.keys(TY);

// ═══════════════════════════════════════════════════════════════════
// CORE MATHS
// ═══════════════════════════════════════════════════════════════════
const incomeTax = (gross, scot, ty) => {
  const r = TY[ty];
  const pa = gross > 125140 ? 0 : gross > 100000 ? r.pa - Math.min((gross-100000)/2, r.pa) : r.pa;
  const t = Math.max(0, gross - pa);
  if (scot) {
    let tax=0, rem=t;
    for (const [w,rt] of [[2306,.19],[13991,.20],[31092,.21],[62430,.42],[Infinity,.47]]) { const c=Math.min(rem,w); tax+=c*rt; rem-=c; if(rem<=0) break; }
    return Math.max(0,tax);
  }
  if (t<=r.basic) return t*.20;
  if (t<=125140)  return r.basic*.20+(t-r.basic)*.40;
  return r.basic*.20+(125140-r.basic)*.40+(t-125140)*.45;
};

const calcNI   = (s,ty) => { const r=TY[ty]; if(s<=r.niPT)return 0; if(s<=r.niUEL)return(s-r.niPT)*r.niMain; return(r.niUEL-r.niPT)*r.niMain+(s-r.niUEL)*r.niUp; };
const calcPen  = (p,ty) => { for(const[lim,rate] of TY[ty].penRates) if(p<=lim) return p*rate; return p*TY[ty].penRates.at(-1)[1]; };
const calcPIA  = (cur,prev) => { const p=prev||cur; return Math.max(0,((p/54)+(cur/54))*16-(p/54)*16*1.031); };
const tapAA    = (adj,thr,ty) => { const r=TY[ty]; if(thr<=r.tapThr||adj<=r.tapAdj) return r.stdAA; return Math.max(r.minAA,r.stdAA-(adj-r.tapAdj)/2); };

const corpTax = (profit, ty) => {
  const r=TY[ty]; if(profit<=0) return 0;
  if(profit<=r.cLL) return profit*r.cLow;
  if(profit<=r.cHL) { const mr=((r.cHL-profit)/(r.cHL-r.cLL))*(r.cHigh-r.cLow); return profit*(r.cHigh-mr); }
  return profit*r.cHigh;
};

const divTax = (div, otherGross, ty) => {
  const r=TY[ty];
  const taxable = Math.max(0, div - r.divA);
  const basicLeft = Math.max(0, r.pa + r.basic - otherGross);
  const inB = Math.min(taxable, basicLeft);
  const inH = Math.max(0, taxable - basicLeft);
  return inB*r.dB + inH*r.dH;
};

// Director loan benefit-in-kind: official rate × loan balance (2024/25 rate 2.25%)
const dirLoanBIK = (balance) => balance * 0.0225;

// Retained profit waterfall: how much cash can be extracted in future at what rate
const retainedProfitAnalysis = (retained, futureGross, ty) => {
  const r = TY[ty];
  const basicAvail = Math.max(0, r.pa + r.basic - futureGross);
  const inBasic = Math.min(retained, basicAvail);
  const inHigher = Math.max(0, retained - basicAvail);
  const taxOnExtract = inBasic*r.dB + inHigher*r.dH;
  return { basicAvail, inBasic, inHigher, taxOnExtract, netAfterTax: retained - taxOnExtract };
};

// ═══════════════════════════════════════════════════════════════════
// FULL FAMILY LTD CO OPTIMISER
// ═══════════════════════════════════════════════════════════════════
const optimise = (grossProfit, members, companyPensionAmount, retainFraction, ty) => {
  const r = TY[ty];
  const principal = members[0] || { otherIncome: 0 };
  const spouse    = members[1];
  const children  = members.slice(2);
  const strategies = [];

  const run = (name, desc, salaries, dividends, pension, retain) => {
    // salaries: [{person, amount}], dividends: [{person, otherIncome, amount}]
    let totalSal = salaries.reduce((s,x)=>s+x.amount,0);
    let effectiveProfit = grossProfit - totalSal - pension;
    let ct = corpTax(Math.max(0,effectiveProfit), ty);
    let netForDividend = Math.max(0, effectiveProfit - ct) * (1 - retain);
    let retained = Math.max(0, effectiveProfit - ct) * retain;
    let totalDivAlloc = dividends.reduce((s,x)=>s+x.pct,0);
    let personalTax = 0;
    let divDetails = [];
    for (const d of dividends) {
      const amt = netForDividend * (d.pct / 100);
      const dt = divTax(amt, d.otherIncome, ty);
      personalTax += dt;
      divDetails.push({ name: d.name, amount: amt, tax: dt });
    }
    // Salary NI employer (simplified — directors pay class 1 above secondary threshold £9100)
    const empNI = salaries.reduce((s,x)=>s+Math.max(0,x.amount-9100)*0.138, 0);
    const total = ct + personalTax + empNI;
    strategies.push({ name, desc, total, ct, personalTax, empNI, retained, pension, divDetails, salaries, effectiveProfit });
  };

  // 1. Director only — salary + all dividends
  run("Director salary + full dividends",
    `Director pays self ${fmt(r.pa)} salary, takes all post-corp-tax profit as dividends. Simplest structure.`,
    [{name:"Director",amount:r.pa}],
    [{name:"Director",pct:100,otherIncome:principal.otherIncome}], 0, 0);

  // 2. Retain 20%
  run("Director salary + 20% retained",
    "Director takes salary + 80% of available profit as dividends, retains 20% in company for future flexibility.",
    [{name:"Director",amount:r.pa}],
    [{name:"Director",pct:100,otherIncome:principal.otherIncome}], 0, 0.20);

  // 3. Spouse 50/50 split (if spouse present)
  if (spouse) {
    run("50/50 dividend split with spouse",
      `Director salary ${fmt(r.pa)}, post-corp-tax profit split 50/50 as dividends. Requires spouse to hold ordinary shares. HMRC settlements legislation applies — get advice.`,
      [{name:"Director",amount:r.pa}],
      [{name:"Director",pct:50,otherIncome:principal.otherIncome},{name:spouse.name||"Spouse",pct:50,otherIncome:spouse.otherIncome}], 0, 0);

    // 4. Salary to spouse + split
    const spouseEffective = Math.min(r.pa, 12570);
    run("Salary to both + 60/40 dividend split",
      `Director and spouse each paid salary up to personal allowance. Post-corp-tax profit split 60/40. Spouse must have genuine role. Dividend split should reflect shareholding.`,
      [{name:"Director",amount:r.pa},{name:spouse.name||"Spouse",amount:spouseEffective}],
      [{name:"Director",pct:60,otherIncome:principal.otherIncome},{name:spouse.name||"Spouse",pct:40,otherIncome:spouse.otherIncome}], 0, 0);

    // 5. Alphabet shares: give spouse higher-rate dividend shares
    run("Director + spouse equal shares + 10% retain",
      "Equal share split, retain 10% for working capital / future extraction at lower rate (e.g. retirement). Reduces immediate personal tax on director.",
      [{name:"Director",amount:r.pa}],
      [{name:"Director",pct:50,otherIncome:principal.otherIncome},{name:spouse.name||"Spouse",pct:50,otherIncome:spouse.otherIncome}], 0, 0.10);
  }

  // 6. Children dividends (if children added and hold shares)
  if (children.length > 0 && spouse) {
    const childPct = Math.min(10, Math.floor(30 / children.length));
    const spousePct = 20;
    const dirPct = 100 - spousePct - childPct * children.length;
    const childDivs = children.map(c=>({name:c.name||"Child",pct:childPct,otherIncome:c.otherIncome}));
    run(`Multi-generation split (dir ${dirPct}% / spouse ${spousePct}% / children ${childPct}% each)`,
      `CAUTION: Dividend income to minor children (under 18) from a parent's company is taxed at the parent's rate under the 'settlements legislation' — this only works for adult children (18+) with genuine shareholdings. Take specialist legal advice.`,
      [{name:"Director",amount:r.pa}],
      [{name:"Director",pct:dirPct,otherIncome:principal.otherIncome},{name:spouse.name||"Spouse",pct:spousePct,otherIncome:spouse.otherIncome},...childDivs], 0, 0);
  }

  // 7. Company pension contribution
  const pensionAmt = companyPensionAmount > 0 ? companyPensionAmount : Math.min(grossProfit*0.15, 60000);
  run("Salary + company pension contribution + dividends",
    `Company contributes ${fmt(pensionAmt)} to director SIPP/pension as employer contribution (fully deductible, reduces corp tax AND director's adjusted income for AA purposes). Remaining paid as dividends.`,
    [{name:"Director",amount:r.pa}],
    [{name:"Director",pct:100,otherIncome:principal.otherIncome}], pensionAmt, 0);

  // 8. Pension + spouse split
  if (spouse) {
    run("Pension + spouse split + 10% retain",
      `Combines company pension contribution (${fmt(pensionAmt)}), 50/50 dividend split with spouse, and 10% profit retention. Most tax-efficient for high earners with AA concerns.`,
      [{name:"Director",amount:r.pa}],
      [{name:"Director",pct:50,otherIncome:principal.otherIncome},{name:spouse.name||"Spouse",pct:50,otherIncome:spouse.otherIncome}], pensionAmt, 0.10);
  }

  // 9. Maximum retention (wealth in company)
  run("Maximum retention — wealth building in company",
    "Director takes minimum salary only, no dividends. All profit retained in company taxed at corp rate only. Ideal if high personal income means dividends are taxed at 33.75%+. Extract in retirement at lower personal rates.",
    [{name:"Director",amount:r.pa}],
    [], 0, 1.0);

  return strategies.sort((a,b)=>a.total-b.total);
};

// ═══════════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════════
const fmt  = n => `£${Math.round(n).toLocaleString("en-GB")}`;
const fmtK = n => n>=1000 ? `£${(n/1000).toFixed(1)}k` : fmt(n);
const pct  = (n,d) => d ? `${((n/d)*100).toFixed(1)}%` : "—";
const MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const BANDS = {
  "Band 2 (Entry) — £24,465":24465,"Band 2 (Top) — £24,465":24465,
  "Band 3 (Entry) — £24,937":24937,"Band 3 (Top) — £26,598":26598,
  "Band 4 (Entry) — £27,485":27485,"Band 4 (Top) — £30,162":30162,
  "Band 5 (Entry) — £31,049":31049,"Band 5 (Mid) — £33,487":33487,"Band 5 (Top) — £37,796":37796,
  "Band 6 (Entry) — £38,682":38682,"Band 6 (Mid) — £40,823":40823,"Band 6 (Top) — £46,580":46580,
  "Band 7 (Entry) — £47,810":47810,"Band 7 (Mid) — £50,273":50273,"Band 7 (Top) — £54,710":54710,
  "Band 8a (Entry) — £55,690":55690,"Band 8a (Mid) — £58,487":58487,"Band 8a (Top) — £62,682":62682,
  "Band 8b (Entry) — £64,455":64455,"Band 8b (Mid) — £68,631":68631,"Band 8b (Top) — £74,896":74896,
  "Band 8c (Entry) — £76,965":76965,"Band 8c (Mid) — £81,652":81652,"Band 8c (Top) — £88,682":88682,
  "Band 8d (Entry) — £91,342":91342,"Band 8d (Mid) — £96,941":96941,"Band 8d (Top) — £105,337":105337,
  "Band 9 (Entry) — £109,179":109179,"Band 9 (Mid) — £115,763":115763,"Band 9 (Top) — £125,637":125637,
  "Foundation Year 1 (F1) — £32,398":32398,"Foundation Year 2 (F2) — £37,935":37935,
  "Specialty Registrar (StR) — £51,017":51017,
  "Consultant Threshold 1 — £105,504":105504,"Consultant Threshold 2 — £109,849":109849,
  "Consultant Threshold 3 — £114,003":114003,"Consultant Threshold 4 — £118,249":118249,
  "Consultant Threshold 5 — £122,494":122494,"Consultant Threshold 6 — £128,028":128028,
  "Consultant Threshold 7 — £133,620":133620,"Consultant Threshold 8 — £139,882":139882,
  "GP (Salaried) — £71,504":71504,"Other":0
};
const NCIA_LEVELS = {
  "Not applicable":0,"Level 1 — £20,000":20000,
  "Level 2 — £30,000":30000,"Level 3 — £40,000":40000
};

// ═══════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════
const IS = { width:"100%", padding:"11px 14px", background:"#0a1f14", border:"1px solid #1e3d28", borderRadius:8, color:"#e2f0e8", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

const PoundI = ({label,value,onChange,hint,small,required}) => (
  <div style={{marginBottom:small?9:17}}>
    <label style={{display:"block",fontSize:small?11:13,color:"#a0c4b0",marginBottom:4}}>{label}{required&&<span style={{color:"#f87171"}}> *</span>}</label>
    {hint&&<div style={{fontSize:10,color:"#4a6a5a",marginBottom:4,lineHeight:1.4}}>{hint}</div>}
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#38bdf8",fontWeight:700}}>£</span>
      <input type="number" min="0" value={value||""} placeholder="0" onChange={e=>onChange(parseFloat(e.target.value)||0)}
        style={{...IS,paddingLeft:26,padding:small?"8px 8px 8px 26px":"11px 11px 11px 26px",fontSize:small?12:14,fontFamily:"'Courier New',monospace"}}
        onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e3d28"}/>
    </div>
  </div>
);

const TxtI = ({label,value,onChange,placeholder}) => (
  <div style={{marginBottom:10}}>
    <label style={{display:"block",fontSize:11,color:"#a0c4b0",marginBottom:4}}>{label}</label>
    <input type="text" value={value} placeholder={placeholder||""} onChange={e=>onChange(e.target.value)}
      style={{...IS,fontSize:13}} onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e3d28"}/>
  </div>
);

const NumI = ({label,value,onChange,min=0,max=100,suffix="%",hint}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:4}}>{label}</label>
    {hint&&<div style={{fontSize:10,color:"#4a6a5a",marginBottom:4}}>{hint}</div>}
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(parseInt(e.target.value))}
        style={{flex:1,accentColor:"#38bdf8"}}/>
      <div style={{fontSize:16,fontWeight:700,color:"#38bdf8",fontFamily:"monospace",minWidth:50}}>{value}{suffix}</div>
    </div>
  </div>
);

const Tog = ({label,value,onChange,hint}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,padding:"10px 13px",background:"#0a1f14",borderRadius:8,border:"1px solid #1e3d28"}}>
    <div><div style={{fontSize:13,color:"#a0c4b0"}}>{label}</div>{hint&&<div style={{fontSize:10,color:"#4a6a5a",marginTop:2}}>{hint}</div>}</div>
    <button onClick={()=>onChange(!value)} style={{width:44,height:22,borderRadius:11,border:"none",cursor:"pointer",background:value?"#16a34a":"#1e3d28",position:"relative",transition:"background .2s",flexShrink:0,marginLeft:10}}>
      <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:value?24:3,transition:"left .2s"}}/>
    </button>
  </div>
);

const DC = ({label,value,sub,hi,warn,red,green}) => (
  <div style={{background:hi?"linear-gradient(135deg,#003366,#005eb8)":warn?"#1a0a00":red?"#1a0505":green?"#001a08":"#0a1f14",border:`1px solid ${hi?"#38bdf8":warn?"#f59e0b":red?"#ef4444":green?"#4ade80":"#1e3d28"}`,borderRadius:12,padding:"15px 17px",marginBottom:10}}>
    <div style={{fontSize:10,color:hi?"#93c5fd":warn?"#fcd34d":red?"#fca5a5":green?"#86efac":"#5a8a6a",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>
    <div style={{fontSize:typeof value==="number"&&value>9999?22:18,fontWeight:700,color:hi?"#38bdf8":warn?"#f59e0b":red?"#f87171":green?"#4ade80":"#4ade80",fontFamily:"'Courier New',monospace"}}>
      {typeof value==="number"?fmt(value):value}
    </div>
    {sub&&<div style={{fontSize:10,color:"#5a8a6a",marginTop:4,lineHeight:1.4}}>{sub}</div>}
  </div>
);

const IB = ({type,title,body}) => {
  const C={warning:{bg:"#1a1200",br:"#f59e0b",ic:"⚠️"},danger:{bg:"#1a0505",br:"#ef4444",ic:"🚨"},success:{bg:"#001a08",br:"#4ade80",ic:"✅"},info:{bg:"#001020",br:"#38bdf8",ic:"ℹ️"}}[type];
  return <div style={{background:C.bg,border:`1px solid ${C.br}`,borderRadius:10,padding:"12px 15px",marginBottom:11}}><div style={{fontSize:13,fontWeight:700,color:C.br,marginBottom:5}}>{C.ic} {title}</div><div style={{fontSize:12,color:"#9ab8a8",lineHeight:1.6}}>{body}</div></div>;
};

const ST = ({children,mt}) => <div style={{fontSize:10,fontWeight:700,color:"#38bdf8",textTransform:"uppercase",letterSpacing:2,marginBottom:11,marginTop:mt||18,paddingBottom:6,borderBottom:"1px solid #1e3d28"}}>{children}</div>;

const SBar = ({steps,cur}) => (
  <div style={{display:"flex",position:"relative",marginBottom:28}}>
    <div style={{position:"absolute",top:13,left:"3%",right:"3%",height:2,background:"#1e3d28"}}/>
    {steps.map((s,i)=>(
      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:i<cur?"#16a34a":i===cur?"#1d4ed8":"#0a1f14",border:`2px solid ${i===cur?"#38bdf8":i<cur?"#16a34a":"#1e3d28"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",boxShadow:i===cur?"0 0 10px rgba(56,189,248,.5)":"none"}}>{i<cur?"✓":i+1}</div>
        <div style={{fontSize:7.5,color:i===cur?"#38bdf8":"#5a8a6a",marginTop:3,textAlign:"center",lineHeight:1.2,maxWidth:55}}>{s}</div>
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// PRINT REPORT
// ═══════════════════════════════════════════════════════════════════
const printReport = (d,r) => {
  const w = window.open("","_blank");
  const yr = d.taxYear; const r2 = TY[yr];
  w.document.write(`<!DOCTYPE html><html><head><title>NHS Financial Report ${yr}</title>
  <style>body{font-family:Georgia,serif;color:#111;padding:32px;max-width:820px;margin:0 auto;font-size:12.5px;line-height:1.5}
  h1{color:#005eb8;border-bottom:3px solid #003d20;padding-bottom:8px;margin-bottom:3px}
  h2{color:#003d20;font-size:13.5px;margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:5px;text-transform:uppercase;letter-spacing:1px}
  .meta{color:#666;font-size:11px;margin-bottom:18px}.hero{background:linear-gradient(135deg,#e8f5e9,#e3f2fd);border:2px solid #005eb8;border-radius:10px;padding:18px;margin:10px 0;text-align:center}
  .hv{font-size:40px;font-weight:700;color:#003d20;font-family:monospace}.hs{font-size:16px;color:#005eb8;margin-top:3px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin:9px 0}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px;margin:9px 0}
  .box{background:#f5f9f6;border:1px solid #c8e6c9;border-radius:7px;padding:11px}.lbl{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:2px}
  .val{font-size:17px;font-weight:700;color:#003d20;font-family:monospace}table{width:100%;border-collapse:collapse;margin:9px 0;font-size:12px}
  td,th{padding:6px 9px;border:1px solid #ddd}th{background:#f0f4f0;font-weight:600}tr.tot{font-weight:700;background:#e8f5e9}
  .alert{border-radius:7px;padding:9px 13px;margin:9px 0;font-size:12px}.ok{background:#f0fdf4;border:1px solid #4ade80;color:#166534}
  .bad{background:#fff5f5;border:1px solid #ef4444;color:#991b1b}.warn{background:#fff8e1;border:1px solid #f59e0b;color:#92400e}
  .inf{background:#eff6ff;border:1px solid #93c5fd;color:#1e40af}
  .months{display:flex;flex-wrap:wrap;gap:4px;margin:7px 0}.mo{width:36px;height:44px;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;border:2px solid;gap:2px}
  .mo-ok{background:#f0fdf4;border-color:#4ade80;color:#166534}.mo-bad{background:#fff5f5;border-color:#fca5a5;color:#991b1b}.mo-warn{background:#fff8e1;border-color:#f59e0b;color:#92400e}
  .strat{border:1px solid #ddd;border-radius:7px;padding:11px;margin:7px 0}.strat-best{border-color:#4ade80;background:#f0fdf4}
  .disc{font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:11px;margin-top:26px;line-height:1.7}
  @media print{body{padding:16px}button{display:none}}</style></head><body>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:3px"><span style="font-size:34px">🏥</span><div><h1 style="border:none;padding:0;margin:0">NHS Financial Planner</h1></div></div>
  <div class="meta">Tax Year <strong>${yr}</strong> &nbsp;·&nbsp; ${d.isScotland?"Scotland":"England/Wales/NI"} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})} &nbsp;·&nbsp; <em>Guidance only — not advice</em></div>

  <h2>Take-Home Pay</h2>
  <div class="hero"><div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Estimated Annual Take-Home</div><div class="hv">${fmt(r.takeHome)}</div><div class="hs">${fmt(r.takeHome/12)} per month</div></div>
  <table><tr><th>Item</th><th>Annual</th><th>Monthly</th></tr>
  <tr><td>Gross Income</td><td>${fmt(r.gross)}</td><td>${fmt(r.gross/12)}</td></tr>
  <tr><td>Income Tax</td><td style="color:#c00">(${fmt(r.tax)})</td><td style="color:#c00">(${fmt(r.tax/12)})</td></tr>
  <tr><td>National Insurance</td><td style="color:#c00">(${fmt(r.ni)})</td><td style="color:#c00">(${fmt(r.ni/12)})</td></tr>
  <tr><td>NHS Pension</td><td style="color:#c00">(${fmt(r.pen)})</td><td style="color:#c00">(${fmt(r.pen/12)})</td></tr>
  ${r.preTax>0?`<tr><td>Pre-Tax Deductions</td><td style="color:#c00">(${fmt(r.preTax)})</td><td style="color:#c00">(${fmt(r.preTax/12)})</td></tr>`:""}
  <tr class="tot"><td>Take-Home</td><td>${fmt(r.takeHome)}</td><td>${fmt(r.takeHome/12)}</td></tr></table>

  <h2>Pension Annual Allowance</h2>
  <table><tr><th>Item</th><th>Amount</th></tr>
  <tr><td>Standard AA (${yr})</td><td>${fmt(r2.stdAA)}</td></tr>
  <tr><td>Your Tapered AA</td><td>${fmt(r.taperedAA)}</td></tr>
  <tr><td>Pension Input This Year</td><td>${fmt(r.penInput)}</td></tr>
  <tr><td>Carry Forward (3 years)</td><td>${fmt(r.totalCF)}</td></tr>
  <tr class="tot"><td>Effective Allowance</td><td>${fmt(r.effectiveAA)}</td></tr>
  <tr><td>AA Remaining (tapered)</td><td>${fmt(Math.max(0,r.taperedAA-r.penInput))}</td></tr></table>

  <div style="margin:7px 0 4px;font-size:11px;color:#555">Monthly accrual projection (${yr}):</div>
  <div class="months">${MONTHS.map((m,i)=>{const acc=(i+1)*r.penInput/12;const bad=acc>r.effectiveAA;const warn=acc>r.taperedAA;return`<div class="mo ${bad?"mo-bad":warn?"mo-warn":"mo-ok"}"><span>${m}</span><span style="font-size:8px">${fmtK(acc)}</span></div>`;}).join("")}</div>
  <div style="font-size:10px;color:#888;margin-bottom:8px">🟢 Within tapered AA &nbsp;·&nbsp; 🟡 Within carry-forward &nbsp;·&nbsp; 🔴 Breach</div>

  ${r.breach>0?`<div class="alert bad">🚨 Breach of ${fmt(r.breach)} — estimated AA charge ${fmt(r.aaCharge)}. Consider Scheme Pays. Seek specialist advice.</div>`:
  r.breachMonth?`<div class="alert warn">⚠️ Projected breach in <strong>${r.breachMonth}</strong>. We recommend seeking advice from a financial adviser or accountant before that month. Options: Scheme Pays · Opt out of NHS pension for remaining months · Reduce pensionable pay · Route income via Ltd Co.</div>`:
  `<div class="alert ok">✅ No AA breach projected. Headroom: ${fmt(Math.max(0,r.taperedAA-r.penInput))}.</div>`}

  ${r.strategies&&r.strategies.length?`
  <h2>Ltd Company Strategies (ranked, lowest tax first)</h2>
  <p style="font-size:11px;color:#555">Company gross profit: ${fmt(d.ltdGrossProfit)}${d.directorLoan>0?` &nbsp;·&nbsp; Director loan balance: ${fmt(d.directorLoan)} (BIK: ${fmt(dirLoanBIK(d.directorLoan))})`:""}${d.retainedProfitBf>0?` &nbsp;·&nbsp; Retained profits b/f: ${fmt(d.retainedProfitBf)}`:""}</p>
  ${r.strategies.slice(0,5).map((s,i)=>`<div class="strat${i===0?" strat-best":""}">
  <div style="display:flex;justify-content:space-between"><strong>${i===0?"⭐ ":""}${s.name}</strong><span style="font-family:monospace;font-weight:700">Total tax: ${fmt(s.total)}</span></div>
  <div style="font-size:11px;color:#555;margin-top:3px">${s.desc}</div>
  <div style="font-size:11px;color:#555;margin-top:2px">Corp: ${fmt(s.ct)} &nbsp;·&nbsp; Personal: ${fmt(s.personalTax)} &nbsp;·&nbsp; Retained: ${fmt(s.retained)}</div>
  </div>`).join("")}`:""}

  ${d.retainedProfitBf>0?`<h2>Retained Profits Analysis</h2>
  <p style="font-size:11px;color:#555">Retained profit b/f: ${fmt(d.retainedProfitBf)}. If extracted as dividends in a lower-income year, tax owed would be approximately ${fmt(retainedProfitAnalysis(d.retainedProfitBf,0,yr).taxOnExtract)} — net receipt ${fmt(retainedProfitAnalysis(d.retainedProfitBf,0,yr).netAfterTax)}.</p>`:""}

  <div class="disc"><strong>Disclaimer:</strong> General guidance only. Not financial, tax or legal advice. Based on estimated ${yr} rates. NHS pension AA complex — verify against actual statements. Income splitting carries HMRC risk (settlements legislation / Jones v Garnett). Director loans exceeding £10,000 to a participator trigger a s455 tax charge (25% of loan) until repaid. Seek qualified advice before implementing any strategy.</div>
  <div style="text-align:center;margin-top:14px"><button onclick="window.print()" style="padding:10px 24px;background:#005eb8;color:#fff;border:none;border-radius:7px;font-size:13px;cursor:pointer;font-weight:700">🖨️ Print / Save as PDF</button></div>
  </body></html>`);
  w.document.close();
};

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [phase, setPhase] = useState("disclaimer");
  const [step,  setStep]  = useState(0);
  const [res,   setRes]   = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [agreeErr, setAgreeErr] = useState(false);

  const blankMember = () => ({name:"",otherIncome:0,isDirector:false,holdShares:false});

  const [d, setD] = useState({
    taxYear:"2024/25", isScotland:false,
    // Salary
    nhsSalary:0, band:"", scheduledPAs:10, contractedHours:37.5, ltftPct:100,
    hasSalarySacrifice:false, salarySacrificeAmount:0,
    hasCarLease:false, carLeaseAmount:0,
    hasCycleScheme:false, cycleSchemeAmount:0,
    hasTechScheme:false, techSchemeAmount:0,
    // Additional NHS
    overtime:0, additionalPAs:0, additionalPAcount:0, meritAwardLocal:0, meritAwardNational:0, nciaLevel:"Not applicable", clinicalExcellenceAward:0, onCallPayments:0,
    hasEmployerOptOut:false, employerOptOutMonthly:0,
    // Other income
    privatePractice:0, medicalReports:0, otherMedicalIncome:0,
    interestIncome:0, dividendIncome:0, buyToLetIncome:0, otherIncome:0,
    // Pension AA
    aaMode:"simple",   // "simple" | "detailed"
    avcAmount:0, sipContributions:0,
    // Simple mode
    simpleExceeded:false, simpleExceededBy:0,
    simpleCF1:0, simpleCF2:0, simpleCF3:0,
    // Detailed mode — 3 prior years
    py:[
      {pia:0, aa:40000, exceeded:false, exceededBy:0},
      {pia:0, aa:60000, exceeded:false, exceededBy:0},
      {pia:0, aa:60000, exceeded:false, exceededBy:0},
    ],
    pensionablePayPrev:0, pensionScheme:"2015",
    // Ltd Co
    hasLtd:false,
    ltdGrossProfit:0,
    ltdPrivateIncome:0,
    companyPensionAmount:0,
    directorLoan:0,
    directorLoanRate:2.25,
    retainedProfitBf:0,
    retainFraction:0,
    familyMembers:[],
  });

  const set  = (k,v)   => setD(p=>({...p,[k]:v}));
  const setPY= (i,k,v) => setD(p=>{ const py=[...p.py]; py[i]={...py[i],[k]:v}; return {...p,py}; });
  const setFM= (i,k,v) => setD(p=>{ const fm=[...p.familyMembers]; fm[i]={...fm[i],[k]:v}; return {...p,familyMembers:fm}; });

  const tyIdx = TY_KEYS.indexOf(d.taxYear);
  const priorLabels = [-3,-2,-1].map(o=>TY_KEYS[tyIdx+o]||"N/A");

  const STEPS = ["Tax Year","NHS Salary","Extra Pay","Other Income","Pension AA","Ltd & Family"];

  // ── CALCULATE ───────────────────────────────────────────────
  const calculate = useCallback(()=>{
    const ty=d.taxYear; const r=TY[ty];
    const preTax = d.salarySacrificeAmount+d.carLeaseAmount+d.cycleSchemeAmount+d.techSchemeAmount;
    const pen    = calcPen(d.nhsSalary,ty);
    const nciaAmt = NCIA_LEVELS[d.nciaLevel]||0;
    const employerOptOutAnnual = d.hasEmployerOptOut ? (d.employerOptOutMonthly||0)*12 : 0;
    const niable = d.nhsSalary+d.overtime+d.additionalPAs+d.meritAwardLocal+d.meritAwardNational+nciaAmt+d.clinicalExcellenceAward+d.onCallPayments+employerOptOutAnnual-preTax;
    const empInc = niable - pen;
    const privInc= d.privatePractice+d.medicalReports+d.otherMedicalIncome;
    const othInc = d.interestIncome+d.dividendIncome+d.otherIncome;
    const btlProfit = Math.max(0,d.buyToLetIncome);
    const gross  = empInc+privInc+othInc+btlProfit;
    const tax    = Math.max(0,incomeTax(gross,d.isScotland,ty));
    const ni     = calcNI(niable,ty);
    const nhsGross = niable;
    const takeHome = nhsGross+privInc+othInc+btlProfit-tax-ni-pen;

    // AA
    const empContrib = d.nhsSalary*r.empR;
    const thr  = gross+pen;
    const adj  = thr+empContrib;
    const tAA  = tapAA(adj,thr,ty);
    const nhsPenInput = calcPIA(d.nhsSalary, d.pensionablePayPrev||d.nhsSalary);
    const avcTotal = (d.avcAmount||0)+(d.sipContributions||0);
    const penInput = nhsPenInput + avcTotal;

    // Carry forward
    let totalCF = 0;
    if (d.aaMode==="simple") {
      totalCF = (d.simpleCF1||0)+(d.simpleCF2||0)+(d.simpleCF3||0);
    } else {
      for (const py of d.py) {
        if (!py.exceeded) totalCF += Math.max(0, py.aa - (py.pia||0));
      }
    }
    totalCF = Math.max(0,totalCF);
    const effectiveAA = tAA+totalCF;
    const aaRemaining  = Math.max(0,tAA-penInput);
    const monthlyAccrual = penInput/12;
    const mRemTapered  = monthlyAccrual>0 ? Math.min(12,Math.floor(tAA/monthlyAccrual)) : 12;
    const mRemEffective= monthlyAccrual>0 ? Math.min(12,Math.floor(effectiveAA/monthlyAccrual)) : 12;
    const breachMonth  = mRemTapered<12 ? MONTHS[mRemTapered] : null;
    const cfBreachMth  = mRemEffective<12&&mRemEffective>mRemTapered ? MONTHS[mRemEffective] : null;
    const breach       = Math.max(0,penInput-tAA);
    const aaCharge     = breach>0 ? incomeTax(gross+breach,d.isScotland,ty)-tax : 0;

    // Director loan BIK
    const dlBIK = d.directorLoan>0 ? dirLoanBIK(d.directorLoan) : 0;
    const dlS455= d.directorLoan>10000 ? d.directorLoan*0.3375 : 0; // s455 charge if not repaid

    // Retained profit analysis
    const retainedAnalysis = d.retainedProfitBf>0 ? retainedProfitAnalysis(d.retainedProfitBf, gross, ty) : null;

    // Ltd strategies
    let strategies = null;
    if (d.hasLtd && d.ltdGrossProfit>0) {
      const members = [{name:"Director",otherIncome:gross}, ...d.familyMembers];
      strategies = optimise(d.ltdGrossProfit, members, d.companyPensionAmount, d.retainFraction/100, ty);
    }

    setRes({ takeHome, gross, tax, ni, pen, preTax, taperedAA:tAA, penInput, nhsPenInput, avcTotal, totalCF, effectiveAA, aaRemaining, mRemTapered, mRemEffective, breachMonth, cfBreachMth, breach, aaCharge, thr, adj, privInc, btlProfit, strategies, dlBIK, dlS455, retainedAnalysis, monthlyAccrual });
    setPhase("results");
  },[d]);

  // ── LAYOUT HELPERS ──────────────────────────────────────────
  const pg   = { minHeight:"100vh", background:"linear-gradient(160deg,#020c07,#051509,#03080f)", fontFamily:"'Trebuchet MS',sans-serif", color:"#e2f0e8" };
  const wrap  = { maxWidth:740, margin:"0 auto", padding:"26px 17px 70px" };
  const selS  = {...IS};
  const navB  = (back,next,lbl,last) => (
    <div style={{display:"flex",gap:11,marginTop:26}}>
      {back&&<button onClick={back} style={{flex:1,padding:"12px",background:"transparent",border:"2px solid #1e3d28",borderRadius:8,color:"#7aaa8a",fontSize:13,cursor:"pointer"}}>← Back</button>}
      <button onClick={next} style={{flex:3,padding:"12px",background:last?"linear-gradient(90deg,#003d20,#005eb8)":"#003d20",border:`2px solid ${last?"#38bdf8":"#16a34a"}`,borderRadius:8,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>{lbl||"Next →"}</button>
    </div>
  );
  const hdr = sub => (
    <div style={{background:"linear-gradient(90deg,#003d20,#005eb8)",padding:"15px 20px",borderBottom:"3px solid #16a34a"}}>
      <div style={{maxWidth:740,margin:"0 auto",display:"flex",alignItems:"center",gap:13}}>
        <span style={{fontSize:22}}>🏥</span>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,fontFamily:"Georgia,serif"}}>NHS Financial Planner</div><div style={{fontSize:11,color:"#93c5fd"}}>{sub}</div></div>
        {phase==="results"&&<button onClick={()=>printReport(d,res)} style={{padding:"8px 14px",background:"rgba(255,255,255,.15)",border:"2px solid #fff",borderRadius:7,color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700}}>📄 Save Report</button>}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // DISCLAIMER
  // ═══════════════════════════════════════════════════════════
  if (phase==="disclaimer") return (
    <div style={{...pg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:510,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:66,height:66,background:"linear-gradient(135deg,#003d20,#005eb8)",borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px"}}>🏥</div>
          <h1 style={{fontSize:23,color:"#e2f0e8",margin:"0 0 7px",fontFamily:"Georgia,serif"}}>NHS Financial Planner</h1>
          <p style={{color:"#5a8a6a",fontSize:13,margin:0,lineHeight:1.6}}>Comprehensive tax, pension & income optimisation<br/>for NHS professionals · 2023/24 – 2026/27</p>
        </div>
        <div style={{background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:13,padding:24}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {[["💰","Take-home & deductions"],["⚙️","Pension annual allowance"],["📅","Month-by-month breach warning"],["🏢","Ltd Co tax optimiser"],["👨‍👩‍👧","Family income splitting"],["💼","Director loans & retained profits"],["🔄","Simple or detailed AA mode"],["📄","Printable PDF report"]].map(([ic,t])=>(
              <div key={t} style={{background:"#051509",border:"1px solid #1e3d28",borderRadius:8,padding:"9px 11px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:15}}>{ic}</span><span style={{fontSize:11,color:"#7aaa8a",lineHeight:1.3}}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#051a0e",border:"1px solid #1e3d28",borderRadius:8,padding:"10px 13px",marginBottom:14,display:"flex",gap:9,alignItems:"flex-start"}}>
            <span style={{fontSize:15,flexShrink:0}}>🔒</span>
            <div style={{fontSize:11,color:"#5a8a6a",lineHeight:1.6}}><strong style={{color:"#7aaa8a"}}>Your privacy:</strong> No data collected or transmitted. All calculations run in your browser. Nothing leaves your device.</div>
          </div>
          <div style={{background:"#051509",border:`1px solid ${agreeErr?"#ef4444":"#1e3d28"}`,borderRadius:8,padding:13,marginBottom:14}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <input type="checkbox" checked={agreed} onChange={e=>{setAgreed(e.target.checked);setAgreeErr(false);}} style={{marginTop:3,flexShrink:0,accentColor:"#38bdf8",width:16,height:16,cursor:"pointer"}}/>
              <div style={{fontSize:11,color:"#5a8a6a",lineHeight:1.7}}>I understand this tool provides <strong style={{color:"#7aaa8a"}}>general guidance only</strong> and not financial, tax or legal advice. I will consult a qualified financial adviser before making decisions. <span style={{color:"#38bdf8"}}>I accept these terms.</span></div>
            </div>
          </div>
          {agreeErr&&<div style={{color:"#f87171",fontSize:12,marginBottom:11}}>⚠️ Please accept the disclaimer to continue.</div>}
          <button onClick={()=>{if(!agreed){setAgreeErr(true);return;}setPhase("form");}} style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#003d20,#005eb8)",border:"2px solid #38bdf8",borderRadius:9,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Start My Analysis →</button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // FORM
  // ═══════════════════════════════════════════════════════════
  if (phase==="form") return (
    <div style={pg}>
      {hdr(`Tax Year ${d.taxYear} · Step ${step+1} of ${STEPS.length}`)}
      <div style={wrap}>
        <SBar steps={STEPS} cur={step}/>

        {/* ── STEP 0: TAX YEAR ── */}
        {step===0&&<>
          <h2 style={{fontSize:19,fontFamily:"Georgia,serif",marginBottom:4}}>Tax Year & Residency</h2>
          <p style={{color:"#5a8a6a",fontSize:13,marginBottom:18}}>Choose the tax year to plan for. The UK tax year runs from 6 April to 5 April. Select <strong>2024/25</strong> for the current year. Run the tool multiple times to compare years side by side.</p>
          <ST mt={0}>Tax Year</ST>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:18}}>
            {TY_KEYS.map(yr=>(
              <button key={yr} onClick={()=>set("taxYear",yr)} style={{padding:"13px",background:d.taxYear===yr?"linear-gradient(135deg,#003366,#005eb8)":"#0a1f14",border:`2px solid ${d.taxYear===yr?"#38bdf8":"#1e3d28"}`,borderRadius:9,color:d.taxYear===yr?"#38bdf8":"#7aaa8a",fontSize:12,cursor:"pointer",textAlign:"left"}}>
                <div style={{fontWeight:700,fontSize:14}}>{yr}</div>
                <div style={{fontSize:10,marginTop:2,color:d.taxYear===yr?"#93c5fd":"#4a6a5a"}}>{TY[yr].label}</div>
              </button>
            ))}
          </div>
          <ST>Residency</ST>
          <Tog label="Scotland resident?" value={d.isScotland} onChange={v=>set("isScotland",v)} hint="Scottish residents pay income tax at different rates set by the Scottish Government. If you live in Scotland — even if you work in England — tick this box. Your NI and NHS pension are unaffected."/>
          {navB(null,()=>setStep(1))}
        </>}

        {/* ── STEP 1: NHS SALARY ── */}
        {step===1&&<>
          <h2 style={{fontSize:19,fontFamily:"Georgia,serif",marginBottom:4}}>NHS Salary & Pre-Tax Deductions</h2>
          <p style={{color:"#5a8a6a",fontSize:13,marginBottom:18}}>Pre-tax deductions reduce both income tax and National Insurance.</p>
          <ST mt={0}>Basic Salary</ST>
          <IB type="info" title="Which band or grade are you?" body="Select your NHS employment grade from the list. This auto-fills a starting salary estimate. Consultants use the 2025/26 ten-threshold pay structure. AfC bands use the 2025/26 Agenda for Change pay scales. Trainee doctors should check their ESR (Electronic Staff Record) payslip for their actual basic — the tool gives a rough nodal-point estimate only. Select 'Other' to enter any salary manually."/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:6}}>NHS Band / Grade</label>
            <select value={d.band} onChange={e=>{
              const band=e.target.value;
              set("band",band);
              const ftSal = BANDS[band]||0;
              if(band.startsWith("Consultant")){
                set("nhsSalary", Math.round((ftSal/10)*d.scheduledPAs));
              } else if(band.startsWith("Band")){
                set("nhsSalary", Math.round(ftSal*(d.contractedHours/37.5)));
              } else if(band && band!=="Other"){
                // Trainees / GP — set nodal point as starting reference
                set("nhsSalary", Math.round(ftSal*(d.ltftPct/100)));
              }
            }} style={selS}>
              <option value="">Select band or grade (auto-fills salary)…</option>
              <optgroup label="── Consultants (2003 contract, 2025/26) ──">
                {Object.entries(BANDS).filter(([k])=>k.startsWith("Consultant")).map(([k,v])=><option key={k} value={k}>{k}</option>)}
              </optgroup>
              <optgroup label="── Resident Doctors / Trainees ──">
                {Object.entries(BANDS).filter(([k])=>k.startsWith("Foundation")||k.startsWith("Specialty Registrar")).map(([k,v])=><option key={k} value={k}>{k}</option>)}
              </optgroup>
              <optgroup label="── GPs ──">
                {Object.entries(BANDS).filter(([k])=>k.startsWith("GP")).map(([k,v])=><option key={k} value={k}>{k}</option>)}
              </optgroup>
              <optgroup label="── Agenda for Change (2025/26) ──">
                {Object.entries(BANDS).filter(([k])=>k.startsWith("Band")).map(([k,v])=><option key={k} value={k}>{k}</option>)}
              </optgroup>
              <option value="Other">Other / enter salary manually</option>
            </select>
          </div>

          {/* ── CONSULTANTS: PA count ── */}
          {d.band&&d.band.startsWith("Consultant")&&<div style={{marginBottom:17}}>
            <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:4}}>Scheduled PAs in your job plan</label>
            <div style={{fontSize:10,color:"#4a6a5a",marginBottom:6,lineHeight:1.4}}>Full time = 10 PAs (4 hrs each). Enter your contracted number — e.g. 8 for a 4-day week. Salary = full-time rate ÷ 10 × your PAs.</div>
            <input type="number" min="1" max="10" step="0.5" value={d.scheduledPAs}
              onChange={e=>{const n=parseFloat(e.target.value)||10;set("scheduledPAs",n);set("nhsSalary",Math.round(((BANDS[d.band]||0)/10)*n));}}
              style={{width:"100%",padding:"11px 14px",background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:8,color:"#e2f0e8",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"'Courier New',monospace"}}
              onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e3d28"}/>
            {BANDS[d.band]>0&&<div style={{marginTop:8,background:"#0a1f14",border:"1px solid #16a34a",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#4ade80",fontFamily:"monospace"}}>
              {d.scheduledPAs} PAs × £{Math.round((BANDS[d.band]||0)/10).toLocaleString("en-GB")}/PA = <strong>£{Math.round(((BANDS[d.band]||0)/10)*d.scheduledPAs).toLocaleString("en-GB")}/yr</strong>
            </div>}
          </div>}

          {/* ── AfC BANDS: contracted hours ── */}
          {d.band&&d.band.startsWith("Band")&&<div style={{marginBottom:17}}>
            <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:4}}>Contracted hours per week</label>
            <div style={{fontSize:10,color:"#4a6a5a",marginBottom:6,lineHeight:1.4}}>Full time AfC = 37.5 hrs/week. Enter your contracted hours — e.g. 30 for 4 days, 22.5 for 3 days. Salary is pro-rated accordingly.</div>
            <input type="number" min="4" max="37.5" step="0.5" value={d.contractedHours}
              onChange={e=>{const n=parseFloat(e.target.value)||37.5;set("contractedHours",n);set("nhsSalary",Math.round((BANDS[d.band]||0)*(n/37.5)));}}
              style={{width:"100%",padding:"11px 14px",background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:8,color:"#e2f0e8",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"'Courier New',monospace"}}
              onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e3d28"}/>
            {BANDS[d.band]>0&&<div style={{marginTop:8,background:"#0a1f14",border:"1px solid #16a34a",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#4ade80",fontFamily:"monospace"}}>
              {d.contractedHours} hrs ÷ 37.5 = {(d.contractedHours/37.5*100).toFixed(1)}% · <strong>£{Math.round((BANDS[d.band]||0)*(d.contractedHours/37.5)).toLocaleString("en-GB")}/yr</strong>
            </div>}
          </div>}

          {/* ── TRAINEES / GP: LTFT % ── */}
          {d.band&&(d.band.startsWith("Foundation")||d.band.startsWith("Specialty Registrar")||d.band.startsWith("GP"))&&<div style={{marginBottom:17}}>
            <div style={{background:"#001020",border:"1px solid #38bdf8",borderRadius:9,padding:"11px 14px",marginBottom:11,fontSize:11,color:"#93c5fd",lineHeight:1.7}}>
              ℹ️ <strong>Resident doctor / trainee pay is complex.</strong> Your actual basic salary depends on your nodal point, rota hours, weekend frequency, on-call pattern, and any flexible pay premia — all of which vary by trust and rota. The nodal point shown is the <em>full-time basic</em> only and will not match your payslip.<br/>
              <strong>We recommend entering your actual basic salary from your payslip or ESR statement below.</strong> The LTFT % below gives a rough starting estimate only.
            </div>
            <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:4}}>Less Than Full Time (LTFT) % <span style={{fontSize:10,color:"#5a8a6a"}}>(100% if full time)</span></label>
            <div style={{fontSize:10,color:"#4a6a5a",marginBottom:6,lineHeight:1.4}}>Your agreed LTFT percentage from your deanery / employer. Basic pay is pro-rated by this percentage as a rough guide — override the salary below with your actual figure.</div>
            <input type="number" min="40" max="100" step="10" value={d.ltftPct}
              onChange={e=>{const n=parseFloat(e.target.value)||100;set("ltftPct",n);set("nhsSalary",Math.round((BANDS[d.band]||0)*(n/100)));}}
              style={{width:"100%",padding:"11px 14px",background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:8,color:"#e2f0e8",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"'Courier New',monospace"}}
              onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e3d28"}/>
            {BANDS[d.band]>0&&<div style={{marginTop:8,background:"#0a1f14",border:"1px solid #f59e0b",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#fcd34d",fontFamily:"monospace"}}>
              ⚠️ Rough guide only: {d.ltftPct}% × £{(BANDS[d.band]||0).toLocaleString("en-GB")} = £{Math.round((BANDS[d.band]||0)*(d.ltftPct/100)).toLocaleString("en-GB")}/yr — check your payslip and override below
            </div>}
          </div>}

          <PoundI label="Annual NHS Basic Salary" value={d.nhsSalary} onChange={v=>set("nhsSalary",v)} required hint={
            d.band&&d.band.startsWith("Consultant") ? "Auto-calculated from threshold × PAs — edit if actual salary differs" :
            d.band&&d.band.startsWith("Band") ? "Auto-calculated from band rate × contracted hours — edit if actual salary differs" :
            d.band&&(d.band.startsWith("Foundation")||d.band.startsWith("Specialty")||d.band.startsWith("GP")) ? "⚠️ LTFT estimate above is a rough guide only — please replace with your actual basic salary from your payslip" :
            "Enter your annual basic salary"
          }/>
          <ST>NHS Pension</ST>
          <Tog label="Not contributing to NHS pension — does your trust pay you an employer contribution equivalent?" value={d.hasEmployerOptOut} onChange={v=>set("hasEmployerOptOut",v)} hint="If you have opted out of the NHS pension, some trusts pass on some or all of the 20.68% employer contribution as extra salary instead. Check your contract or ask your payroll department. This payment is taxable and subject to NI. If your trust does not do this, leave this switched off."/>
          {d.hasEmployerOptOut&&<>
            <PoundI label="Monthly amount paid by trust (employer contribution equivalent)" value={d.employerOptOutMonthly} onChange={v=>set("employerOptOutMonthly",v)} hint={`Annual equivalent: ${fmt((d.employerOptOutMonthly||0)*12)}`}/>
            <IB type="info" title="Employer contribution equivalent" body="If your trust pays this, it is taxable income and subject to NI. It does not count as a pension contribution for Annual Allowance purposes. Enter the gross monthly amount shown on your payslip."/>
          </>}
          <ST>Salary Sacrifice Schemes</ST>
          <Tog label="Salary Sacrifice / AVCs / Childcare" value={d.hasSalarySacrifice} onChange={v=>set("hasSalarySacrifice",v)} hint="Salary sacrifice means part of your gross salary is swapped for a benefit before tax. This reduces your taxable income AND your NI. Common examples: childcare vouchers, pension AVCs paid this way, or other benefit schemes agreed with your trust."/>
          {d.hasSalarySacrifice&&<PoundI label="Annual salary sacrifice amount" value={d.salarySacrificeAmount} onChange={v=>set("salarySacrificeAmount",v)} small hint="Check your payslip for the monthly deduction and multiply by 12. It will appear as a reduction in your gross pay, not as a tax deduction."/>}
          <Tog label="NHS Car Lease" value={d.hasCarLease} onChange={v=>set("hasCarLease",v)} hint="If your trust offers a car lease scheme where payments are deducted from your gross salary before tax, tick this. Not all trusts offer this and it differs from a benefit-in-kind car arrangement."/>
          {d.hasCarLease&&<PoundI label="Annual car lease deduction" value={d.carLeaseAmount} onChange={v=>set("carLeaseAmount",v)} small hint="Find this on your payslip — it will show as a monthly deduction from gross pay. Multiply by 12."/>}
          <Tog label="Cycle to Work Scheme" value={d.hasCycleScheme} onChange={v=>set("hasCycleScheme",v)} hint="The Cycle to Work scheme lets you buy a bike and equipment tax-free through salary sacrifice. Payments come out of your gross pay before tax and NI, saving you typically 32-42% depending on your tax rate."/>
          {d.hasCycleScheme&&<PoundI label="Annual cycle scheme amount" value={d.cycleSchemeAmount} onChange={v=>set("cycleSchemeAmount",v)} small hint="Total annual cost of the scheme from your payslip. Usually spread over 12 monthly deductions."/>}
          <Tog label="Technology / Other Benefit Scheme" value={d.hasTechScheme} onChange={v=>set("hasTechScheme",v)} hint="Some trusts offer technology schemes (laptops, phones etc.) or other benefits via salary sacrifice. Include any such schemes here if deducted from your gross pay before tax."/>
          {d.hasTechScheme&&<PoundI label="Annual technology/benefit scheme amount" value={d.techSchemeAmount} onChange={v=>set("techSchemeAmount",v)} small hint="Annual total — check your payslip for the monthly deduction and multiply by 12."/>}
          {navB(()=>setStep(0),()=>setStep(2))}
        </>}

        {/* ── STEP 2: ADDITIONAL NHS ── */}
        {step===2&&<>
          <h2 style={{fontSize:19,fontFamily:"Georgia,serif",marginBottom:4}}>Additional NHS Income</h2>
          <p style={{color:"#5a8a6a",fontSize:13,marginBottom:18}}>Income through NHS payroll. Leave £0 if not applicable.</p>
          <ST mt={0}>Clinical</ST>
          <PoundI label="Overtime / Extra Shifts" value={d.overtime} onChange={v=>set("overtime",v)} hint="Any additional shifts or hours paid through NHS payroll on top of your contracted hours. Check your payslips or ask your payroll department for the annual total. This is pensionable pay and counts towards your Annual Allowance calculation."/>
          <IB type="info" title="What is an Additional PA?" body="A Programmed Activity (PA) is a 4-hour block of work. Full-time consultants have 10 PAs in their job plan. If you have agreed extra PAs with your medical director on top of your contracted number, enter how many here. The tool calculates the value automatically as your basic salary divided by 10, multiplied by the number of extra PAs."/>
          <div style={{marginBottom:17}}>
            <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:4}}>Number of Additional Programmed Activities (PAs)</label>
            <div style={{fontSize:10,color:"#4a6a5a",marginBottom:6,lineHeight:1.4}}>A PA = 4 hours work = 1/10th of your basic salary. Enter the number of extra PAs per week agreed with your trust.</div>
            <input type="number" min="0" max="20" step="0.5" value={d.additionalPAcount||""} placeholder="0"
              onChange={e=>{const n=parseFloat(e.target.value)||0;set("additionalPAcount",n);set("additionalPAs",Math.round((d.nhsSalary/10)*n));}}
              style={{...{width:"100%",padding:"11px 14px",background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:8,color:"#e2f0e8",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"inherit"},fontFamily:"'Courier New',monospace"}}
              onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e3d28"}/>
            {d.additionalPAcount>0&&d.nhsSalary>0&&<div style={{marginTop:8,background:"#0a1f14",border:"1px solid #16a34a",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#4ade80",fontFamily:"monospace"}}>
              Annual value: £{Math.round((d.nhsSalary/10)*d.additionalPAcount).toLocaleString("en-GB")} ({d.additionalPAcount} PA{d.additionalPAcount!==1?"s":""} × £{Math.round(d.nhsSalary/10).toLocaleString("en-GB")}/PA)
            </div>}
            {d.additionalPAcount>0&&d.nhsSalary===0&&<div style={{marginTop:6,fontSize:11,color:"#f59e0b"}}>⚠️ Enter your basic salary on step 1 first to calculate the PA value.</div>}
          </div>
          <PoundI label="On-Call / Out-of-Hours Payments" value={d.onCallPayments} onChange={v=>set("onCallPayments",v)} hint="Payments for being available on call, including availability allowances and any out-of-hours supplements. Find these on your payslips — add up all on-call related payments across the year. These are pensionable for consultants on the 2003 contract."/>
          <ST>Awards</ST>
          <PoundI label="Local Merit Award / Trust Award" value={d.meritAwardLocal} onChange={v=>set("meritAwardLocal",v)} hint="A locally-awarded payment made by your NHS trust. Pre-2018 Local Clinical Excellence Awards (LCEAs) that are still in payment should go here. Check your contract or payslip. Note: pre-2018 LCEAs were pensionable; post-2018 awards are not."/>
          <IB type="info" title="What is an NCIA?" body="The National Clinical Impact Award (NCIA) replaced the National Clinical Excellence Award (NCEA) from 2022. It is a nationally-awarded recognition payment for consultants and academic GPs who contribute to the NHS above and beyond their contracted role. Awards are given at three levels (£20k, £30k, £40k per year). If you hold a pre-2022 NCEA that was frozen rather than replaced, enter its value in the 'Frozen LCEA' field below instead. If you do not hold an NCIA, leave this as 'Not applicable'."/>
          <div style={{marginBottom:17}}>
            <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:4}}>National Clinical Impact Award (NCIA) Level</label>
            <div style={{fontSize:10,color:"#4a6a5a",marginBottom:6,lineHeight:1.4}}>NCIAs replaced NCEAs from 2022. Pre-2022 Local Clinical Excellence Awards (LCEAs) are now frozen. Select your current NCIA level if applicable.</div>
            <select value={d.nciaLevel} onChange={e=>{set("nciaLevel",e.target.value);}} style={{width:"100%",padding:"11px 14px",background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:8,color:"#e2f0e8",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}>
              {Object.keys(NCIA_LEVELS).map(k=><option key={k} value={k}>{k}</option>)}
            </select>
            {NCIA_LEVELS[d.nciaLevel]>0&&<div style={{marginTop:8,background:"#0a1f14",border:"1px solid #16a34a",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#4ade80",fontFamily:"monospace"}}>
              Annual NCIA: £{NCIA_LEVELS[d.nciaLevel].toLocaleString("en-GB")}
            </div>}
          </div>
          <PoundI label="Other Local Award / Frozen LCEA" value={d.clinicalExcellenceAward} onChange={v=>set("clinicalExcellenceAward",v)} hint="Any remaining local award not covered by the NCIA selector above — for example a frozen pre-2018 LCEA still in payment. Check your payslip or contract letter for the annual value. If unsure whether it is pensionable, ask your trust HR or pensions department."/>
          <ST>NHS Pension Opt-Out Payment</ST>
          <Tog label="Does your trust pay you an employer contribution equivalent because you have opted out of the NHS pension?" value={d.hasEmployerOptOut} onChange={v=>set("hasEmployerOptOut",v)}/>
          {d.hasEmployerOptOut&&<>
            <div style={{background:"#001428",border:"1px solid #38bdf8",borderRadius:9,padding:"11px 14px",marginBottom:11,fontSize:11,color:"#93c5fd",lineHeight:1.6}}>
              ℹ️ Some trusts pay opted-out staff some or all of the employer's pension contribution (20.68%) as additional salary. This is fully taxable and subject to NI. Check your payslip or contract for the exact amount.
            </div>
            <PoundI label="Monthly opt-out payment from trust (£ per month)" value={d.employerOptOutMonthly} onChange={v=>set("employerOptOutMonthly",v)} hint={`Annual equivalent: £${Math.round((d.employerOptOutMonthly||0)*12).toLocaleString("en-GB")}`}/>
          </>}
          {navB(()=>setStep(1),()=>setStep(3))}
        </>}

        {/* ── STEP 3: OTHER INCOME ── */}
        {step===3&&<>
          <h2 style={{fontSize:19,fontFamily:"Georgia,serif",marginBottom:4}}>Private & Other Income</h2>
          <p style={{color:"#5a8a6a",fontSize:13,marginBottom:18}}>Income outside NHS payroll received personally (not via Ltd Co).</p>
          <ST mt={0}>Private Medical</ST>
          <PoundI label="Private Practice — net profit after expenses, before tax" value={d.privatePractice} onChange={v=>set("privatePractice",v)} hint="Enter your income after deducting your own business expenses (accountancy, medical defence, equipment, room hire etc.) but before income tax. We cannot know your specific deductions so please calculate this yourself."/>
          <PoundI label="Medical Reports / Expert Witness — net after expenses" value={d.medicalReports} onChange={v=>set("medicalReports",v)} hint="Income from writing medical reports, acting as an expert witness, or other medico-legal work. Deduct any direct expenses (secretarial support, professional indemnity for this work, stationery) before entering the figure. Enter the annual total — you may need to add up invoices across the year."/>
          <PoundI label="Other Medical Income — net after expenses" value={d.otherMedicalIncome} onChange={v=>set("otherMedicalIncome",v)} hint="Any other medical or clinical income not covered above — for example paid teaching or lecturing, speaking at conferences, writing for medical publications, or NHS management roles in external organisations. Deduct relevant direct expenses before entering. Enter the annual total."/>
          <ST>Investments & Savings</ST>
          <PoundI label="Savings Interest" value={d.interestIncome} onChange={v=>set("interestIncome",v)} hint="Total gross interest received from bank accounts, cash ISAs (non-ISA only — ISA interest is tax free), NS&I bonds etc. during the tax year. Your bank will send you an annual interest statement, or you can check your online banking. The first £500 (higher rate taxpayer) or £1,000 (basic rate) is tax free — but you still enter the gross amount here and we will handle the allowance."/>
          <PoundI label="Dividend Income (personal, not from your own Ltd Co)" value={d.dividendIncome} onChange={v=>set("dividendIncome",v)} hint="Dividends received from shares you personally hold — for example in a stocks and shares ISA (non-ISA only — ISA dividends are tax free), individual shares, or investment funds. Do NOT include dividends from your own Limited Company here — those are handled in the Ltd Co section. Check your broker or investment platform for an annual dividend statement."/>
          <ST>Property</ST>
          <PoundI label="Buy-to-Let / Rental Income — net annual profit" value={d.buyToLetIncome} onChange={v=>set("buyToLetIncome",v)} hint="Enter your net rental profit for the year. Start with total rent received, then deduct: letting agent fees, property management costs, landlord insurance, repairs and maintenance, ground rent, service charges, and any accountancy fees for the property. For mortgage interest — since April 2020 you can only claim a 20% tax credit rather than a deduction, so enter your profit BEFORE any mortgage interest deduction (we do not model this separately as it depends on your tax rate). Your accountant's rental accounts will show this figure."/>
          <ST>Other</ST>
          <PoundI label="Any Other Taxable Income" value={d.otherIncome} onChange={v=>set("otherIncome",v)} hint="Anything taxable that does not fit the categories above — for example income from abroad, occasional freelance work, royalties, or HMRC state benefits that are taxable. If you are unsure whether something is taxable, enter it here to be safe and mention it to your accountant."/>
          {navB(()=>setStep(2),()=>setStep(4))}
        </>}

        {/* ── STEP 4: PENSION AA ── */}
        {step===4&&<>
          <h2 style={{fontSize:19,fontFamily:"Georgia,serif",marginBottom:4}}>Pension Annual Allowance</h2>
          <p style={{color:"#5a8a6a",fontSize:13,marginBottom:14}}>We'll calculate whether your pension input may breach your Annual Allowance and in which month.</p>

          {/* MODE SWITCHER */}
          <div style={{display:"flex",gap:0,marginBottom:20,borderRadius:10,overflow:"hidden",border:"2px solid #1e3d28"}}>
            {[["simple","Quick Mode","I'll enter carry forward totals only"],["detailed","Detailed Mode","Enter actual PIA for each year from my statements"]].map(([v,l,s])=>(
              <button key={v} onClick={()=>set("aaMode",v)} style={{flex:1,padding:"12px 10px",background:d.aaMode===v?"linear-gradient(135deg,#003366,#005eb8)":"#0a1f14",border:"none",color:d.aaMode===v?"#38bdf8":"#5a8a6a",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:d.aaMode===v?"#38bdf8":"#a0c4b0"}}>{l}</div>
                <div style={{fontSize:10,marginTop:2,color:d.aaMode===v?"#93c5fd":"#4a6a5a"}}>{s}</div>
              </button>
            ))}
          </div>

          <ST mt={0}>Pension Scheme & Pensionable Pay</ST>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,color:"#a0c4b0",marginBottom:6}}>NHS Pension Scheme</label>
            <div style={{fontSize:10,color:"#4a6a5a",marginBottom:6,lineHeight:1.4}}>Most NHS staff who joined after April 2015, or who were moved across automatically, are in the 2015 CARE scheme. If you joined before 2015 you may still be in the 1995 or 2008 section. Check your NHS Total Reward Statement at totalrewardstatements.nhs.uk or ask your trust pensions administrator.</div>
            <select value={d.pensionScheme} onChange={e=>set("pensionScheme",e.target.value)} style={selS}>
              <option value="2015">2015 CARE Scheme (most members)</option>
              <option value="1995">1995 Section</option>
              <option value="2008">2008 Section</option>
            </select>
          </div>
          <PoundI label="Pensionable Pay — Previous Year" value={d.pensionablePayPrev} onChange={v=>set("pensionablePayPrev",v)} hint="This is your NHS salary from the previous tax year. Find it on your P60 (issued by your employer each April) or your last payslip of the year. It is used to estimate your NHS pension input this year using the 2015 CARE scheme formula."/>

          <ST>Additional Voluntary Contributions (AVCs) & Personal Pensions</ST>
          <IB type="warning" title="AVCs and SIPPs count towards your Annual Allowance" body="Any money you pay into an AVC scheme, SIPP or personal pension counts towards your Annual Allowance on top of your NHS pension input. Many people don't realise this and get an unexpected AA charge. Include all contributions here — including any paid via salary sacrifice."/>
          <PoundI label="NHS AVC contributions this year (annual total)" value={d.avcAmount} onChange={v=>set("avcAmount",v)} hint="If you pay into an AVC scheme through your NHS trust (e.g. Prudential/Equitable Life NHS AVC), enter the total annual amount here. Check your payslips — it will show as a deduction each month. Multiply your monthly AVC by 12 to get the annual figure. These count pound-for-pound towards your Annual Allowance."/>
          <PoundI label="Personal pension / SIPP contributions this year (annual total)" value={d.sipContributions} onChange={v=>set("sipContributions",v)} hint="If you pay into a personal pension or SIPP (Self-Invested Personal Pension) outside of your NHS pension — either directly or via a Ltd company — enter the total annual amount here. You can find this on your pension provider's annual statement or online account. These count in full towards your Annual Allowance."/>
          {(d.avcAmount>0||d.sipContributions>0)&&<div style={{background:"#001428",border:"1px solid #38bdf8",borderRadius:9,padding:"12px 16px",marginBottom:4}}>
            <div style={{fontSize:10,color:"#93c5fd",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Total pension input this year (estimated)</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <div style={{fontSize:12,color:"#a0c4b0"}}>NHS pension (CARE accrual): calculated on results page</div>
              {d.avcAmount>0&&<div style={{fontSize:12,color:"#4ade80"}}>+ AVCs: {fmt(d.avcAmount)}</div>}
              {d.sipContributions>0&&<div style={{fontSize:12,color:"#4ade80"}}>+ SIPP/personal pension: {fmt(d.sipContributions)}</div>}
              <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",borderTop:"1px solid #1e3d28",paddingTop:6,marginTop:2}}>These will be added to your NHS pension input in the AA calculation</div>
            </div>
          </div>}

          {/* SIMPLE MODE */}
          {d.aaMode==="simple"&&<>
            <ST>Did you exceed your AA last year?</ST>
            <Tog label="I exceeded my Annual Allowance last year" value={d.simpleExceeded} onChange={v=>set("simpleExceeded",v)}/>
            {d.simpleExceeded&&<PoundI label="Amount exceeded by" value={d.simpleExceededBy} onChange={v=>set("simpleExceededBy",v)} hint="Pension input minus your AA for that year — an AA charge may have applied"/>}

            <ST>Carry Forward Available</ST>
            <IB type="info" title="What is carry forward?" body="If you didn't use your full Annual Allowance in the past 3 years, you can carry the unused amount forward to this year. The standard AA was £40,000 in 2022/23 and £60,000 from 2023/24."/>
            <PoundI label={`Unused AA — ${priorLabels[0]} (oldest, used first)`} value={d.simpleCF1} onChange={v=>set("simpleCF1",v)} hint="Standard AA for that year minus your pension input"/>
            <PoundI label={`Unused AA — ${priorLabels[1]}`} value={d.simpleCF2} onChange={v=>set("simpleCF2",v)} hint="Annual Allowance for that year minus your total pension input (NHS pension + any AVCs or SIPPs). If you are not sure, use £0 to be conservative."/>
            <PoundI label={`Unused AA — ${priorLabels[2]} (most recent)`} value={d.simpleCF3} onChange={v=>set("simpleCF3",v)} hint="Annual Allowance for that year minus your total pension input. This is the most recent prior year so it is used last. Check your NHS Annual Benefit Statement for the exact figure."/>
            <div style={{background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:9,padding:"12px 16px",marginTop:8}}>
              <div style={{fontSize:11,color:"#5a8a6a"}}>Total carry forward entered:</div>
              <div style={{fontSize:22,fontWeight:700,color:"#38bdf8",fontFamily:"monospace"}}>{fmt((d.simpleCF1||0)+(d.simpleCF2||0)+(d.simpleCF3||0))}</div>
            </div>
          </>}

          {/* DETAILED MODE */}
          {d.aaMode==="detailed"&&<>
            <ST>Prior 3 Years — Actual Pension Input & Annual Allowance</ST>
            <IB type="info" title="Where to find these figures" body="Log in to the NHS Total Reward Statements portal (TRS) at totalrewardstatements.nhs.uk. Your Annual Benefit Statement shows your Pension Input Amount (PIA) for each year. The Annual Allowance was £40,000 in 2022/23 and £60,000 from 2023/24."/>
            {[0,1,2].map(i=>{
              const py=d.py[i]; const lbl=priorLabels[i]||`Year ${i+1}`;
              const cfAmt=py.exceeded?0:Math.max(0,py.aa-(py.pia||0));
              return(
                <div key={i} style={{background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:11,padding:15,marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",marginBottom:10}}>{lbl}{i===0?" — oldest (used first)":i===1?" — middle year":` — most recent`}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <PoundI label="Pension Input Amount (PIA)" value={py.pia} onChange={v=>setPY(i,"pia",v)} small hint="From your annual pension statement"/>
                    <PoundI label="Annual Allowance that year" value={py.aa} onChange={v=>setPY(i,"aa",v)} small hint="£40k (2022/23), £60k (2023/24+)"/>
                  </div>
                  <Tog label="Did you exceed your AA this year?" value={py.exceeded} onChange={v=>setPY(i,"exceeded",v)} hint="If yes, no carry forward available from this year"/>
                  {py.exceeded&&<PoundI label="Exceeded by" value={py.exceededBy} onChange={v=>setPY(i,"exceededBy",v)} small hint="PIA minus AA for that year"/>}
                  {!py.exceeded&&py.pia>0&&<div style={{fontSize:11,marginTop:6,color:cfAmt>0?"#4ade80":"#f87171"}}>Carry forward from this year: {fmt(cfAmt)}</div>}
                </div>
              );
            })}
            <div style={{background:"#001428",border:"1px solid #38bdf8",borderRadius:9,padding:"12px 16px"}}>
              <div style={{fontSize:11,color:"#93c5fd"}}>Total carry forward calculated:</div>
              <div style={{fontSize:22,fontWeight:700,color:"#38bdf8",fontFamily:"monospace"}}>{fmt(d.py.reduce((s,py)=>s+(py.exceeded?0:Math.max(0,py.aa-(py.pia||0))),0))}</div>
            </div>
          </>}
          {navB(()=>setStep(3),()=>setStep(5))}
        </>}

        {/* ── STEP 5: LTD CO & FAMILY ── */}
        {step===5&&<>
          <h2 style={{fontSize:19,fontFamily:"Georgia,serif",marginBottom:4}}>Limited Company & Family Planning</h2>
          <p style={{color:"#5a8a6a",fontSize:13,marginBottom:14}}>Model tax strategies for private practice, medico-legal or other income through a Ltd Company.</p>

          <Tog label="Do you have (or are considering) a Limited Company?" value={d.hasLtd} onChange={v=>set("hasLtd",v)}/>

          {d.hasLtd&&<>
            <IB type="warning" title="HMRC income shifting" body="Paying dividends to family members is subject to the settlements legislation and Jones v Garnett precedent. Always obtain specialist legal and tax advice before implementing family income splitting."/>

            <ST>Company Financials</ST>
            <PoundI label="Company gross profit (before your salary or pension)" value={d.ltdGrossProfit} onChange={v=>set("ltdGrossProfit",v)} hint="This is your company's total income (fees invoiced and paid) minus all allowable business expenses such as accountancy fees, professional indemnity, equipment, software, and room hire. Do NOT deduct your own salary or pension here — the tool models those separately. Your accountant will have this figure from your management accounts or year-end accounts."/>
            <PoundI label="Of which: private practice / medico-legal income (£)" value={d.ltdPrivateIncome} onChange={v=>set("ltdPrivateIncome",v)} hint="Enter how much of the company's gross profit comes from private clinical work or medico-legal work. This is important for Annual Allowance tapering — income earned inside a Ltd Company does not count towards your personal adjusted income for AA purposes, so correctly identifying this can save you from an unexpected AA charge. If all the company income is private practice, enter the same figure as gross profit above."/>
            <PoundI label="Retained profits brought forward (£)" value={d.retainedProfitBf} onChange={v=>set("retainedProfitBf",v)} hint="The total accumulated undistributed profits sitting in your company from previous years — shown on your company's balance sheet as 'retained earnings' or 'profit and loss reserve'. Your accountant will have this figure. These profits have already been subject to corporation tax but have not yet been extracted as salary or dividends. The tool will model different strategies for drawing them down efficiently."/>

            <ST>Company Pension</ST>
            <PoundI label="Company pension contribution to SIPP / personal pension (annual £)" value={d.companyPensionAmount} onChange={v=>set("companyPensionAmount",v)} hint="If your company makes a contribution to your personal pension or SIPP, enter the annual amount here. Company pension contributions are a deductible business expense (saving corporation tax at 19-25%) and do NOT count as your personal income for Annual Allowance threshold income — making them highly tax-efficient. However they DO count towards your Annual Allowance, so be careful not to exceed your total AA including NHS pension input and any personal contributions. Set to 0 and the tool will suggest an optimal amount."/>

            <ST>Director Loan Account</ST>
            <IB type="info" title="Director loans" body="If you borrow money from your company (director's loan), amounts over £10,000 create a benefit-in-kind at HMRC's official rate. If the loan is not repaid within 9 months of the company year-end, a s455 tax charge (33.75%) applies to the company until repayment."/>
            <PoundI label="Current director loan balance (£)" value={d.directorLoan} onChange={v=>set("directorLoan",v)} hint="A director's loan is money you have borrowed from your company that has not been formally declared as salary or dividends. The balance will appear on your company's balance sheet as 'directors' loan account'. Enter the amount you currently owe to the company (not money the company owes you). Loans under £10,000 avoid the benefit-in-kind charge. Loans not repaid within 9 months of your company year-end trigger a section 455 tax charge on the company."/>
            {d.directorLoan>0&&<>
              <div style={{background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:9,padding:"12px 16px",marginBottom:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><div style={{fontSize:10,color:"#5a8a6a",marginBottom:4}}>BENEFIT IN KIND (p.a.)</div><div style={{fontSize:18,fontWeight:700,color:d.directorLoan>10000?"#f59e0b":"#38bdf8",fontFamily:"monospace"}}>{fmt(dirLoanBIK(d.directorLoan))}</div><div style={{fontSize:10,color:"#4a6a5a"}}>Taxed at your marginal rate</div></div>
                  {d.directorLoan>10000&&<div><div style={{fontSize:10,color:"#f87171",marginBottom:4}}>S455 CHARGE (if not repaid)</div><div style={{fontSize:18,fontWeight:700,color:"#f87171",fontFamily:"monospace"}}>{fmt(d.directorLoan*0.3375)}</div><div style={{fontSize:10,color:"#4a6a5a"}}>Recoverable on repayment</div></div>}
                </div>
              </div>
              {d.directorLoan>10000&&<IB type="danger" title="S455 tax charge risk" body={`Your director loan of ${fmt(d.directorLoan)} exceeds £10,000. If not repaid within 9 months of your company year-end, HMRC charges 33.75% (${fmt(d.directorLoan*0.3375)}) on the company. This is refundable once the loan is repaid, but creates a cashflow burden. Consider declaring a dividend or bonus to clear the balance.`}/>}
            </>}

            <ST>Profit Retention Strategy</ST>
            <NumI label="Retain this % of distributable profits in company (%)" value={d.retainFraction} onChange={v=>set("retainFraction",v)} hint="Decide what percentage of this year's available profit you want to leave in the company rather than extract as salary or dividends. Money retained in the company is only taxed at corporation tax rates (19-25%) — much lower than personal income tax at 40-45%. You can draw it down in a future year when your personal income is lower, or at retirement. Set to 0 to extract everything, or higher to build a tax-efficient pot inside the company."/>

            <ST>Family Members</ST>
            <p style={{fontSize:11,color:"#4a6a5a",marginBottom:11,lineHeight:1.5}}>Add family members who hold or could hold shares. For each, enter their other income so we can calculate their marginal dividend tax rate. Only adult children (18+) benefit from income splitting — minor children's income is taxed at the parent's rate.</p>
            {d.familyMembers.map((m,i)=>(
              <div key={i} style={{background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:10,padding:13,marginBottom:11}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#a0c4b0"}}>Family Member {i+1}</div>
                  <button onClick={()=>setD(p=>({...p,familyMembers:p.familyMembers.filter((_,j)=>j!==i)}))} style={{background:"transparent",border:"1px solid #3a1010",borderRadius:5,color:"#f87171",fontSize:11,cursor:"pointer",padding:"3px 8px"}}>Remove</button>
                </div>
                <TxtI label="Name / Relationship" value={m.name} onChange={v=>setFM(i,"name",v)} placeholder="e.g. Spouse, Adult Child"/>
                <PoundI label="Their other annual income (salary, pension etc.)" value={m.otherIncome} onChange={v=>setFM(i,"otherIncome",v)} small hint="Enter the family member's total income from all other sources (their own employment, pensions, savings etc.) outside of this company. This is used to calculate their marginal rate of income tax on any dividends they receive from the company. Someone with no other income can receive up to £12,570 tax-free plus the dividend allowance before paying any tax."/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                  <Tog label="Director?" value={m.isDirector} onChange={v=>setFM(i,"isDirector",v)}/>
                  <Tog label="Holds shares?" value={m.holdShares} onChange={v=>setFM(i,"holdShares",v)}/>
                </div>
              </div>
            ))}
            <button onClick={()=>setD(p=>({...p,familyMembers:[...p.familyMembers,blankMember()]}))} style={{width:"100%",padding:"10px",background:"transparent",border:"2px dashed #1e3d28",borderRadius:9,color:"#38bdf8",fontSize:13,cursor:"pointer",marginBottom:14}}>
              + Add Family Member
            </button>
            <IB type="info" title="Ltd Co income & pension AA" body={`Income earned inside your Ltd Company does NOT count towards your personal adjusted income for AA tapering purposes. ${d.ltdPrivateIncome>0?`This means your ${fmt(d.ltdPrivateIncome)} of company income is effectively shielded from the AA taper calculation.`:""}`}/>
          </>}

          {navB(()=>setStep(4),calculate,"Calculate My Finances →",true)}
        </>}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════
  if (phase==="results"&&res) {
    const yr=d.taxYear; const breachYr=yr.split("/")[1];
    const mAccrual=res.monthlyAccrual;

    return(
      <div style={pg}>
        {hdr(`Tax Year ${yr} · ${d.isScotland?"Scotland":"England/Wales/NI"}`)}
        <div style={wrap}>

          {/* HERO */}
          <div style={{background:"linear-gradient(135deg,#003d20,#005eb8)",borderRadius:14,padding:24,marginBottom:20,border:"2px solid #4ade80",textAlign:"center"}}>
            <div style={{fontSize:10,color:"#93c5fd",textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Estimated Annual Take-Home · {yr}</div>
            <div style={{fontSize:46,fontWeight:700,color:"#4ade80",fontFamily:"'Courier New',monospace",lineHeight:1}}>{fmt(res.takeHome)}</div>
            <div style={{fontSize:18,color:"#38bdf8",marginTop:6}}>{fmt(res.takeHome/12)} / month</div>
          </div>

          {/* DEDUCTIONS */}
          <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",marginBottom:9,fontFamily:"Georgia,serif"}}>💰 Income & Deductions</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
            <DC label="Total Gross Income" value={res.gross}/>
            <DC label="Income Tax" value={res.tax} sub={d.isScotland?"Scottish rates":"England/Wales rates"}/>
            <DC label="National Insurance" value={res.ni}/>
            <DC label="NHS Pension Contribution" value={res.pen} sub="Employee contribution (pre-tax)"/>
            {res.preTax>0&&<DC label="Pre-Tax Deductions" value={res.preTax}/>}
            {res.btlProfit>0&&<DC label="Net Rental Income (after expenses)" value={res.btlProfit} sub="Net of letting expenses — entered by you"/>}
          </div>
          <div style={{background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:11,padding:14,marginBottom:20}}>
            <div style={{fontSize:9,color:"#5a8a6a",marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>Effective Rates</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,textAlign:"center"}}>
              {[["Tax Rate",pct(res.tax,res.gross)],["NI Rate",pct(res.ni,res.gross)],["Total Deduction",pct(res.tax+res.ni+res.pen,res.gross)]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:9,color:"#5a8a6a",marginBottom:2}}>{l}</div><div style={{fontSize:19,fontWeight:700,color:"#38bdf8",fontFamily:"monospace"}}>{v}</div></div>
              ))}
            </div>
          </div>

          {/* PENSION AA */}
          <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",marginBottom:9,fontFamily:"Georgia,serif"}}>⚙️ Pension Annual Allowance — {yr}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
            <DC label="Tapered Annual Allowance" value={res.taperedAA} hi sub={`Threshold: ${fmt(res.thr)} · Adjusted: ${fmt(res.adj)}`}/>
            <DC label="Estimated Pension Input" value={res.penInput} sub="2015 CARE 1/54 accrual"/>
            <DC label="Carry Forward (3 years)" value={res.totalCF} sub={`Mode: ${d.aaMode}`}/>
            <DC label="Effective Total Allowance" value={res.effectiveAA} hi sub="Tapered AA + carry forward"/>
          </div>

          {/* AA REMAINING + MONTH CALENDAR */}
          <div style={{background:"#001428",border:"2px solid #38bdf8",borderRadius:13,padding:20,marginBottom:13}}>
            <div style={{fontSize:10,color:"#93c5fd",textTransform:"uppercase",letterSpacing:1,marginBottom:11}}>Annual Allowance Position</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:14}}>
              <div style={{textAlign:"center",background:"#000f20",borderRadius:10,padding:13}}>
                <div style={{fontSize:10,color:"#5a8a6a",marginBottom:4}}>AA REMAINING (TAPERED)</div>
                <div style={{fontSize:26,fontWeight:700,color:res.aaRemaining>0?"#4ade80":"#f87171",fontFamily:"monospace"}}>{fmt(res.aaRemaining)}</div>
              </div>
              <div style={{textAlign:"center",background:"#000f20",borderRadius:10,padding:13}}>
                <div style={{fontSize:10,color:"#5a8a6a",marginBottom:4}}>AA REMAINING (+ CARRY FWD)</div>
                <div style={{fontSize:26,fontWeight:700,color:res.effectiveAA-res.penInput>0?"#4ade80":"#f87171",fontFamily:"monospace"}}>{fmt(Math.max(0,res.effectiveAA-res.penInput))}</div>
              </div>
            </div>

            <div style={{fontSize:11,color:"#a0c4b0",marginBottom:9}}>Month-by-month accrual projection (Apr – Mar, {yr}):</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:9}}>
              {MONTHS.map((m,i)=>{
                const acc=(i+1)*mAccrual;
                const isBreach=acc>res.taperedAA;
                const isCFBreach=acc>res.effectiveAA;
                const bg=isCFBreach?"#1a0505":isBreach?"#1a1200":"#003d20";
                const br=isCFBreach?"#ef4444":isBreach?"#f59e0b":"#4ade80";
                const col=isCFBreach?"#f87171":isBreach?"#fcd34d":"#4ade80";
                return(
                  <div key={m} style={{width:44,height:52,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:bg,border:`2px solid ${br}`,gap:1}}>
                    <div style={{fontSize:9.5,fontWeight:700,color:col}}>{m}</div>
                    <div style={{fontSize:7.5,color:col,fontFamily:"monospace"}}>{fmtK(acc)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:10,color:"#4a6a5a",marginBottom:11}}>🟢 Within tapered AA &nbsp;·&nbsp; 🟡 Within carry forward only &nbsp;·&nbsp; 🔴 Projected breach</div>

            {/* PLAIN-ENGLISH ADVICE BOX */}
            {res.breach>0?(
              <div style={{background:"#1a0505",border:"2px solid #ef4444",borderRadius:10,padding:15}}>
                <div style={{fontSize:13,fontWeight:700,color:"#ef4444",marginBottom:7}}>🚨 Annual Allowance Already Breached: {fmt(res.breach)}</div>
                <div style={{fontSize:12,color:"#fca5a5",lineHeight:1.7}}>Your estimated pension input ({fmt(res.penInput)}) has already exceeded your tapered AA ({fmt(res.taperedAA)}) this year. Estimated additional tax charge: <strong>{fmt(res.aaCharge)}</strong>.</div>
                <div style={{fontSize:12,color:"#9ab8a8",marginTop:10,lineHeight:1.7}}><strong>Options to consider:</strong><br/>1. <strong>Scheme Pays</strong> — NHSBSA pays the charge and recovers from your eventual pension<br/>2. <strong>Check carry forward</strong> — {fmt(res.totalCF)} of carry forward may reduce or eliminate the charge<br/>3. <strong>Opt out of the NHS pension</strong> for remaining months (financial advice required)<br/>4. <strong>Route additional income to Ltd Co</strong> — this income does not count towards adjusted income<br/>5. Speak to a specialist financial adviser or accountant <strong>as soon as possible</strong></div>
              </div>
            ):res.breachMonth?(
              <div style={{background:"#1a1200",border:"2px solid #f59e0b",borderRadius:10,padding:15}}>
                <div style={{fontSize:13,fontWeight:700,color:"#f59e0b",marginBottom:7}}>⚠️ Projected Breach: {res.breachMonth} {breachYr}</div>
                <div style={{fontSize:13,color:"#fcd34d",lineHeight:1.7}}>
                  Based on your current pension accrual rate, it is estimated that by <strong>{res.breachMonth} {breachYr}</strong> you will hit your Annual Allowance limit of {fmt(res.taperedAA)}.
                  {res.totalCF>0&&` Using your carry forward (${fmt(res.totalCF)}), the effective limit extends further${res.cfBreachMth?` — projected to be reached around ${res.cfBreachMth} ${breachYr}`:""}.`}
                </div>
                <div style={{fontSize:12,color:"#9ab8a8",marginTop:10,lineHeight:1.7}}>
                  <strong>We recommend you seek advice from a specialist financial adviser or accountant before {res.breachMonth} {breachYr}.</strong> Options to consider:<br/>
                  1. <strong>Scheme Pays</strong> — NHSBSA pays the AA charge, recovered from your pension at retirement<br/>
                  2. <strong>Opt out of the NHS pension</strong> for remaining months of the year (get advice first)<br/>
                  3. <strong>Reduce additional pensionable pay</strong> — fewer extra PAs or on-call in the second half of the year<br/>
                  4. <strong>Route private income to Ltd Co</strong> — income inside the company does not count towards adjusted income<br/>
                  5. <strong>Use carry forward</strong> — {fmt(res.totalCF)} of unused allowance from prior years may offset the breach
                </div>
              </div>
            ):(
              <div style={{background:"#001a08",border:"2px solid #4ade80",borderRadius:10,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,color:"#4ade80",marginBottom:5}}>✅ No Breach Projected This Year</div>
                <div style={{fontSize:12,color:"#9ab8a8",lineHeight:1.6}}>Your estimated pension input ({fmt(res.penInput)}) is within your tapered AA ({fmt(res.taperedAA)}). You can continue contributing to the NHS pension throughout {yr}. Remaining headroom: <strong>{fmt(res.aaRemaining)}</strong>{res.totalCF>0?` (${fmt(res.effectiveAA-res.penInput)} including carry forward)`:""}.
                </div>
              </div>
            )}
          </div>

          {res.thr>200000&&<IB type="warning" title="Tapered AA Applies" body={`Threshold income ${fmt(res.thr)} exceeds £200,000. AA reduces by £1 per £2 of adjusted income above £260,000 (adjusted: ${fmt(res.adj)}). Minimum AA is £10,000.`}/>}

          {/* DIRECTOR LOAN */}
          {d.hasLtd&&d.directorLoan>0&&<>
            <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",margin:"20px 0 9px",fontFamily:"Georgia,serif"}}>💼 Director Loan Account</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
              <DC label="Loan Balance" value={d.directorLoan} warn={d.directorLoan>10000}/>
              <DC label="Benefit in Kind (annual)" value={res.dlBIK} warn sub="Taxed at your marginal rate"/>
              {d.directorLoan>10000&&<DC label="S455 Charge (if not repaid)" value={res.dlS455} red sub="33.75% — recoverable on repayment"/>}
              <DC label="BIK Income Tax Cost (est.)" value={res.dlBIK*0.40} warn sub="At 40% marginal rate"/>
            </div>
            {d.directorLoan>10000&&<IB type="danger" title="Director Loan > £10,000" body={`Loans over £10,000 create a taxable benefit-in-kind (${fmt(res.dlBIK)}/yr at HMRC official rate). If not repaid within 9 months of your company year-end, a s455 charge of ${fmt(res.dlS455)} applies to the company — refundable only when the loan is repaid. Consider declaring a dividend or salary to clear the balance promptly.`}/>}
          </>}

          {/* RETAINED PROFITS */}
          {d.hasLtd&&d.retainedProfitBf>0&&res.retainedAnalysis&&<>
            <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",margin:"20px 0 9px",fontFamily:"Georgia,serif"}}>🏦 Retained Profits Analysis</div>
            <div style={{background:"#0a1f14",border:"1px solid #1e3d28",borderRadius:12,padding:18,marginBottom:11}}>
              <div style={{fontSize:12,color:"#a0c4b0",marginBottom:12}}>You have <strong style={{color:"#38bdf8"}}>{fmt(d.retainedProfitBf)}</strong> of retained profits in your company. Here's how they could be extracted:</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:12}}>
                <div style={{background:"#051509",borderRadius:9,padding:12,textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#5a8a6a",marginBottom:3}}>BASIC RATE CAPACITY</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#4ade80",fontFamily:"monospace"}}>{fmt(res.retainedAnalysis.basicAvail)}</div>
                  <div style={{fontSize:9,color:"#4a6a5a"}}>Can be extracted at 8.75%</div>
                </div>
                <div style={{background:"#051509",borderRadius:9,padding:12,textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#5a8a6a",marginBottom:3}}>TAX ON EXTRACTION</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#f59e0b",fontFamily:"monospace"}}>{fmt(res.retainedAnalysis.taxOnExtract)}</div>
                  <div style={{fontSize:9,color:"#4a6a5a"}}>If extracted this year</div>
                </div>
                <div style={{background:"#051509",borderRadius:9,padding:12,textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#5a8a6a",marginBottom:3}}>NET RECEIPT</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#4ade80",fontFamily:"monospace"}}>{fmt(res.retainedAnalysis.netAfterTax)}</div>
                  <div style={{fontSize:9,color:"#4a6a5a"}}>After dividend tax</div>
                </div>
              </div>
              <IB type="info" title="Optimal extraction strategy" body={`Your current personal income (${fmt(res.gross)}) means you have ${fmt(res.retainedAnalysis.basicAvail)} of basic rate capacity for dividends this year. Profits extracted within this capacity are taxed at only 8.75%. Profits above this level face 33.75% dividend tax. Consider timing extraction for lower-income years (sabbatical, part-time, or retirement) to minimise the tax rate.`}/>
            </div>
          </>}

          {/* LTD STRATEGIES */}
          {res.strategies&&res.strategies.length>0&&<>
            <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",margin:"20px 0 9px",fontFamily:"Georgia,serif"}}>🏢 Ltd Company Tax Strategies — {yr}</div>
            <div style={{fontSize:12,color:"#5a8a6a",marginBottom:12,lineHeight:1.5}}>Company gross profit: <strong style={{color:"#a0c4b0"}}>{fmt(d.ltdGrossProfit)}</strong>. All {res.strategies.length} strategies ranked by total tax (lowest first). ⭐ = most efficient.</div>

            {res.strategies.map((s,i)=>(
              <div key={i} style={{background:i===0?"#001a08":"#0a1f14",border:`2px solid ${i===0?"#4ade80":"#1e3d28"}`,borderRadius:12,padding:17,marginBottom:11}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:7}}>
                  <div style={{fontSize:13,fontWeight:700,color:i===0?"#4ade80":"#a0c4b0"}}>{i===0?"⭐ ":i+1+". "}{s.name}</div>
                  <div style={{fontSize:15,fontWeight:700,color:i===0?"#4ade80":"#38bdf8",fontFamily:"monospace"}}>Total tax: {fmt(s.total)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Corp Tax",s.ct,"#fb923c"],["Personal Tax",s.personalTax,"#fb923c"],s.retained>0?["Retained",s.retained,"#38bdf8"]:["Emp NI",s.empNI,"#a78bfa"]].map(([l,v,c])=>(
                    <div key={l} style={{background:"#000a00",borderRadius:8,padding:9,textAlign:"center"}}>
                      <div style={{fontSize:9,color:"#5a8a6a",marginBottom:2,textTransform:"uppercase"}}>{l}</div>
                      <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"monospace"}}>{fmt(v)}</div>
                    </div>
                  ))}
                </div>
                {s.divDetails&&s.divDetails.length>0&&(
                  <div style={{background:"#000a00",borderRadius:8,padding:10,marginBottom:10}}>
                    <div style={{fontSize:9,color:"#5a8a6a",marginBottom:6,textTransform:"uppercase"}}>Dividend allocation</div>
                    {s.divDetails.map((dd,j)=>(
                      <div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#a0c4b0",marginBottom:3}}>
                        <span>{dd.name}</span>
                        <span style={{fontFamily:"monospace"}}>{fmt(dd.amount)} <span style={{color:"#f87171"}}>({fmt(dd.tax)} tax)</span></span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontSize:11,color:"#5a8a6a",lineHeight:1.6}}>{s.desc}</div>
                {i===0&&res.strategies.length>1&&(
                  <div style={{fontSize:11,color:"#4ade80",marginTop:8,fontWeight:600}}>
                    Saving vs next best: {fmt(res.strategies[1].total-s.total)} &nbsp;·&nbsp; vs least efficient: {fmt(res.strategies.at(-1).total-s.total)}
                  </div>
                )}
              </div>
            ))}

            <IB type="warning" title="HMRC income shifting — legal risk" body="Paying dividends to a spouse or family members is a legitimate strategy but HMRC scrutinises these arrangements under the settlements legislation (ITTOIA 2005 s624). The Arctic Systems case established ordinary shares between spouses can be legitimate, but arrangements lacking commercial substance are high-risk. Adult children only — dividends to minor children are taxed at the parent's rate. Always take specialist legal and tax advice before implementing."/>

            {d.ltdPrivateIncome>0&&<IB type="info" title={`AA benefit: ${fmt(d.ltdPrivateIncome)} inside Ltd Co not counted`} body={`This income does not count towards your personal adjusted income for AA tapering. If received personally, your adjusted income would be ${fmt(res.adj+d.ltdPrivateIncome)} — potentially reducing your tapered AA further and creating or increasing an AA charge.`}/>}
          </>}

          {/* SAVE */}
          <div style={{background:"#001428",border:"2px solid #38bdf8",borderRadius:12,padding:20,marginTop:22,textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:7}}>📄</div>
            <div style={{fontSize:14,fontWeight:700,color:"#e2f0e8",marginBottom:6}}>Save or Print Your Report</div>
            <p style={{fontSize:12,color:"#5a8a6a",marginBottom:14,lineHeight:1.6}}>Opens a print-ready report in a new tab. Use <strong style={{color:"#93c5fd"}}>File → Print → Save as PDF</strong> to keep a copy.</p>
            <button onClick={()=>printReport(d,res)} style={{padding:"12px 26px",background:"linear-gradient(90deg,#003d20,#005eb8)",border:"2px solid #38bdf8",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:9}}>🖨️ Open Print-Ready Report</button>
            <div style={{fontSize:10,color:"#3a5a4a"}}>No login · No email · Works on all browsers</div>
          </div>

          <div style={{background:"#050c07",border:"1px solid #1a2a1a",borderRadius:10,padding:13,marginTop:14}}>
            <div style={{fontSize:10,color:"#3a5a3a",lineHeight:1.7}}><strong style={{color:"#4a6a4a"}}>Disclaimer:</strong> General guidance only. Not financial, tax or legal advice. Estimates based on {yr} published rates. NHS pension AA complex — verify against actual statements. Family income splitting carries HMRC risk. Director loans over £10k trigger s455 charge. Consult a qualified financial adviser.</div>
          </div>

          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button onClick={()=>{setPhase("form");setStep(0);}} style={{flex:1,padding:"11px",background:"transparent",border:"2px solid #1e3d28",borderRadius:8,color:"#7aaa8a",fontSize:12,cursor:"pointer"}}>← Edit</button>
            <button onClick={()=>{setPhase("disclaimer");setRes(null);setAgreed(false);}} style={{flex:1,padding:"11px",background:"transparent",border:"2px solid #1e3d28",borderRadius:8,color:"#7aaa8a",fontSize:12,cursor:"pointer"}}>New Calc</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
