/* ════════════════════════════════════════════════════════
   NHSFinanceTool.co.uk — Shared Application JS
   Same shared UI system as Cookie-Free.co.uk (same visual
   family, separate brand). Contains: site-wide UI behaviour
   (leaving-site modal, disclaimer splash, cookie notice),
   navigation helpers, and the three NHS calculators.
   ════════════════════════════════════════════════════════ */

// ── LEAVING SITE MODAL ──────────────────────────────────
var leavingUrl = '';
function leavesite(url, name, desc, icon) {
  leavingUrl = url;
  document.getElementById('leaving-name').textContent = name;
  document.getElementById('leaving-desc').textContent = desc;
  document.getElementById('leaving-icon').textContent = icon || '🔗';
  document.getElementById('leaving-modal').style.display = 'flex';
  return false;
}
function closeLeavingModal() {
  document.getElementById('leaving-modal').style.display = 'none';
  leavingUrl = '';
}
function proceedToPartnerSite() {
  if (leavingUrl) window.open(leavingUrl, '_blank', 'noopener');
  closeLeavingModal();
}

// ── DISCLAIMER SPLASH ───────────────────────────────────
var splashChecked = false;

function toggleSplashCheck() {
  splashChecked = !splashChecked;
  var box = document.getElementById('splash-checkbox');
  var btn = document.getElementById('splash-btn');
  if (splashChecked) {
    box.style.background = '#00843D';
    box.style.borderColor = '#00843D';
    box.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.disabled = false;
    btn.style.background = '#00843D';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.textContent = 'I understand — enter the site →';
  } else {
    box.style.background = '#fff';
    box.style.borderColor = '#D0D7DE';
    box.innerHTML = '';
    btn.disabled = true;
    btn.style.background = '#D0D7DE';
    btn.style.color = '#8A9BB0';
    btn.style.cursor = 'not-allowed';
    btn.textContent = 'Tick the box above to continue →';
  }
}

function acceptDisclaimer() {
  if (!splashChecked) return;
  document.getElementById('disclaimer-splash').style.display = 'none';
  try { localStorage.setItem('nhsft_disclaimer_v1', '1'); } catch (e) {}
}

function closeSplashShowPrivacy() {
  acceptDisclaimer();
  window.location.href = '/privacy/';
}

// Show splash on load unless already accepted
(function () {
  try {
    if (localStorage.getItem('nhsft_disclaimer_v1') !== '1') {
      document.getElementById('disclaimer-splash').style.display = 'flex';
    }
  } catch (e) {
    document.getElementById('disclaimer-splash').style.display = 'flex';
  }
})();

// ── COOKIE NOTICE ────────────────────────────────────────
function acceptCookies() {
  document.getElementById('cookie-banner').style.display = 'none';
  try { localStorage.setItem('nhsft_cookie_notice', '1'); } catch (e) {}
}
function showCookieInfo() {
  document.getElementById('cookie-modal').style.display = 'flex';
}
function closeCookieInfo() {
  document.getElementById('cookie-modal').style.display = 'none';
}
try { if (localStorage.getItem('nhsft_cookie_notice') === '1') { document.getElementById('cookie-banner').style.display = 'none'; } } catch (e) {}

// ── URL MAP (this site) ─────────────────────────────────
var NHSFT_URL_MAP = {
  "home": "/",
  "privacy": "/privacy/",
  "takehome": "/take-home-pay-calculator/",
  "aa": "/pension-annual-allowance-calculator/",
  "ltd": "/ltd-company-tax-calculator/",
  "overtime": "/nhs-overtime-annual-allowance-calculator/",
  "shouldiltd": "/should-i-set-up-a-limited-company/",
  "salsac": "/salary-sacrifice-true-cost-calculator/",
  "promotion": "/promotion-band-change-calculator/",
  "pensionproj": "/nhs-pension-projector/",
  "parttime": "/part-time-ltft-calculator/",
  "locum": "/locum-bank-shift-optimiser/",
  "optout": "/nhs-pension-opt-out-calculator/",
  "selfassess": "/self-assessment-tax-estimator/",
  "mortgage": "/nhs-mortgage-affordability-calculator/",
  "annualleave": "/nhs-annual-leave-calculator/",
  "studentloan": "/student-loan-repayment-calculator/"
};
function showPage(id) {
  window.location.href = NHSFT_URL_MAP[id] || ('/' + id + '/');
}

// ── SHARED RESULT-FORMATTING HELPERS (same as Cookie-Free) ──
function tv(id) { const e = document.getElementById(id); if (!e) return 0; const v = parseFloat(e.value); return isNaN(v) ? 0 : v; }
function tval(id) { const e = document.getElementById(id); return e ? e.value : ''; }
function tchecked(id) { const e = document.getElementById(id); return e ? e.checked : false; }
function fmtC(n) { const s = n < 0 ? "-" : ""; return s + "£" + Math.round(Math.abs(n)).toLocaleString("en-GB"); }
function fmtCD(n) { return "£" + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pctC(n) { return n.toFixed(2) + "%"; }
function resultBox(content) { return `<div class="results-box show" style="margin-top:20px;">${content}</div>`; }
function heroResult(label, value, sub) { return `<div class="result-hero"><div class="result-hero-label">${label}</div><div class="result-hero-value">${value}</div><div class="result-hero-sub">${sub}</div></div>`; }
function resultGrid(cards) { return `<div class="result-grid">${cards.map(([l, v, cls]) => `<div class="result-card"><div class="result-card-label">${l}</div><div class="result-card-value ${cls || ""}">${v}</div></div>`).join("")}</div>`; }
function resultNote(txt) { return `<div class="result-note">${txt}</div>`; }
function resultTable(headers, rows) {
  let h = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  let r = rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");
  return `<table class="result-table">${h}${r}</table>`;
}
function alertBox(type, title, body) {
  const C = { danger: { bg: "#FEF2F2", br: "#EF4444", tc: "#991B1B", ic: "🚨" }, warning: { bg: "#FFF7ED", br: "#F59E0B", tc: "#92400E", ic: "⚠️" }, info: { bg: "#EFF6FF", br: "#93C5FD", tc: "#1E40AF", ic: "ℹ️" }, success: { bg: "#F0FDF4", br: "#4ADE80", tc: "#166534", ic: "✅" } }[type] || {};
  return `<div style="background:${C.bg};border:2px solid ${C.br};border-radius:10px;padding:14px 16px;margin:10px 0;"><div style="font-size:13px;font-weight:800;color:${C.tc};margin-bottom:6px;">${C.ic} ${title}</div><div style="font-size:13px;color:${C.tc};line-height:1.7;">${body}</div></div>`;
}

/* ══════════════════════════════════════════════════════
   TAX YEAR DATA — 2023/24 to 2026/27
   (identical figures to the original NHS Financial Planner)
   ══════════════════════════════════════════════════════ */
const NHSFT_TY = {
  "2023/24": { label: "2023/24", pa: 12570, basic: 37700, niPT: 12570, niUEL: 50270, niMain: 0.10, niUp: 0.02, stdAA: 40000, tapThr: 200000, tapAdj: 260000, minAA: 10000, cLow: 0.19, cHigh: 0.25, cLL: 50000, cHL: 250000, divA: 1000, dB: 0.0875, dH: 0.3375, penRates: [[13259, .051], [26831, .065], [32691, .083], [49078, .093], [62924, .1268], [Infinity, .1265]], empR: 0.2068 },
  "2024/25": { label: "2024/25", pa: 12570, basic: 37700, niPT: 12570, niUEL: 50270, niMain: 0.08, niUp: 0.02, stdAA: 60000, tapThr: 200000, tapAdj: 260000, minAA: 10000, cLow: 0.19, cHigh: 0.25, cLL: 50000, cHL: 250000, divA: 500, dB: 0.0875, dH: 0.3375, penRates: [[13259, .051], [26831, .065], [32691, .083], [49078, .093], [62924, .1268], [Infinity, .1265]], empR: 0.2068 },
  "2025/26": { label: "2025/26", pa: 12570, basic: 37700, niPT: 12570, niUEL: 50270, niMain: 0.08, niUp: 0.02, stdAA: 60000, tapThr: 200000, tapAdj: 260000, minAA: 10000, cLow: 0.19, cHigh: 0.25, cLL: 50000, cHL: 250000, divA: 500, dB: 0.0875, dH: 0.3375, penRates: [[13259, .051], [26831, .065], [32691, .083], [49078, .093], [62924, .1268], [Infinity, .1265]], empR: 0.2068 },
  "2026/27": { label: "2026/27", pa: 12570, basic: 37700, niPT: 12570, niUEL: 50270, niMain: 0.08, niUp: 0.02, stdAA: 60000, tapThr: 200000, tapAdj: 260000, minAA: 10000, cLow: 0.19, cHigh: 0.25, cLL: 50000, cHL: 250000, divA: 500, dB: 0.0875, dH: 0.3375, penRates: [[13259, .051], [26831, .065], [32691, .083], [49078, .093], [62924, .1268], [Infinity, .1265]], empR: 0.2068 }
};
const NHSFT_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const NHSFT_BANDS = {
  "Band 2 — £25,272": 25272, "Band 3 (Entry) — £25,760": 25760, "Band 3 (Top) — £27,472": 27472,
  "Band 4 (Entry) — £28,394": 28394, "Band 4 (Top) — £31,157": 31157,
  "Band 5 (Entry) — £32,073": 32073, "Band 5 (Top) — £39,043": 39043,
  "Band 6 (Entry) — £39,959": 39959, "Band 6 (Top) — £48,113": 48113,
  "Band 7 (Entry) — £49,388": 49388, "Band 7 (Top) — £56,516": 56516,
  "Band 8a (Entry) — £57,528": 57528, "Band 8a (Top) — £64,750": 64750,
  "Band 8b (Entry) — £66,582": 66582, "Band 8b (Top) — £77,367": 77367,
  "Band 8c (Entry) — £79,505": 79505, "Band 8c (Top) — £91,609": 91609,
  "Band 8d (Entry) — £94,357": 94357, "Band 8d (Top) — £108,813": 108813,
  "Band 9 (Entry) — £112,782": 112782, "Band 9 (Top) — £129,783": 129783,
  "Foundation Year 1 (F1) — £41,226": 41226, "Foundation Year 2 (F2) — £47,610": 47610,
  "CT1 / ST1 (Registrar) — £55,355": 55355, "CT2 / ST2 (Registrar) — £55,355": 55355,
  "CT3 / ST3 (Registrar) — £67,325": 67325, "CT4 / ST4 (Registrar) — £67,998": 67998,
  "ST5 (Registrar) — £67,998": 67998, "ST6 (Registrar) — £77,348": 77348,
  "ST7 (Registrar) — £77,348": 77348, "ST8 (Registrar) — £77,348": 77348,
  "GP Trainee (GPST1) — £55,355": 55355,
  "Consultant Threshold 1 (entry) — £113,565": 113565, "Consultant Threshold 2a — £120,249": 120249,
  "Consultant Threshold 2b — £123,672": 123672, "Consultant Threshold 3 — £135,645": 135645,
  "Consultant Threshold 4 (top) — £150,569": 150569,
  "GP (Salaried, fully qualified) — £73,864": 73864, "Other / enter manually": 0
};

/* ── CORE MATHS (identical logic to the original tool) ── */
function nhsftIncomeTax(gross, scot, ty) {
  const r = NHSFT_TY[ty];
  const pa = gross > 125140 ? 0 : gross > 100000 ? r.pa - Math.min((gross - 100000) / 2, r.pa) : r.pa;
  const t = Math.max(0, gross - pa);
  if (scot) {
    let tax = 0, rem = t;
    for (const [w, rt] of [[2306, .19], [13991, .20], [31092, .21], [62430, .42], [Infinity, .47]]) { const c = Math.min(rem, w); tax += c * rt; rem -= c; if (rem <= 0) break; }
    return Math.max(0, tax);
  }
  if (t <= r.basic) return t * .20;
  if (t <= 125140) return r.basic * .20 + (t - r.basic) * .40;
  return r.basic * .20 + (125140 - r.basic) * .40 + (t - 125140) * .45;
}
function nhsftNI(s, ty) { const r = NHSFT_TY[ty]; if (s <= r.niPT) return 0; if (s <= r.niUEL) return (s - r.niPT) * r.niMain; return (r.niUEL - r.niPT) * r.niMain + (s - r.niUEL) * r.niUp; }
function nhsftPen(p, ty) { for (const [lim, rate] of NHSFT_TY[ty].penRates) if (p <= lim) return p * rate; return p * NHSFT_TY[ty].penRates.at(-1)[1]; }
function nhsftPIA(cur, prev) { const p = prev || cur; return Math.max(0, ((p / 54) + (cur / 54)) * 16 - (p / 54) * 16 * 1.031); }
function nhsftTapAA(adj, thr, ty) { const r = NHSFT_TY[ty]; if (thr <= r.tapThr || adj <= r.tapAdj) return r.stdAA; return Math.max(r.minAA, r.stdAA - (adj - r.tapAdj) / 2); }
function nhsftCorpTax(profit, ty) { const r = NHSFT_TY[ty]; if (profit <= 0) return 0; if (profit <= r.cLL) return profit * r.cLow; if (profit <= r.cHL) { const mr = ((r.cHL - profit) / (r.cHL - r.cLL)) * (r.cHigh - r.cLow); return profit * (r.cHigh - mr); } return profit * r.cHigh; }
function nhsftDivTax(div, otherGross, ty) { const r = NHSFT_TY[ty]; const taxable = Math.max(0, div - r.divA); const basicLeft = Math.max(0, r.pa + r.basic - otherGross); const inB = Math.min(taxable, basicLeft); const inH = Math.max(0, taxable - basicLeft); return inB * r.dB + inH * r.dH; }
function nhsftDirLoanBIK(balance) { return balance * 0.0225; }
function nhsftRetainedAnalysis(retained, futureGross, ty) {
  const r = NHSFT_TY[ty];
  const basicAvail = Math.max(0, r.pa + r.basic - futureGross);
  const inBasic = Math.min(retained, basicAvail);
  const inHigher = Math.max(0, retained - basicAvail);
  const taxOnExtract = inBasic * r.dB + inHigher * r.dH;
  return { basicAvail, inBasic, inHigher, taxOnExtract, netAfterTax: retained - taxOnExtract };
}

/* ══════════════════════════════════════════════════════
   CALCULATOR 1 — NHS TAKE-HOME PAY
   ══════════════════════════════════════════════════════ */
function nhsftBandChange() {
  const band = tval("th-band");
  document.getElementById("th-consultant-row").style.display = band.startsWith("Consultant") ? "block" : "none";
  document.getElementById("th-band-row").style.display = band.startsWith("Band") ? "block" : "none";
  const isTraineeGrade = band && band !== "Other / enter manually" && !band.startsWith("Consultant") && !band.startsWith("Band");
  document.getElementById("th-trainee-row").style.display = isTraineeGrade ? "block" : "none";
  nhsftBandRecalc();
}
function nhsftBandRecalc() {
  const band = tval("th-band");
  const ft = NHSFT_BANDS[band] || 0;
  if (!band || band === "Other / enter manually") return;
  if (band.startsWith("Consultant")) {
    const pas = tv("th-pas") || 10;
    document.getElementById("th-salary").value = Math.round((ft / 10) * pas);
  } else if (band.startsWith("Band")) {
    const hrs = tv("th-hours") || 37.5;
    document.getElementById("th-salary").value = Math.round(ft * (hrs / 37.5));
  } else {
    const ltft = tv("th-ltft") || 100;
    document.getElementById("th-salary").value = Math.round(ft * (ltft / 100));
  }
}
function calcTakeHome() {
  const ty = tval("th-tyear"), scot = tchecked("th-scotland");
  const salary = tv("th-salary");
  if (!salary) { alert("Please enter your annual NHS basic salary."); return; }
  const preTax = tv("th-salsac") + tv("th-carlease") + tv("th-cycle") + tv("th-tech");
  const pen = nhsftPen(salary, ty);
  const employerOptOutAnnual = tv("th-optout") * 12;
  const niable = salary + tv("th-overtime") + tv("th-addpas") + tv("th-nciaamt") + tv("th-onclall") + employerOptOutAnnual - preTax;
  const empInc = niable - pen;
  const privInc = tv("th-private") + tv("th-othermed");
  const othInc = tv("th-interest") + tv("th-dividend") + tv("th-other");
  const btl = Math.max(0, tv("th-btl"));
  const gross = empInc + privInc + othInc + btl;
  const tax = Math.max(0, nhsftIncomeTax(gross, scot, ty));
  const ni = nhsftNI(niable, ty);
  const takeHome = niable + privInc + othInc + btl - tax - ni - pen;

  const out = document.getElementById("th-out");
  out.innerHTML = resultBox(
    heroResult("Estimated Annual Take-Home Pay", fmtC(takeHome), fmtC(takeHome / 12) + " per month") +
    resultGrid([
      ["Gross Income", fmtC(gross), ""],
      ["Income Tax", "−" + fmtC(tax), "red"],
      ["National Insurance", "−" + fmtC(ni), "red"],
      ["NHS Pension Contribution", "−" + fmtC(pen), "red"],
      ["Pre-Tax Deductions", "−" + fmtC(preTax), "red"],
      ["Take-Home (annual)", fmtC(takeHome), "green"]
    ]) +
    resultNote(`Tax year ${ty}${scot ? " · Scottish rates applied" : ""}. This is an estimate based on the figures you entered — check against your actual payslip, which may include other deductions such as student loan repayments or court orders that this calculator does not cover.`)
  );
  showRes("th-out");
}
function showRes(id) { const el = document.getElementById(id); if (el) { el.classList.add("show"); el.scrollIntoView({ behavior: "smooth", block: "nearest" }); } }

/* ══════════════════════════════════════════════════════
   CALCULATOR 2 — NHS PENSION ANNUAL ALLOWANCE
   (with month-by-month breach projection, carry forward)
   ══════════════════════════════════════════════════════ */
function calcNHSAA() {
  const ty = tval("aa-tyear"), scot = tchecked("aa-scotland");
  const salary = tv("aa-salary");
  if (!salary) { alert("Please enter your NHS pensionable pay for this year."); return; }
  const prevPay = tv("aa-prevpay") || salary;
  const avcTotal = tv("aa-avc") + tv("aa-sipp");
  const nhsPenInput = nhsftPIA(salary, prevPay);
  const penInput = nhsPenInput + avcTotal;

  const otherIncome = tv("aa-other");
  const empContrib = salary * NHSFT_TY[ty].empR;
  const gross = salary + otherIncome;
  const thr = gross - tv("aa-personalpen");
  const adj = thr + empContrib;
  const tAA = nhsftTapAA(adj, thr, ty);

  let totalCF;
  if (tval("aa-mode") === "detailed") {
    totalCF = 0;
    for (let i = 1; i <= 3; i++) {
      const pia = tv("aa-py" + i + "-pia"), aa = tv("aa-py" + i + "-aa") || 60000;
      totalCF += Math.max(0, aa - pia);
    }
  } else {
    totalCF = tv("aa-cf1") + tv("aa-cf2") + tv("aa-cf3");
  }
  totalCF = Math.max(0, totalCF);
  const effectiveAA = tAA + totalCF;
  const monthlyAccrual = penInput / 12;
  const mRemTapered = monthlyAccrual > 0 ? Math.min(12, Math.floor(tAA / monthlyAccrual)) : 12;
  const mRemEffective = monthlyAccrual > 0 ? Math.min(12, Math.floor(effectiveAA / monthlyAccrual)) : 12;
  const breachMonth = mRemTapered < 12 ? NHSFT_MONTHS[mRemTapered] : null;
  const breach = Math.max(0, penInput - tAA);
  const aaCharge = breach > 0 ? nhsftIncomeTax(gross + breach, scot, ty) - nhsftIncomeTax(gross, scot, ty) : 0;
  const aaRemaining = Math.max(0, tAA - penInput);

  let monthsHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:14px 0;">';
  NHSFT_MONTHS.forEach((m, i) => {
    const acc = (i + 1) * monthlyAccrual;
    const isCF = acc > effectiveAA, isBreach = acc > tAA;
    const bg = isCF ? "#FEF2F2" : isBreach ? "#FFF7ED" : "#F0FDF4";
    const br = isCF ? "#EF4444" : isBreach ? "#F59E0B" : "#4ADE80";
    const col = isCF ? "#991B1B" : isBreach ? "#92400E" : "#166534";
    monthsHtml += `<div style="width:52px;height:56px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${bg};border:2px solid ${br};gap:2px;"><div style="font-size:10px;font-weight:800;color:${col};">${m}</div><div style="font-size:9px;color:${col};font-family:monospace;">£${Math.round(acc / 1000)}k</div></div>`;
  });
  monthsHtml += '</div><div style="font-size:11px;color:var(--gray4);margin-bottom:10px;">🟢 Within tapered AA &nbsp;·&nbsp; 🟡 Within carry-forward only &nbsp;·&nbsp; 🔴 Projected breach</div>';

  let statusHtml;
  if (breach > 0) {
    statusHtml = alertBox("danger", `Annual Allowance Already Breached: ${fmtC(breach)}`, `Your estimated pension input (${fmtC(penInput)}) has already exceeded your tapered AA (${fmtC(tAA)}). Estimated additional tax charge: <strong>${fmtC(aaCharge)}</strong>.<br><br><strong>Options to consider:</strong> Scheme Pays (NHSBSA pays the charge, recovered from your pension) · check whether your ${fmtC(totalCF)} carry forward reduces or removes the charge · speak to a specialist financial adviser or accountant as soon as possible.`);
  } else if (breachMonth) {
    statusHtml = alertBox("warning", `Projected Breach: ${breachMonth}`, `Based on your current accrual rate, you're projected to hit your Annual Allowance limit of ${fmtC(tAA)} around <strong>${breachMonth}</strong>. Using your carry forward of ${fmtC(totalCF)}, the effective limit extends further.<br><br>We recommend speaking to a specialist financial adviser or accountant before that month. Options include Scheme Pays, reducing pensionable pay for the rest of the year, or using carry forward.`);
  } else {
    statusHtml = alertBox("success", "No Breach Projected This Year", `Your estimated pension input (${fmtC(penInput)}) is within your tapered AA (${fmtC(tAA)}). Remaining headroom: <strong>${fmtC(aaRemaining)}</strong>${totalCF > 0 ? ` (${fmtC(effectiveAA - penInput)} including carry forward)` : ""}.`);
  }

  const effectiveRemaining = Math.max(0, effectiveAA - penInput);
  let headroomHtml;
  if (effectiveRemaining <= 0) {
    headroomHtml = alertBox("danger", "No headroom left this year", `You've used up your Annual Allowance (including carry forward). Any further pension contributions this year — personal, via your Ltd company, or buying NHS Additional Pension — would add to your Annual Allowance charge rather than saving tax. Worth discussing Scheme Pays with a specialist adviser instead.`);
  } else {
    headroomHtml = alertBox("success", `You have ${fmtC(effectiveRemaining)} of headroom left this year`, `This is the most tax-efficient amount you could still put into a pension this year without triggering an AA charge. Two ways to use it: <strong>a personal or Ltd company pension contribution</strong> (see our <a href="/ltd-company-tax-calculator/" style="color:#166534;font-weight:700;">Ltd Company Tax Optimiser</a> if you have private income) — the company pays in directly and it's fully tax-deductible; or <strong>buying NHS Additional Pension</strong> through NHS Pensions, which increases your guaranteed retirement income rather than building a separate pot. Both use up the same headroom, so it isn't a case of doing both up to the full amount — get a specialist adviser's view on which suits you before committing either way.`);
  }

  const out = document.getElementById("aa-out");
  out.innerHTML = resultBox(
    resultGrid([
      ["Tapered AA", fmtC(tAA), ""],
      ["Pension Input This Year", fmtC(penInput), ""],
      ["Carry Forward (3 yrs)", fmtC(totalCF), ""],
      ["Effective Allowance", fmtC(effectiveAA), "green"],
      ["AA Remaining (tapered)", fmtC(aaRemaining), aaRemaining > 0 ? "green" : "red"],
      ["Threshold Income", fmtC(thr), ""]
    ]) +
    '<div style="font-size:13px;font-weight:800;color:var(--navy);margin:16px 0 4px;">Month-by-month accrual projection (Apr–Mar):</div>' +
    monthsHtml + statusHtml +
    (thr > 200000 ? alertBox("info", "Tapered AA Applies", `Threshold income exceeds £200,000, so your Annual Allowance is reduced by £1 for every £2 of adjusted income above £260,000 (your adjusted income: ${fmtC(adj)}). Minimum AA is £10,000.`) : "") +
    '<div style="font-size:13px;font-weight:800;color:var(--navy);margin:16px 0 4px;">💡 What can you do with this?</div>' +
    headroomHtml +
    resultNote("NHS pension Annual Allowance calculations are genuinely complex. Always cross-check this estimate against your Annual Benefit Statement at totalrewardstatements.nhs.uk before making any decisions, and seek specialist pension tax advice.")
  );
  showRes("aa-out");
}
function nhsftAAModeToggle() {
  const detailed = tval("aa-mode") === "detailed";
  document.getElementById("aa-simple-cf").style.display = detailed ? "none" : "block";
  document.getElementById("aa-detailed-cf").style.display = detailed ? "block" : "none";
}

/* ══════════════════════════════════════════════════════
   CALCULATOR — NHS OVERTIME / EXTRA SHIFTS AA HEADROOM
   Freehand rows so ad-hoc/strike rates can be entered.
   ══════════════════════════════════════════════════════ */
let nhsftShiftRowCount = 0;
function nhsftAddShiftRow(label, amount) {
  nhsftShiftRowCount++;
  const id = nhsftShiftRowCount;
  const wrap = document.getElementById("ov-shifts");
  const row = document.createElement("div");
  row.id = "ov-row-" + id;
  row.style = "display:grid;grid-template-columns:1fr 140px 34px;gap:8px;margin-bottom:8px;align-items:center;";
  row.innerHTML = `<input type="text" placeholder="e.g. Extra shift 12 July, strike cover" value="${label || ''}" id="ov-label-${id}" style="padding:9px 12px;border:1.5px solid var(--gray3);border-radius:8px;font-family:'Nunito',sans-serif;font-size:13px;">
    <div class="input-wrap has-prefix" style="margin:0;"><span class="input-prefix">£</span><input type="number" id="ov-amt-${id}" value="${amount || ''}" oninput="nhsftShiftTotal()" style="padding:9px 9px 9px 24px;"></div>
    <button onclick="document.getElementById('ov-row-${id}').remove(); nhsftShiftTotal();" style="background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;border-radius:8px;height:38px;cursor:pointer;font-weight:800;">✕</button>`;
  wrap.appendChild(row);
  nhsftShiftTotal();
}
function nhsftShiftTotal() {
  let total = 0;
  document.querySelectorAll('[id^="ov-amt-"]').forEach(el => total += parseFloat(el.value) || 0);
  const el = document.getElementById("ov-running-total");
  if (el) el.textContent = fmtC(total);
  return total;
}
function nhsftAAforExtra(salary, prevPay, otherIncome, personalPen, totalCF, ty, extra) {
  const totalSalary = salary + extra;
  const empContrib = totalSalary * NHSFT_TY[ty].empR;
  const gross = totalSalary + otherIncome;
  const thr = gross - personalPen;
  const adj = thr + empContrib;
  const tAA = nhsftTapAA(adj, thr, ty);
  const effectiveAA = tAA + Math.max(0, totalCF);
  const pia = nhsftPIA(totalSalary, prevPay);
  return { effectiveAA, pia, tAA };
}
function calcOvertimeHeadroom() {
  const ty = tval("ov-tyear");
  const salary = tv("ov-salary");
  if (!salary) { alert("Please enter your basic NHS pensionable pay for this year (before extra shifts)."); return; }
  const prevPay = tv("ov-prevpay") || salary;
  const otherIncome = tv("ov-other");
  const personalPen = tv("ov-personalpen");
  const totalCF = tv("ov-cf1") + tv("ov-cf2") + tv("ov-cf3");
  const extraTotal = nhsftShiftTotal();

  const base = nhsftAAforExtra(salary, prevPay, otherIncome, personalPen, totalCF, ty, 0);
  const withExtra = nhsftAAforExtra(salary, prevPay, otherIncome, personalPen, totalCF, ty, extraTotal);
  const extraPIA = withExtra.pia - base.pia;
  const totalPIA = withExtra.pia;
  const effectiveAA = withExtra.effectiveAA;
  const remaining = effectiveAA - totalPIA;

  let lo = 0, hi = 500000;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const r = nhsftAAforExtra(salary, prevPay, otherIncome, personalPen, totalCF, ty, mid);
    if (r.pia > r.effectiveAA) hi = mid; else lo = mid;
  }
  const maxExtra = lo;
  const roomLeft = Math.max(0, maxExtra - extraTotal);

  let status;
  if (remaining < 0) {
    status = alertBox("danger", `You've already gone ${fmtC(-remaining)} over`, `The extra shifts you've listed (${fmtC(extraTotal)}) take your estimated pension input to ${fmtC(totalPIA)} — above your effective allowance of ${fmtC(effectiveAA)}. Based on this, you could take on roughly ${fmtC(maxExtra)} of extra pensionable pay in total this year before breaching — you're currently ${fmtC(extraTotal - maxExtra)} past that point.`);
  } else {
    status = alertBox("success", `You can take on about ${fmtC(roomLeft)} more before breaching`, `Your extra shifts so far (${fmtC(extraTotal)}) still leave you with headroom. In total this year you could take on roughly ${fmtC(maxExtra)} of extra pensionable pay (on top of your basic pensionable pay) before your estimated pension input reaches your effective allowance of ${fmtC(effectiveAA)}.`);
  }

  document.getElementById("ov-out").innerHTML = resultBox(
    resultGrid([
      ["Extra Shifts Entered", fmtC(extraTotal), ""],
      ["Estimated Extra PIA", fmtC(extraPIA), ""],
      ["Total Estimated PIA", fmtC(totalPIA), ""],
      ["Effective Allowance", fmtC(effectiveAA), "green"],
      ["Max Extra Pensionable Pay (est.)", fmtC(maxExtra), "green"],
      ["Headroom Remaining", fmtC(roomLeft), roomLeft > 0 ? "green" : "red"]
    ]) + status +
    alertBox("warning", "Check these shifts are actually pensionable", "Not all extra payments count towards your NHS pension — this depends on your trust and the type of payment. Standard overtime, additional PAs, on-call and locum work booked through the NHS bank are usually pensionable; some ad-hoc payments, expenses or non-contractual one-off awards may not be. If a payment isn't pensionable, it doesn't count towards this calculation at all, but obviously still counts as taxable income.") +
    resultNote("This estimate assumes all the extra pay you list is pensionable and paid within the same tax year. It uses the same simplified PIA formula as our main Annual Allowance calculator — always cross-check against your Annual Benefit Statement, especially before turning down or accepting extra shifts based on this figure.")
  );
  showRes("ov-out");
}

/* ══════════════════════════════════════════════════════
   CALCULATOR — SALARY SACRIFICE TRUE COST
   Shows the real lifetime pension cost of sacrificing pay
   for a car lease, cycle to work, tech scheme, childcare
   vouchers, or additional pension (AVC) contributions.
   ══════════════════════════════════════════════════════ */
const NHSFT_SS_NOTES = {
  car: "England/Wales/NI: reduces pensionable pay. Scotland: also reduces pensionable pay (from December 2023).",
  cycle: "England/Wales/NI: reduces pensionable pay. Scotland: pension-neutral (exempt).",
  tech: "Reduces pensionable pay in all regions, including Scotland.",
  childcare: "Legacy scheme only (joined before Oct 2018). England/Wales/NI: reduces pensionable pay. Scotland: pension-neutral (exempt).",
  avc: "Does NOT reduce pensionable pay — you are buying additional pension directly, not sacrificing salary for a benefit. No CARE pension loss."
};
function nhsftSSSchemeChange() {
  const scheme = tval("ss-scheme");
  const note = document.getElementById("ss-scheme-note");
  note.textContent = NHSFT_SS_NOTES[scheme] || "";
}
function calcSalarySacrifice() {
  const ty = tval("ss-tyear"), scot = tchecked("ss-scotland");
  const salary = tv("ss-salary");
  if (!salary) { alert("Please enter your annual NHS salary."); return; }
  const age = tv("ss-age") || 38;
  const retire = tv("ss-retire") || 67;
  const monthly = tv("ss-monthly");
  const years = tv("ss-years") || 3;
  const cpi = tv("ss-cpi") || 2.5;
  const scheme = tval("ss-scheme");

  const annual = monthly * 12;
  const reduced = Math.max(0, salary - annual);
  const revalRate = (cpi + 1.5) / 100;
  const yearsToRetire = Math.max(1, retire - age);
  const yearsInRetire = Math.max(1, 88 - retire);

  const taxFull = nhsftIncomeTax(salary, scot, ty), taxRed = nhsftIncomeTax(reduced, scot, ty);
  const niFull = nhsftNI(salary, ty), niRed = nhsftNI(reduced, ty);
  const taxSaved = taxFull - taxRed, niSaved = niFull - niRed;
  const annualSaving = taxSaved + niSaved;
  const totalSaved = annualSaving * years;

  const schemeHasPensionImpact = scheme !== "avc";
  const scotExempt = scot && (scheme === "cycle" || scheme === "childcare");
  const actualPenImpact = schemeHasPensionImpact && !scotExempt;

  let annualPenLost = 0, lifetimePenLost = 0;
  if (actualPenImpact) {
    annualPenLost = annual / 54;
    for (let y = 0; y < years; y++) {
      lifetimePenLost += annualPenLost * Math.pow(1 + revalRate, yearsToRetire - y);
    }
    lifetimePenLost *= yearsInRetire;
  }

  const net = totalSaved - lifetimePenLost;
  const breakeven = annualSaving > 0 ? lifetimePenLost / annualSaving : null;

  let verdict;
  if (!actualPenImpact) {
    verdict = alertBox("success", "No pension impact", `${scotExempt ? "Scotland exemption applies — " : ""}This scheme has no CARE pension impact. You get the full tax/NI saving of ${fmtC(totalSaved)} over ${years} year${years > 1 ? "s" : ""} with no pension penalty.`);
  } else if (net >= 0) {
    verdict = alertBox("info", "Net position: likely worthwhile", `The ${fmtC(totalSaved)} tax/NI saving over ${years} years exceeds the estimated lifetime pension cost of ${fmtC(lifetimePenLost)}. This scheme may be worthwhile — but the pension loss is real and permanent, so only take it if you genuinely want and use the benefit.`);
  } else {
    verdict = alertBox("warning", "Net position: costs more than it saves", `The estimated lifetime pension cost of ${fmtC(lifetimePenLost)} exceeds the ${fmtC(totalSaved)} tax/NI saving. You'd need roughly ${Math.round(breakeven)} years in retirement just to break even. Over a full lifetime, this scheme is estimated to cost more than it saves.`);
  }

  document.getElementById("ss-out").innerHTML = resultBox(
    resultGrid([
      ["Annual Tax + NI Saving", fmtC(annualSaving), "green"],
      [`Total Saved (${years}yr)`, fmtC(totalSaved), "green"],
      ["Annual Pension Lost", actualPenImpact ? fmtC(annualPenLost) + "/yr" : "£0 — no impact", actualPenImpact ? "red" : ""],
      ["Lifetime Pension Lost", fmtC(lifetimePenLost), lifetimePenLost > 0 ? "red" : ""],
      ["Net Lifetime Position", (net >= 0 ? "+" : "−") + fmtC(Math.abs(net)), net >= 0 ? "green" : "red"],
      ["Breakeven (years in retirement)", breakeven ? Math.round(breakeven) + " years" : "N/A", ""]
    ]) + verdict +
    resultNote(`Assumes you live to age 88 and retire at ${retire}. The pension figure uses the NHS 2015 Scheme's 1/54 CARE accrual rate, revalued at CPI + 1.5% until retirement. This is a simplified lifetime estimate, not a substitute for a full pension projection — see your Annual Benefit Statement for your actual position.`)
  );
  showRes("ss-out");
}

/* ══════════════════════════════════════════════════════
   CALCULATOR 3 — LTD COMPANY TAX OPTIMISER
   (private practice / locum income via a limited company)
   ══════════════════════════════════════════════════════ */
function nhsftOptimise(grossProfit, personalOtherIncome, spouse, companyPensionAmount, ty) {
  const r = NHSFT_TY[ty];
  const strategies = [];
  const run = (name, desc, salaries, dividends, pension, retain) => {
    const totalSal = salaries.reduce((s, x) => s + x.amount, 0);
    const effectiveProfit = grossProfit - totalSal - pension;
    const ct = nhsftCorpTax(Math.max(0, effectiveProfit), ty);
    const netForDividend = Math.max(0, effectiveProfit - ct) * (1 - retain);
    const retained = Math.max(0, effectiveProfit - ct) * retain;
    let personalTax = 0; const divDetails = [];
    for (const d of dividends) {
      const amt = netForDividend * (d.pct / 100);
      const dt = nhsftDivTax(amt, d.otherIncome, ty);
      personalTax += dt;
      divDetails.push({ name: d.name, amount: amt, tax: dt });
    }
    const empNI = salaries.reduce((s, x) => s + Math.max(0, x.amount - 9100) * 0.138, 0);
    const total = ct + personalTax + empNI;
    strategies.push({ name, desc, total, ct, personalTax, empNI, retained, divDetails });
  };
  run("Director salary + full dividends", `Director pays self ${fmtC(r.pa)} salary, takes all post-corp-tax profit as dividends. Simplest structure.`,
    [{ name: "Director", amount: r.pa }], [{ name: "Director", pct: 100, otherIncome: personalOtherIncome }], 0, 0);
  run("Director salary + 20% retained", "Director takes salary + 80% of available profit as dividends, retains 20% in company for future flexibility.",
    [{ name: "Director", amount: r.pa }], [{ name: "Director", pct: 100, otherIncome: personalOtherIncome }], 0, 0.20);
  if (spouse) {
    run("50/50 dividend split with spouse", `Director salary ${fmtC(r.pa)}, post-corp-tax profit split 50/50 as dividends. Requires spouse to hold ordinary shares — HMRC settlements legislation applies, get advice.`,
      [{ name: "Director", amount: r.pa }], [{ name: "Director", pct: 50, otherIncome: personalOtherIncome }, { name: "Spouse", pct: 50, otherIncome: spouse }], 0, 0);
    run("Pension + spouse split + 10% retain", `Combines a company pension contribution (${fmtC(companyPensionAmount || Math.min(grossProfit * 0.15, 60000))}), a 50/50 dividend split with spouse, and 10% profit retention.`,
      [{ name: "Director", amount: r.pa }], [{ name: "Director", pct: 50, otherIncome: personalOtherIncome }, { name: "Spouse", pct: 50, otherIncome: spouse }], companyPensionAmount || Math.min(grossProfit * 0.15, 60000), 0.10);
  }
  const pensionAmt = companyPensionAmount > 0 ? companyPensionAmount : Math.min(grossProfit * 0.15, 60000);
  run("Salary + company pension + dividends", `Company contributes ${fmtC(pensionAmt)} to director SIPP/pension as an employer contribution (fully deductible, reduces corp tax and doesn't count towards personal Annual Allowance adjusted income in the same way). Remaining profit paid as dividends.`,
    [{ name: "Director", amount: r.pa }], [{ name: "Director", pct: 100, otherIncome: personalOtherIncome }], pensionAmt, 0);
  run("Maximum retention — wealth building in company", "Director takes minimum salary only, no dividends. All profit retained in the company, taxed at corporation tax rate only. Useful if personal income already means dividends would be taxed at 33.75%+ — extract in a lower-income year instead.",
    [{ name: "Director", amount: r.pa }], [], 0, 1.0);
  return strategies.sort((a, b) => a.total - b.total);
}
function calcLtdOptimiser() {
  const ty = tval("ltd-tyear");
  const grossProfit = tv("ltd-profit");
  if (!grossProfit) { alert("Please enter your Ltd company's gross profit before tax."); return; }
  const personalOther = tv("ltd-otherincome");
  const hasSpouse = tchecked("ltd-hasspouse");
  const spouseIncome = hasSpouse ? tv("ltd-spouseincome") : null;
  const companyPension = tv("ltd-pension");
  const directorLoan = tv("ltd-loan");
  const retainedBf = tv("ltd-retainedbf");

  const strategies = nhsftOptimise(grossProfit, personalOther, spouseIncome, companyPension, ty);
  let html = `<div style="font-size:13px;color:var(--gray5);margin-bottom:14px;">Company gross profit: <strong>${fmtC(grossProfit)}</strong>. All ${strategies.length} strategies ranked by total tax (lowest first). ⭐ = most efficient.</div>`;

  strategies.forEach((s, i) => {
    html += `<div style="background:${i === 0 ? "#F0FDF4" : "#F7F9FB"};border:2px solid ${i === 0 ? "#4ADE80" : "#EEF1F5"};border-radius:12px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:800;color:${i === 0 ? "#166534" : "var(--navy)"};">${i === 0 ? "⭐ " : (i + 1) + ". "}${s.name}</div>
        <div style="font-size:15px;font-weight:800;color:${i === 0 ? "#166534" : "var(--teal)"};font-family:monospace;">Total tax: ${fmtC(s.total)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:#fff;border-radius:8px;padding:8px;text-align:center;"><div style="font-size:9px;color:var(--gray4);text-transform:uppercase;">Corp Tax</div><div style="font-size:14px;font-weight:800;color:#E85D04;font-family:monospace;">${fmtC(s.ct)}</div></div>
        <div style="background:#fff;border-radius:8px;padding:8px;text-align:center;"><div style="font-size:9px;color:var(--gray4);text-transform:uppercase;">Personal Tax</div><div style="font-size:14px;font-weight:800;color:#E85D04;font-family:monospace;">${fmtC(s.personalTax)}</div></div>
        <div style="background:#fff;border-radius:8px;padding:8px;text-align:center;"><div style="font-size:9px;color:var(--gray4);text-transform:uppercase;">${s.retained > 0 ? "Retained" : "Employer NI"}</div><div style="font-size:14px;font-weight:800;color:var(--teal);font-family:monospace;">${fmtC(s.retained > 0 ? s.retained : s.empNI)}</div></div>
      </div>
      <div style="font-size:11px;color:var(--gray5);line-height:1.6;">${s.desc}</div>
      ${i === 0 && strategies.length > 1 ? `<div style="font-size:11px;color:#166534;margin-top:8px;font-weight:700;">Saving vs next best: ${fmtC(strategies[1].total - s.total)} · vs least efficient: ${fmtC(strategies.at(-1).total - s.total)}</div>` : ""}
    </div>`;
  });

  html += alertBox("warning", "HMRC income shifting — legal risk", "Paying dividends to a spouse or family member is a legitimate strategy, but HMRC scrutinises these arrangements under the settlements legislation (ITTOIA 2005 s624). The Arctic Systems case established that ordinary shares between spouses can be legitimate, but arrangements lacking commercial substance are high-risk. This applies to adult family members only — dividends to minor children are taxed at the parent's rate. Always take specialist legal and tax advice before implementing any income-splitting strategy.");

  if (directorLoan > 0) {
    const bik = nhsftDirLoanBIK(directorLoan);
    const s455 = directorLoan > 10000 ? directorLoan * 0.3375 : 0;
    html += `<div style="font-size:13px;font-weight:800;color:var(--navy);margin:20px 0 10px;">💼 Director Loan Account</div>` +
      resultGrid([["Loan Balance", fmtC(directorLoan), directorLoan > 10000 ? "red" : ""], ["Benefit in Kind (annual)", fmtC(bik), "red"]]) +
      (directorLoan > 10000 ? alertBox("danger", "Director Loan Over £10,000", `Loans over £10,000 create a taxable benefit-in-kind (${fmtC(bik)}/yr at HMRC's official rate). If not repaid within 9 months of your company year-end, a s455 charge of ${fmtC(s455)} applies to the company — refundable only once the loan is repaid. Consider declaring a dividend or salary to clear the balance promptly.`) : "");
  }

  if (retainedBf > 0) {
    const ra = nhsftRetainedAnalysis(retainedBf, grossProfit + personalOther, ty);
    html += `<div style="font-size:13px;font-weight:800;color:var(--navy);margin:20px 0 10px;">🏦 Retained Profits Analysis</div>` +
      `<div style="font-size:12px;color:var(--gray5);margin-bottom:10px;">You have <strong>${fmtC(retainedBf)}</strong> of retained profits in your company. Here's how they could be extracted:</div>` +
      resultGrid([["Basic Rate Capacity", fmtC(ra.basicAvail), "green"], ["Tax on Extraction", fmtC(ra.taxOnExtract), "red"], ["Net Receipt", fmtC(ra.netAfterTax), "green"]]) +
      alertBox("info", "Optimal extraction strategy", `Profits extracted within your basic rate capacity (${fmtC(ra.basicAvail)}) are taxed at only 8.75%. Profits above that face 33.75% dividend tax. Consider timing extraction for a lower-income year — a sabbatical, part-time work, or retirement.`);
  }

  html += resultNote("These strategies are general illustrations based on the figures you entered, not a recommendation. Family income-splitting and Ltd company structuring carry real HMRC risk and depend heavily on your personal circumstances. Always get advice from a qualified accountant before implementing any of these.");

  document.getElementById("ltd-out").innerHTML = resultBox(html);
  showRes("ltd-out");
}

/* ══════════════════════════════════════════════════════
   SHARED TOGGLE HELPERS (used by several tools below)
   ══════════════════════════════════════════════════════ */
function nhsftToggleEl(togId, wrapId) {
  const tog = document.getElementById(togId), wrap = document.getElementById(wrapId);
  const on = !tog.classList.contains("on");
  tog.classList.toggle("on", on); tog.classList.toggle("off", !on);
  wrap.style.display = on ? "block" : "none";
}
function nhsftToggleSwitch(togId) {
  const tog = document.getElementById(togId);
  const on = !tog.classList.contains("on");
  tog.classList.toggle("on", on); tog.classList.toggle("off", !on);
}
function nhsftIsOn(togId) { const t = document.getElementById(togId); return t && t.classList.contains("on"); }
function nhsftMonthlyPmt(loan, rate, years) {
  if (rate === 0) return loan / (years * 12);
  const r = rate / 100 / 12, n = years * 12;
  return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/* ══════════════════════════════════════════════════════
   TOOL — PROMOTION / BAND CHANGE CALCULATOR
   ══════════════════════════════════════════════════════ */
function nhsftPrFillSalary(which) {
  const sel = document.getElementById("pr-" + which + "-band");
  const salEl = document.getElementById("pr-" + which + "-sal");
  if (sel.value && sel.value !== "custom") salEl.value = sel.value;
  nhsftPrQuickCalc();
}
function nhsftPrQuickCalc() {
  const ty = tval("pr-tyear"), scot = tval("pr-scot") === "yes";
  const curSal = tv("pr-cur-sal"), newSal = tv("pr-new-sal");
  const curTH = curSal - nhsftIncomeTax(curSal, scot, ty) - nhsftNI(curSal, ty) - nhsftPen(curSal, ty);
  const newTH = newSal - nhsftIncomeTax(newSal, scot, ty) - nhsftNI(newSal, ty) - nhsftPen(newSal, ty);
  document.getElementById("pr-cur-th").textContent = fmtC(curTH) + "/yr";
  document.getElementById("pr-new-th").textContent = fmtC(newTH) + "/yr";
}
function calcPromotion() {
  const ty = tval("pr-tyear");
  const scot = tval("pr-scot") === "yes";
  const hrs = tv("pr-hours") || 37.5, retire = tv("pr-retire") || 20;
  const ratio = hrs / 37.5;
  const curSal = Math.round(tv("pr-cur-sal") * ratio), newSal = Math.round(tv("pr-new-sal") * ratio);

  const ct = nhsftIncomeTax(curSal, scot, ty), cni = nhsftNI(curSal, ty), cp = nhsftPen(curSal, ty), cth = curSal - ct - cni - cp;
  const nt = nhsftIncomeTax(newSal, scot, ty), nni = nhsftNI(newSal, ty), np = nhsftPen(newSal, ty), nth = newSal - nt - nni - np;

  const diff = nth - cth, salDiff = newSal - curSal, taxDiff = nt - ct, niDiff = nni - cni, penDiff = np - cp;
  const keepPct = salDiff > 0 ? (diff / salDiff) * 100 : 0;
  const marginal = salDiff > 0 ? ((taxDiff + niDiff) / salDiff) * 100 : 0;
  const curHrly = cth / (hrs * 52), newHrly = nth / (hrs * 52);

  const annualPenGain = salDiff / 54;
  const revalued = annualPenGain * Math.pow(1.035, retire);
  const lifetimePen = revalued * 20;

  const rows = [
    ["Gross salary", fmtC(curSal), fmtC(newSal), fmtC(salDiff)],
    ["Income tax", fmtC(ct), fmtC(nt), fmtC(taxDiff)],
    ["National Insurance", fmtC(cni), fmtC(nni), fmtC(niDiff)],
    ["NHS pension", fmtC(cp), fmtC(np), fmtC(penDiff)],
    ["Take-home", fmtC(cth), fmtC(nth), fmtC(diff)]
  ];

  document.getElementById("pr-out").innerHTML = resultBox(
    heroResult("Extra Take-Home Per Year", (diff >= 0 ? "+" : "−") + fmtC(Math.abs(diff)), fmtC(Math.abs(diff / 12)) + "/month · " + fmtC(Math.abs(diff / 52)) + "/week") +
    resultGrid([
      ["Gross Pay Rise", (salDiff >= 0 ? "+" : "−") + fmtC(Math.abs(salDiff)), ""],
      ["You Keep (per £1)", Math.round(keepPct) + "p", ""],
      ["Marginal Rate", pctC(marginal), ""],
      ["Net Hourly Gain", "+£" + (newHrly - curHrly).toFixed(2) + "/hr", "green"]
    ]) +
    resultTable(["Item", "Current", "After promotion", "Change"], rows) +
    alertBox("info", "Long-term pension benefit", `The higher salary adds ${fmtC(annualPenGain)}/yr to your NHS pension at retirement. Revalued over ${retire} years this becomes roughly ${fmtC(revalued)}/yr — worth an estimated ${fmtC(lifetimePen)} over a 20-year retirement. Total estimated benefit including take-home gains over your career: roughly ${fmtC(diff * retire + lifetimePen)}.`) +
    (newSal > 100000 ? alertBox("warning", "Personal Allowance trap", "Your new salary exceeds £100,000. Between £100,000–£125,140 your effective tax rate is 60% as your Personal Allowance is gradually withdrawn. Consider salary sacrifice to reduce gross pay below £100,000.") : "") +
    resultNote("Assumes the same pension tier applies throughout. Uses the tax year selected above and 2025/26 AfC pay scales as a reference — always check your own trust's exact figures.")
  );
  showRes("pr-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — NHS PENSION PROJECTOR
   ══════════════════════════════════════════════════════ */
function calcPensionProjector() {
  const salary = tv("pp-salary");
  if (!salary) { alert("Please enter your current annual salary."); return; }
  const age = tv("pp-age") || 38, served = tv("pp-served") || 10;
  const retire = tv("pp-retire") || 67, raise = (tv("pp-raise") || 2.5) / 100, cpiR = ((tv("pp-cpi") || 2.5) + 1.5) / 100;
  const ytr = Math.max(1, retire - age), yInR = Math.max(1, 88 - retire);

  let care = 0;
  for (let y = 1; y <= served; y++) {
    const ago = served - y;
    const sal = salary / Math.pow(1 + raise, ago);
    care += sal / 54 * Math.pow(1 + cpiR, ytr + ago);
  }
  for (let y2 = 1; y2 <= ytr; y2++) {
    const sal2 = salary * Math.pow(1 + raise, y2);
    care += sal2 / 54 * Math.pow(1 + cpiR, ytr - y2);
  }

  let p95 = 0, p08 = 0;
  if (tchecked("pp-1995-on")) { p95 = (tv("pp-sal95") * tv("pp-yrs95")) / 80; }
  if (tchecked("pp-2008-on")) { p08 = (tv("pp-sal08") * tv("pp-yrs08")) / 60; }

  const total = care + p95 + p08;
  const salAtRetire = salary * Math.pow(1 + raise, ytr);
  const ratio = salAtRetire > 0 ? (total / salAtRetire) * 100 : 0;
  const withState = total + 11502;
  const dis = salary * 2;

  let timelineRows = [];
  for (let yr = 5; yr <= ytr; yr += 5) {
    const salY = salary * Math.pow(1 + raise, yr);
    let penY = 0;
    for (let y3 = 1; y3 <= served + yr; y3++) {
      const ySince = (served + yr) - y3;
      const sY = salary / Math.pow(1 + raise, ySince - yr);
      if (sY > 0) penY += sY / 54 * Math.pow(1 + cpiR, Math.max(0, (ytr - yr) + (served + yr - y3)));
    }
    const isTarget = age + yr === retire;
    timelineRows.push(["+" + yr + " yrs", (age + yr) + (isTarget ? " 🎯" : ""), fmtC(salY), fmtC(penY) + "/yr"]);
  }

  let note;
  if (ratio >= 67) note = alertBox("success", "Strong replacement ratio", `A replacement ratio of ${Math.round(ratio)}% is well above the 50% guideline. Combined with the state pension your retirement income looks healthy.`);
  else if (ratio < 50) note = alertBox("warning", "Below the 50% guideline", `Your replacement ratio of ${Math.round(ratio)}% is below 50%. Consider increasing NHS AVC contributions or reviewing your retirement age.`);
  else note = alertBox("info", "Replacement ratio", `${Math.round(ratio)}%. With the state pension included: ${fmtC(withState)}/yr total estimated retirement income.`);

  document.getElementById("pp-out").innerHTML = resultBox(
    heroResult("Estimated Annual NHS Pension at Retirement", fmtC(total), fmtC(total / 12) + " per month") +
    resultGrid([
      ["2015 CARE Pension", fmtC(care) + "/yr", ""],
      ["1995 Section", p95 > 0 ? fmtC(p95) + "/yr" : "N/A", ""],
      ["2008 Section", p08 > 0 ? fmtC(p08) + "/yr" : "N/A", ""],
      ["Replacement Ratio", Math.round(ratio) + "%", ""],
      ["With State Pension", fmtC(withState) + "/yr", "green"],
      ["Death in Service (est.)", fmtC(dis), ""]
    ]) +
    '<div style="font-size:13px;font-weight:800;color:var(--navy);margin:16px 0 4px;">Pension growth timeline</div>' +
    resultTable(["Year", "Age", "Projected salary", "Pension if retired then"], timelineRows) +
    note +
    resultNote("Projections only, not guaranteed. 2015 CARE uses 1/54 accrual, CPI + 1.5% revaluation. 1995 Section = 1/80 final salary (excludes automatic lump sum from this total); 2008 Section = 1/60. State pension assumed at the full new rate. Always verify against your Annual Benefit Statement at totalrewardstatements.nhs.uk.")
  );
  showRes("pp-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — PART-TIME / LTFT CALCULATOR
   ══════════════════════════════════════════════════════ */
function nhsftPtUpdateLabel(which) {
  const hrs = parseFloat(document.getElementById("pt-" + which + "-hrs").value) || 37.5;
  const wte = Math.round(hrs / 37.5 * 100);
  document.getElementById("pt-" + which + "-label").textContent = hrs + "hrs (" + wte + "% WTE)";
}
function nhsftPtPreset(hrs) {
  document.getElementById("pt-new-hrs").value = hrs;
  nhsftPtUpdateLabel("new");
}
function calcPartTime() {
  const ty = tval("pt-tyear");
  const ftSal = tv("pt-salary");
  if (!ftSal) { alert("Please enter your full-time equivalent salary."); return; }
  const retire = tv("pt-retire") || 20, cpi = ((tv("pt-cpi") || 2.5) + 1.5) / 100;
  const scot = tval("pt-scot") === "yes";
  const curHrs = parseFloat(document.getElementById("pt-cur-hrs").value) || 37.5;
  const newHrs = parseFloat(document.getElementById("pt-new-hrs").value) || 30;
  const curSal = Math.round(ftSal * curHrs / 37.5), newSal = Math.round(ftSal * newHrs / 37.5);

  const ct = nhsftIncomeTax(curSal, scot, ty), cni = nhsftNI(curSal, ty), cp = nhsftPen(curSal, ty), cth = curSal - ct - cni - cp;
  const nt = nhsftIncomeTax(newSal, scot, ty), nni = nhsftNI(newSal, ty), np = nhsftPen(newSal, ty), nth = newSal - nt - nni - np;
  const diff = nth - cth, salDiff = newSal - curSal;
  const taxCushion = Math.abs(salDiff) - Math.abs(diff);
  const keepPct = salDiff !== 0 ? (diff / salDiff) * 100 : 0;
  const hoursFreed = curHrs - newHrs;
  const costPerHr = hoursFreed > 0 ? Math.abs(diff) / (hoursFreed * 52) : 0;
  const curAL = Math.round(27 * curHrs / 37.5), newAL = Math.round(27 * newHrs / 37.5);

  const annualPenLost = (curSal - newSal) / 54;
  let lifetimePenLost = 0;
  for (let y = 0; y < retire; y++) lifetimePenLost += annualPenLost * Math.pow(1 + cpi, retire - y);
  lifetimePenLost *= 20;

  document.getElementById("pt-out").innerHTML = resultBox(
    heroResult("Annual Take-Home Change", (diff >= 0 ? "+" : "−") + fmtC(Math.abs(diff)), fmtC(Math.abs(diff / 12)) + "/month · " + fmtC(Math.abs(diff / 52)) + "/week") +
    resultGrid([
      ["Salary Reduction", "−" + fmtC(Math.abs(salDiff)), "red"],
      ["Tax Cushion", fmtC(taxCushion), "green"],
      ["You Keep (per £1 cut)", Math.abs(Math.round(keepPct)) + "p", ""],
      ["Cost Per Free Hour", "£" + costPerHr.toFixed(2), ""],
      ["Annual Leave (est.)", newAL + " days (was " + curAL + ")", ""],
      ["Lifetime Pension Lost", fmtC(lifetimePenLost), "red"]
    ]) +
    alertBox("warning", "Long-term pension cost", `Reducing to ${newHrs}hrs costs ${fmtC(annualPenLost)}/yr in NHS pension at retirement. Over ${retire} years and a 20-year retirement, the estimated lifetime pension loss is ${fmtC(lifetimePenLost)} — significantly more than the ${fmtC(Math.abs(diff * retire))} total take-home reduction over the same period.`) +
    alertBox("success", "Time gained", `${hoursFreed.toFixed(1)} hours/week freed (roughly ${Math.round(hoursFreed / 7.5 * 10) / 10} days). Net cost of each freed hour: £${costPerHr.toFixed(2)} after tax savings.`) +
    resultNote("Assumes 27 days base annual leave entitlement, pro-rated. Pension assumes 2015 CARE 1/54 accrual. Not HR or financial advice.")
  );
  showRes("pt-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — LOCUM & BANK SHIFT OPTIMISER
   ══════════════════════════════════════════════════════ */
function calcLocum() {
  const ty = tval("lk-tyear");
  const nhsSal = tv("lk-salary");
  if (!nhsSal) { alert("Please enter your annual NHS basic salary."); return; }
  const rate = tv("lk-rate"), hrs = tv("lk-hrs") || 8;
  const mthShifts = tv("lk-mth") || 2, cf = tv("lk-cf") || 0;
  const weekend = tchecked("lk-weekend"), pensionable = tchecked("lk-pensionable");
  const effRate = rate * (weekend ? 1.3 : 1);
  const shiftsPerYear = mthShifts * 12, annualGross = effRate * hrs * shiftsPerYear;
  const combined = nhsSal + annualGross;

  const nhsTax = nhsftIncomeTax(nhsSal, false, ty), nhsNI = nhsftNI(nhsSal, ty);
  const combTax = nhsftIncomeTax(combined, false, ty), combNI = nhsftNI(combined, ty);
  const extraTH = (combined - combTax - combNI) - (nhsSal - nhsTax - nhsNI);
  const extraPerShift = shiftsPerYear > 0 ? extraTH / shiftsPerYear : 0;
  const netHrly = hrs > 0 ? extraPerShift / hrs : 0;
  const marginal = annualGross > 0 ? ((combTax - nhsTax + combNI - nhsNI) / annualGross) * 100 : 0;
  const keepPct = annualGross > 0 ? (extraTH / annualGross) * 100 : 0;

  const pen = pensionable ? nhsftPen(combined, ty) : nhsftPen(nhsSal, ty);
  const empContrib = combined * NHSFT_TY[ty].empR;
  const thr = combined - 0, adj = thr + empContrib;
  const aa = nhsftTapAA(adj, thr, ty);
  const pia = pensionable ? nhsftPIA(combined, combined) : nhsftPIA(nhsSal, nhsSal);
  const effAA = aa + cf;
  const breach = Math.max(0, pia - effAA);
  const headroom = Math.max(0, effAA - pia);

  let bandWarn = "";
  if (nhsSal < NHSFT_TY[ty].basic + NHSFT_TY[ty].pa && combined > NHSFT_TY[ty].basic + NHSFT_TY[ty].pa) {
    bandWarn = alertBox("warning", "Higher-rate threshold crossed", `Your shift income crosses the £${(NHSFT_TY[ty].basic + NHSFT_TY[ty].pa).toLocaleString()} higher-rate threshold. Shift income above this is taxed at 40% — you keep only around ${Math.round(100 - marginal)}p per £1 earned at this level.`);
  }
  const paWarn = (combined > 100000 && combined <= 125140) ? alertBox("danger", "60% effective tax zone", "You are in the £100,000–£125,140 Personal Allowance withdrawal zone. Each £1 of extra income costs you roughly 60p in tax. Consider salary sacrifice to reduce gross income below £100,000.") : "";

  let aaNote;
  if (breach > 0) aaNote = alertBox("danger", "Annual Allowance breach", `Estimated breach of ${fmtC(breach)}. Estimated additional tax charge: ${fmtC(breach * 0.4)}+. Consider Scheme Pays or speak to a specialist adviser.`);
  else if (pia > aa * 0.85) aaNote = alertBox("warning", "Approaching your Annual Allowance", `You are using roughly ${pctC(pia / effAA * 100)} of your effective Annual Allowance. Check your position before taking on more pensionable work.`);
  else aaNote = alertBox("success", "Within your Annual Allowance", `Your estimated pension input (${fmtC(pia)}) is within your Annual Allowance (${fmtC(aa)}). Headroom: ${fmtC(headroom)}.`);

  document.getElementById("lk-out").innerHTML = resultBox(
    heroResult("Extra Take-Home From Shifts (Annual)", fmtC(extraTH), fmtC(extraPerShift) + "/shift · £" + netHrly.toFixed(2) + "/hr net") +
    resultGrid([
      ["Gross Shift Income", fmtC(annualGross), ""],
      ["You Keep", Math.round(keepPct) + "p/£", ""],
      ["Marginal Tax Rate", pctC(marginal), ""],
      ["Combined Gross Income", fmtC(combined), ""]
    ]) + bandWarn + paWarn +
    '<div style="font-size:13px;font-weight:800;color:var(--navy);margin:16px 0 4px;">Annual Allowance position</div>' +
    resultGrid([
      ["Your Tapered AA", fmtC(aa), ""],
      ["Pension Input (est.)", fmtC(pia), ""],
      ["Carry Forward", fmtC(cf), ""],
      ["AA Headroom / Breach", breach > 0 ? "−" + fmtC(breach) : "+" + fmtC(headroom), breach > 0 ? "red" : "green"]
    ]) + aaNote +
    resultNote("Assumes shifts are pensionable only if you've ticked that box — check with your trust, since this varies. AA uses the tax year selected above.")
  );
  showRes("lk-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — NHS PENSION: STAY IN VS OPT OUT
   ══════════════════════════════════════════════════════ */
function calcOptOut() {
  const ty = tval("oo-tyear");
  const salary = tv("oo-salary");
  if (!salary) { alert("Please enter your annual salary."); return; }
  const age = tv("oo-age") || 38, served = tv("oo-served") || 10;
  const retire = tv("oo-retire") || 67, invR = (tv("oo-return") || 5) / 100;
  const taxR = (tv("oo-taxrate") || 20) / 100, cpiR = ((tv("oo-cpi") || 2.5) + 1.5) / 100;
  const ytr = Math.max(1, retire - age), yInR = Math.max(1, 88 - retire);

  const empPen = nhsftPen(salary, ty);
  const nhsTax = nhsftIncomeTax(salary, false, ty), nhsNI = nhsftNI(salary, ty);
  const thIn = salary - nhsTax - nhsNI - empPen;
  const thOut = salary - nhsTax - nhsNI;
  const monthlyGain = (thOut - thIn) / 12;

  let care = 0;
  for (let y = 1; y <= served; y++) { const ago = served - y; care += (salary / Math.pow(1.025, ago)) / 54 * Math.pow(1 + cpiR, ytr + ago); }
  for (let y2 = 1; y2 <= ytr; y2++) { care += salary / 54 * Math.pow(1 + cpiR, ytr - y2); }
  const nhsAnnual = care, nhsLifetime = nhsAnnual * yInR;

  const annualInvest = empPen;
  const pot = annualInvest * ((Math.pow(1 + invR, ytr) - 1) / invR);
  const annualDrawdown = pot * 0.04;
  const netDrawdown = annualDrawdown * (1 - taxR);
  const invLifetime = netDrawdown * yInR;

  const empContrib = salary * NHSFT_TY[ty].empR;
  const dis = salary * 2;

  const targetPot = nhsAnnual / 0.04;
  const needed = targetPot * invR / (Math.pow(1 + invR, ytr) - 1);

  const gap = nhsLifetime - invLifetime;
  const wins = nhsLifetime > invLifetime;

  const verdict = wins
    ? alertBox("success", "NHS pension wins", `The NHS pension is estimated to win by ${fmtC(gap)} over your ${yInR}-year retirement. To match it through private investment you'd need to invest ${fmtC(needed)}/yr — versus just ${fmtC(empPen)}/yr in employee contributions. The ${fmtC(monthlyGain)}/month short-term gain from opting out is estimated to cost ${fmtC(gap)} in lifetime income.`)
    : alertBox("warning", "Private investing edges ahead in this scenario", `At ${Math.round(invR * 100)}% investment return and ${Math.round(taxR * 100)}% withdrawal tax, private investing marginally beats the NHS pension here. This ignores death-in-service cover (${fmtC(dis)}), ill-health retirement protection, and the guaranteed, government-backed nature of the NHS pension. Please seek specialist financial advice before opting out.`);

  document.getElementById("oo-out").innerHTML = resultBox(
    alertBox("danger", "Before you consider this", "The RCN, BMA and most financial advisers strongly advise against opting out of the NHS Pension Scheme. This calculator is here to show you why — please read carefully.") +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;">' +
      `<div style="background:linear-gradient(135deg,#1A2E44,#007B8A);border-radius:12px;padding:20px;text-align:center;"><div style="font-size:11px;color:rgba(255,255,255,0.75);text-transform:uppercase;margin-bottom:6px;">✅ Stay In NHS Pension</div><div style="font-size:28px;font-weight:900;color:#fff;">${fmtC(nhsLifetime)}</div><div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;">${fmtC(nhsAnnual)}/yr lifetime income</div></div>` +
      `<div style="background:linear-gradient(135deg,#78350F,#92400E);border-radius:12px;padding:20px;text-align:center;"><div style="font-size:11px;color:rgba(255,255,255,0.75);text-transform:uppercase;margin-bottom:6px;">⚠️ Opt Out + Invest</div><div style="font-size:28px;font-weight:900;color:#fff;">${fmtC(invLifetime)}</div><div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;">${fmtC(netDrawdown)}/yr drawdown</div></div>` +
    '</div>' +
    resultGrid([
      ["Immediate Monthly Gain", fmtC(monthlyGain), "green"],
      ["Employer Contribution Lost", fmtC(empContrib) + "/yr", "red"],
      ["Investment Pot at Retirement", fmtC(pot), ""],
      ["Lifetime Income Gap", (wins ? "NHS better by " : "Invest better by ") + fmtC(Math.abs(gap)), ""],
      ["To Match NHS Pension, Invest", fmtC(needed) + "/yr", "red"],
      ["Death in Service Lost", fmtC(dis), "red"]
    ]) + verdict +
    resultNote("NHS pension projection uses 2015 CARE 1/54 accrual and CPI + 1.5% revaluation. Investment returns are not guaranteed — market values can fall. Employer contribution rules vary by trust. Always seek specialist financial advice before opting out.")
  );
  showRes("oo-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — SELF-ASSESSMENT TAX ESTIMATOR
   ══════════════════════════════════════════════════════ */
function calcSelfAssess() {
  const ty = tval("sa-tyear");
  const nhsSal = tv("sa-nhs");
  if (!nhsSal) { alert("Please enter your NHS salary."); return; }
  const privPrac = tv("sa-pp"), medRep = tv("sa-mr"), otherSE = tv("sa-other-se");
  const rental = tv("sa-rental"), mortInt = tv("sa-mortint"), interest = tv("sa-interest"), divs = tv("sa-divs");
  const poa = tv("sa-poa"), scot = tval("sa-scot") === "yes";
  const pen = tv("sa-pen") || nhsftPen(nhsSal, ty);

  const selfEmpProfit = privPrac + medRep + otherSE;
  const mortRelief = mortInt * 0.20;
  const gross = nhsSal - pen + selfEmpProfit + rental + interest + divs;

  const tax = Math.max(0, nhsftIncomeTax(gross, scot, ty) - mortRelief);
  const nhsTaxOnly = nhsftIncomeTax(Math.max(0, nhsSal - pen), scot, ty);

  let cl4 = 0;
  if (selfEmpProfit > 12570) {
    cl4 = (Math.min(selfEmpProfit, 50270) - 12570) * 0.09;
    if (selfEmpProfit > 50270) cl4 += (selfEmpProfit - 50270) * 0.02;
  }
  const cl2 = selfEmpProfit > 12570 ? 179.40 : 0;

  const totalTax = tax + cl4 + cl2;
  const paye = nhsTaxOnly + nhsftNI(Math.max(0, nhsSal - pen), ty);
  const balance = totalTax - paye - poa;

  const note = (gross > 100000 && gross <= 125140)
    ? alertBox("warning", "Personal Allowance withdrawal zone", "You're in the zone where your Personal Allowance is gradually withdrawn. Consider pension contributions to bring gross income below £100,000.")
    : balance < 0
    ? alertBox("success", "You may be due a refund", `You appear to have overpaid tax via PAYE/payments on account. You may be entitled to a refund of ${fmtC(Math.abs(balance))}.`)
    : alertBox("info", "Set this aside for January", `Set aside ${fmtC(Math.max(0, balance))} for your January payment. HMRC may also require payments on account for next year — typically 50% of this year's balance, due in January and July.`);

  const poaNote = balance > 1000 ? alertBox("info", "Payments on account", `HMRC will likely require advance payments for next year — 50% of this year's bill (${fmtC(balance / 2)}) — due in both January and July.`) : "";

  document.getElementById("sa-out").innerHTML = resultBox(
    heroResult("Estimated Self-Assessment Tax Bill", fmtC(Math.max(0, balance)), balance < 0 ? "You may be due a refund of " + fmtC(Math.abs(balance)) : "Due 31 January following the tax year end") +
    resultGrid([
      ["Total Gross Income", fmtC(gross), ""],
      ["Income Tax (total)", fmtC(tax), "red"],
      ["Class 2 + 4 NI (self-employed)", fmtC(cl4 + cl2), "red"],
      ["Tax Already Collected via PAYE", fmtC(paye), "green"],
      ["Payments on Account Made", fmtC(poa), "green"],
      ["Balance Due in January", fmtC(Math.abs(balance)), ""]
    ]) + note + poaNote +
    resultNote("Estimate only. Actual bill depends on allowable expenses, exact pension contributions, and other HMRC adjustments. Always submit an accurate Self Assessment return and consult a qualified accountant.")
  );
  showRes("sa-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — NHS MORTGAGE AFFORDABILITY CALCULATOR
   ══════════════════════════════════════════════════════ */
function calcMortgage() {
  const sal1 = tv("mg-sal1");
  if (!sal1) { alert("Please enter your NHS basic salary."); return; }
  const sal2 = tv("mg-sal2"), extra = tv("mg-extra");
  const dep = tv("mg-dep"), outgoings = tv("mg-loans") + tv("mg-car") + tv("mg-childcare");
  const deps = parseInt(tval("mg-deps")) || 0, rate = tv("mg-rate") || 4.5;
  const emptype = tval("mg-emptype");

  const totalIncome = sal1 + sal2 + extra;
  const netOut = outgoings * 12;
  const netIncome = Math.max(0, totalIncome - netOut);

  let multiple = emptype === "se" ? 4.0 : emptype === "contract" ? 4.25 : 4.5;
  if (deps >= 2) multiple -= 0.25;
  if (deps >= 3) multiple -= 0.25;

  const maxLoan = netIncome * multiple;
  const maxProp = maxLoan + dep;
  const ltv = maxProp > 0 ? (maxLoan / maxProp) * 100 : 0;
  const pmt = nhsftMonthlyPmt(maxLoan, rate, 25);

  const mults = [[4.0, "Conservative"], [4.5, "Standard NHS"], [5.0, "Stretched"], [5.5, "NHS specialist lenders"]];
  const tblRows = mults.map(([m, name]) => { const loan = netIncome * m; return [name, m.toFixed(1) + "×", fmtC(loan), fmtC(loan + dep)]; });

  const note = ltv > 90
    ? alertBox("warning", "High loan-to-value", `LTV of ${Math.round(ltv)}% — you may need a higher deposit to access standard mortgage rates. Some NHS specialist lenders offer schemes for key workers.`)
    : ltv <= 75
    ? alertBox("success", "Strong position", `LTV of ${Math.round(ltv)}% puts you in a strong position for competitive mortgage rates.`)
    : alertBox("info", "Worth shopping around", `LTV of ${Math.round(ltv)}%. A specialist NHS mortgage broker may secure a higher income multiple — some offer up to 5.5× for NHS staff.`);

  document.getElementById("mg-out").innerHTML = resultBox(
    heroResult("Estimated Maximum Borrowing", fmtC(maxLoan), multiple.toFixed(2) + "× income multiple · " + rate + "% rate") +
    resultGrid([
      ["Your Deposit", fmtC(dep), ""],
      ["Max Property Value", fmtC(maxProp), "green"],
      ["Loan-to-Value", Math.round(ltv) + "%", ""],
      ["Est. Monthly Payment", fmtC(pmt), ""]
    ]) +
    '<div style="font-size:13px;font-weight:800;color:var(--navy);margin:16px 0 4px;">Range across lender types</div>' +
    resultTable(["Lender type", "Multiple", "Max borrowing", "Max property"], tblRows) +
    note +
    alertBox("info", "NHS pension tip", "Your NHS pension contributions reduce your take-home pay, but some lenders will add them back when assessing affordability — ask your broker specifically about this.") +
    resultNote("Estimates based on income multiples only. Actual mortgage offers depend on credit score, lender criteria, affordability stress tests and individual circumstances. Always consult a qualified mortgage broker.")
  );
  showRes("mg-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — NHS ANNUAL LEAVE CALCULATOR
   ══════════════════════════════════════════════════════ */
function nhsftALToggle() {
  const partYear = tval("al-partyear") === "yes";
  document.getElementById("al-partyear-wrap").style.display = partYear ? "block" : "none";
}
function calcAnnualLeave() {
  const hrs = tv("al-hrs") || 30, ftDays = parseInt(tval("al-service")) || 29;
  const bhFull = parseInt(tval("al-bh")) || 8, partYear = tval("al-partyear") === "yes";
  const wte = hrs / 37.5;

  let fraction = 1;
  if (partYear) {
    const startMonth = parseInt(tval("al-startmonth")) || 1;
    const startDay = tv("al-startday") || 1;
    const monthsWorked = 12 - startMonth + 1 + (startDay > 1 ? -1 : 0);
    fraction = Math.max(0, Math.min(1, monthsWorked / 12));
  }

  const prorataDays = Math.round(ftDays * wte * fraction * 10) / 10;
  const prorataBH = Math.round(bhFull * wte * fraction * 10) / 10;
  const totalDays = Math.round((prorataDays + prorataBH) * 10) / 10;
  const totalHrs = Math.round(totalDays * 7.5 * 10) / 10;
  const daysHrsOnly = Math.round(prorataDays * 7.5 * 10) / 10;

  const note = partYear
    ? alertBox("info", "Part-year calculation", `Based on approximately ${Math.round(fraction * 12)} months of service this leave year. Check the exact calculation with HR, as trust policies may vary for part-year starters.`)
    : alertBox("success", "Your pro-rata entitlement", `At ${Math.round(wte * 100)}% WTE: ${prorataDays} days leave + ${prorataBH} bank holidays = ${totalDays} days total (${totalHrs} hours).`);

  document.getElementById("al-out").innerHTML = resultBox(
    heroResult("Pro-Rata Annual Leave", prorataDays + " days", daysHrsOnly + " hours") +
    resultGrid([
      ["Full-Time Entitlement", ftDays + " days", ""],
      ["Your WTE", Math.round(wte * 100) + "%", ""],
      ["Pro-Rata Days", prorataDays + " days", "green"],
      ["Bank Holidays (pro-rata)", prorataBH + " days", ""],
      ["Total Leave inc. BH", totalDays + " days", "green"],
      ["In Hours", totalHrs + " hrs", ""]
    ]) + note +
    resultNote("Based on standard Agenda for Change leave entitlements. Actual entitlement depends on your contract, trust policy and any local agreements — always check with your line manager or HR.")
  );
  showRes("al-out");
}

/* ══════════════════════════════════════════════════════
   TOOL — STUDENT LOAN REPAYMENT CALCULATOR
   Verified current thresholds (2026/27), per plan.
   ══════════════════════════════════════════════════════ */
const NHSFT_STUDENT_LOAN = {
  1: { thresh: 26900, rate: 0.09, term: "age65", interest: 4.3, label: "Plan 1 — England/Wales pre-2012" },
  2: { thresh: 29385, rate: 0.09, term: 30, interest: 6.0, label: "Plan 2 — England/Wales 2012–2023" },
  4: { thresh: 33795, rate: 0.09, term: 30, interest: 3.2, label: "Plan 4 — Scotland" },
  5: { thresh: 25000, rate: 0.09, term: 40, interest: 3.2, label: "Plan 5 — England/Wales 2023+" }
};
function nhsftSlPlanChange() {
  const plan = parseInt(tval("sl-plan")) || 2;
  const p = NHSFT_STUDENT_LOAN[plan];
  const writeoffText = p.term === "age65" ? "Written off at age 65" : `Written off after ${p.term} years`;
  document.getElementById("sl-plan-info").innerHTML = `${p.label} · Threshold: £${p.thresh.toLocaleString("en-GB")} · Rate: ${Math.round(p.rate * 100)}% above threshold · Interest: ~${p.interest}% · ${writeoffText}`;
  document.getElementById("sl-rate").value = p.interest;
}
function calcStudentLoan() {
  const plan = parseInt(tval("sl-plan")) || 2;
  const balance = tv("sl-balance"), salary = tv("sl-salary"), growth = (tv("sl-growth") || 3) / 100;
  const interest = (tv("sl-rate") || 6) / 100, yearsSince = tv("sl-age") || 5;
  const p = NHSFT_STUDENT_LOAN[plan];

  const monthly = salary > p.thresh ? (salary - p.thresh) * p.rate / 12 : 0;
  const annual = monthly * 12;

  let bal = balance, totalPaid = 0, yearsToRepay = null, writeoffBal = null;
  const maxYears = p.term === "age65" ? Math.max(0, 65 - 25 - yearsSince) : p.term - yearsSince;
  let curSal = salary;
  for (let yr = 1; yr <= maxYears; yr++) {
    curSal *= (1 + growth);
    const payment = curSal > p.thresh ? (curSal - p.thresh) * p.rate : 0;
    bal = bal * (1 + interest) - payment;
    totalPaid += payment;
    if (bal <= 0 && yearsToRepay === null) { yearsToRepay = yr; break; }
  }
  if (bal > 0) writeoffBal = bal;

  const writeoffLabel = p.term === "age65" ? `Age 65 (~${Math.round(25 + maxYears - yearsSince)} yrs)` : `~Year ${new Date().getFullYear() + Math.round(maxYears)}`;

  const note = yearsToRepay
    ? alertBox("success", "Projected to clear your loan", `Projected to clear after ${yearsToRepay} years. Total repaid: approximately ${fmtC(Math.min(totalPaid, balance * 1.5))}.`)
    : alertBox("info", "Not projected to clear before write-off", "This means you'll repay a portion but never the full balance — which may actually be a good outcome if the total repaid ends up less than the original balance.");
  const warn = (writeoffBal && writeoffBal < balance * 0.3)
    ? alertBox("info", "Before making voluntary overpayments", `You're projected to have roughly ${fmtC(writeoffBal)} written off at your write-off date. If you've received a bonus or inheritance, paying off the loan early may not be worth it — get financial advice first.`)
    : "";

  document.getElementById("sl-out").innerHTML = resultBox(
    heroResult("Monthly Deduction (current year)", fmtC(monthly), fmtC(annual) + " per year deducted from your payslip") +
    resultGrid([
      ["Repayment Threshold", fmtC(p.thresh), ""],
      ["Rate Above Threshold", "9%", ""],
      ["Years to Clear (projected)", yearsToRepay ? yearsToRepay + " years" : "Won't clear before write-off", ""],
      ["Write-Off Point", writeoffLabel, ""],
      ["Projected Total Repaid", fmtC(Math.min(totalPaid, balance + (balance * interest * Math.min(maxYears, yearsToRepay || maxYears)))), ""],
      ["Balance at Write-Off", writeoffBal ? fmtC(writeoffBal) + " written off" : "Cleared before write-off ✅", writeoffBal ? "" : "green"]
    ]) + note + warn +
    resultNote("Projection based on your salary, growth rate and interest rate assumptions. Actual repayments depend on income, interest rate changes, and HMRC thresholds, which are reviewed annually. Check your real balance at studentloanrepayment.co.uk.")
  );
  showRes("sl-out");
}
