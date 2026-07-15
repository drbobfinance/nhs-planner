// ============================================================
//  UK-DEBT.INFO — CENTRAL DATA FILE
//  Update this file monthly after each ONS/OBR release
//  then upload to Cloudflare to refresh the whole site
//  Last updated: June 2026 (ONS May 2026 release)
// ============================================================

const UKDATA = {

  meta: {
    lastUpdated:      'June 2026',
    onsRelease:       'APR 2026 · £24.3bn monthly borrowing',
    obrSource:        'OBR EFO March 2026',
    nextUpdateDue:    'July 2026 (ONS June release)',
    updatedBy:        'Admin',
  },

  // ── DEBT & BORROWING ───────────────────────────────────────
  debt: {
    psndBn:           2917,      // £bn — PSND excl. BoE, end Mar 2026 (ONS)
    psndBaseDateISO:  '2026-04-01', // date the psndBn figure was measured
    annualBorrowBn:   129,       // £bn — full year 2025/26 outturn
    annualInterestBn: 110,       // £bn — 2025/26 debt interest
    welfareBn:        287,       // £bn — DWP 2025/26
    nhsBn:            192,       // £bn — NHS England 2025/26
    educationBn:      77,        // £bn — education 2025/26
    defenceBn:        54,        // £bn — defence 2025/26
    psndPctGdp:       93.8,      // % — PSND as % of GDP Mar 2026
    onsMonthlyBn:     24.3,      // £bn — latest monthly borrowing figure
    onsMonthLabel:    'APR 2026',
  },

  // ── ECONOMY ────────────────────────────────────────────────
  economy: {
    gdpBn:            2968,      // £bn — nominal GDP estimate
    boeRate:          3.75,      // % — BoE base rate
    cpi:              3.5,       // % — CPI 12-month rate
    rpi:              4.1,       // % — RPI 12-month rate
    gdpGrowth:        1.1,       // % — OBR 2026 GDP growth forecast
    tenYrGiltYield:   4.3,       // % — approx 10-yr gilt yield
    avgGiltCoupon:    2.8,       // % — weighted avg coupon on existing stock
    giltStockBn:      2800,      // £bn — total conventional + IL gilt stock
    giltAvgMaturityYr:14.8,      // years — weighted avg maturity
    giltRefinancedBn: 185,       // £bn — approx refinanced per year
    indexLinkedPct:   25,        // % — share of gilt stock that is index-linked
  },

  // ── POPULATION & WORKFORCE ─────────────────────────────────
  population: {
    total:            68400000,  // ONS mid-2025 estimate
    employed:         33500000,  // LFS employed
    unemployed:       1540000,   // LFS unemployed
    inactive:         9400000,   // economically inactive
    publicSector:     6100000,   // public sector workers
    privateSector:    27400000,  // private sector workers
    taxpayers:        24790000,  // approx income taxpayers
    pensioners:       12800000,  // state pension recipients
    migrationIn:      860000,    // annual arrivals (est.)
    migrationOut:     500000,    // annual departures (est.)
  },

  // ── OFFICIAL RESERVES ──────────────────────────────────────
  reserves: {
    goldTonnes:       310.29,    // tonnes — unchanged since 2002
    goldUsdBn:        46.1,      // $bn — Apr 2026 value
    goldGbpBn:        36,        // £bn — approx at current GBP/USD
    fxReservesUsdBn:  237,       // $bn — Feb 2026 (all-time high)
    fxReservesGbpBn:  185,       // £bn approx
    sdrGbpBn:         16,        // £bn — IMF SDR holdings
    rtpGbpBn:         4,         // £bn — IMF reserve tranche
    totalReservesGbpBn: 130,     // £bn — total EEA reserves
  },

  // ── MONEY SUPPLY ───────────────────────────────────────────
  moneySupply: {
    m0Bn:             104,       // £bn — Feb 2026
    m1Bn:             2282,      // £bn — Feb 2026
    m2Bn:             3198,      // £bn — Feb 2026 (all-time high)
    m3Bn:             3757,      // £bn — Feb 2026
    m2GrowthPct:      2.8,       // % — YoY Feb 2026
    boeBsGbpBn:       796,       // £bn — BoE balance sheet Apr 2026
    boeQeGiltsBn:     680,       // £bn — gilts held via QE (being unwound)
  },

  // ── PERSONAL FINANCE ──────────────────────────────────────
  personal: {
    avgMortgageOutstandingK: 197.8, // £k — avg outstanding mortgage balance
    avgCreditCardDebtK:      2.1, // £k — avg credit card balance
    avgPersonalLoanK:        8.4, // £k — avg personal loan
    avgSavingsK:             17.8,// £k — avg household savings
    avgAnnualSalaryK:        35.4,// £k — median full-time salary 2025
    avgHousePriceK:          285, // £k — UK average house price
    householdDebtPctIncome:  130, // % — household debt as % disposable income
    personalInsolvenciesPA:  110000, // annual personal insolvencies
  },

  // ── OFF-BALANCE-SHEET ──────────────────────────────────────
  offBalanceSheet: {
    statePensionLiabilityTn:  6.0,  // £tn — unfunded state pension liability
    civilServicePensionsTn:   2.6,  // £tn — unfunded civil service pensions
    nhsPensionsTn:            0.6,  // £tn — NHS pension scheme liability
    policeFirePensionsBn:     160,  // £bn
    teachersPensionsBn:       290,  // £bn
    armedForcesPensionsBn:    190,  // £bn
    pfiCommitmentsBn:         310,  // £bn — PFI/PPP commitments outstanding
    studentLoanBookBn:        237,  // £bn — student loan book
    networkRailBn:            54,   // £bn — Network Rail debt
    nuclearDecommBn:          23,   // £bn — nuclear decommissioning provision
    totalExPensionsTn:        0.86, // £tn — off-BS excl. unfunded pensions
    totalIncPensionsTn:       9.5,  // £tn — total incl. all pension liabilities
  },

  // ── OBR FORECASTS ─────────────────────────────────────────
  forecasts: {
    // [2025/26, 2026/27, 2027/28, 2028/29, 2029/30, 2030/31]
    borrowingBn:   [129,  118,  110,  105,  98,   90],
    interestBn:    [110,  105,  102,  100,  98,   96],
    debtPctGdp:    [94.5, 95.0, 95.5, 96.5, 96.0, 95.0],
    gdpGrowthPct:  [1.1,  1.6,  1.6,  1.7,  1.8,  1.8],
    cpiPct:        [3.5,  2.3,  2.0,  2.0,  2.0,  2.0],
    unemployPct:   [4.5,  4.8,  4.6,  4.4,  4.2,  4.0],
  },

  // ── HISTORICAL SERIES (for charts) ────────────────────────
  historical: {
    // Annual interest payments £bn by financial year
    interestByYear: {
      '1990/91':19,'1993/94':24,'1996/97':27,'2000/01':22,'2003/04':24,
      '2006/07':30,'2007/08':31,'2008/09':32,'2009/10':31,'2010/11':46,
      '2011/12':48,'2012/13':51,'2013/14':52,'2014/15':53,'2015/16':49,
      '2016/17':49,'2017/18':49,'2018/19':52,'2019/20':52,'2020/21':46,
      '2021/22':69,'2022/23':116,'2023/24':105,'2024/25':100,'2025/26':110
    },
    // Debt as % GDP
    debtPctGdpByYear: {
      '2000':40,'2005':38,'2007':36,'2008':44,'2009':57,'2010':65,
      '2011':72,'2012':77,'2013':77,'2014':80,'2015':84,'2016':84,
      '2017':84,'2018':83,'2019':85,'2020':99,'2021':101,'2022':95,
      '2023':97,'2024':98,'2025':94,'2026':93.8
    },
    // M2 money supply £bn
    m2ByYear: {
      '2000':900,'2005':1200,'2010':1680,'2015':1980,'2019':2210,
      '2020':2560,'2021':2820,'2022':2780,'2023':2850,'2024':2980,
      '2025':3100,'2026':3198
    },
    // Public vs private sector employment (millions)
    employmentByYear: {
      '2000':{public:5.2,private:22.8},
      '2005':{public:5.9,private:24.1},
      '2010':{public:6.3,private:23.7},
      '2015':{public:5.4,private:25.6},
      '2019':{public:5.6,private:27.1},
      '2020':{public:5.7,private:26.1},
      '2021':{public:5.7,private:26.8},
      '2022':{public:5.9,private:27.2},
      '2023':{public:6.0,private:27.3},
      '2024':{public:6.1,private:27.3},
      '2025':{public:6.1,private:27.4},
    }
  },

};

// Make available globally
if(typeof window !== 'undefined') window.UKDATA = UKDATA;
if(typeof module !== 'undefined') module.exports = UKDATA;
