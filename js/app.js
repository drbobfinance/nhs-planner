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
  "shouldiltd": "/should-i-set-up-a-limited-company/"
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
  "Band 2 — £24,465": 24465, "Band 3 (Entry) — £24,937": 24937, "Band 3 (Top) — £26,598": 26598,
  "Band 4 (Entry) — £27,485": 27485, "Band 4 (Top) — £30,162": 30162,
  "Band 5 (Entry) — £31,049": 31049, "Band 5 (Top) — £37,796": 37796,
  "Band 6 (Entry) — £38,682": 38682, "Band 6 (Top) — £46,580": 46580,
  "Band 7 (Entry) — £47,810": 47810, "Band 7 (Top) — £54,710": 54710,
  "Band 8a (Entry) — £55,690": 55690, "Band 8a (Top) — £62,682": 62682,
  "Band 8b (Entry) — £64,455": 64455, "Band 8b (Top) — £74,896": 74896,
  "Band 8c (Entry) — £76,965": 76965, "Band 8c (Top) — £88,682": 88682,
  "Band 8d (Entry) — £91,342": 91342, "Band 8d (Top) — £105,337": 105337,
  "Band 9 (Entry) — £109,179": 109179, "Band 9 (Top) — £125,637": 125637,
  "Foundation Year 1 (F1) — £32,398": 32398, "Foundation Year 2 (F2) — £37,935": 37935,
  "Specialty Registrar (StR) — £51,017": 51017,
  "Consultant Threshold 1 — £105,504": 105504, "Consultant Threshold 8 — £139,882": 139882,
  "GP (Salaried) — £71,504": 71504, "Other / enter manually": 0
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
  const sel = document.getElementById("th-band");
  document.getElementById("th-consultant-row").style.display = band.startsWith("Consultant") ? "block" : "none";
  document.getElementById("th-band-row").style.display = band.startsWith("Band") ? "block" : "none";
  document.getElementById("th-trainee-row").style.display = (band.startsWith("Foundation") || band.startsWith("Specialty") || band.startsWith("GP")) ? "block" : "none";
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
