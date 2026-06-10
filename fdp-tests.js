// FDP Calculator — automated tests
// Run with: node fdp-tests.js
// Tests every calculation against EW OM-A Rev 104 / EASA ORO.FTL.205

'use strict';

// ─── Copy of utility functions from fdp-calculator.html ───────────────────────

function parseHHMM(str) {
  if (!str) return null;
  str = str.trim();
  const m = str.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10), mn = parseInt(m[2], 10);
  if (h > 23 || mn > 59) return null;
  return h * 60 + mn;
}

function hhmmToMins(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return 0;
  const p = hhmm.split(':').map(Number);
  return (p[0] || 0) * 60 + (p[1] || 0);
}

function formatDuration(mins) {
  if (mins === null || isNaN(mins)) return '--:--';
  const sign = mins < 0 ? '-' : '';
  const abs  = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return sign + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

function minsToHHMM(mins) {
  if (mins === null || isNaN(mins)) return '--:--';
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

// ─── FDP Data (from fdp-calculator.html) ──────────────────────────────────────

const FDP_DATA = {
  EASA: {
    cols: ['1–2', '3–4', '5–6'],
    table: [
      ['00:00', '04:59', [ 11*60,      10*60+30,  10*60    ]],
      ['05:00', '05:59', [ 12*60,      11*60+30,  11*60    ]],
      ['06:00', '13:29', [ 13*60,      12*60,     11*60+30 ]],
      ['13:30', '13:59', [ 12*60+30,   11*60+30,  11*60    ]],
      ['14:00', '14:29', [ 12*60,      11*60,     10*60+30 ]],
      ['14:30', '14:59', [ 11*60+30,   10*60+30,  10*60    ]],
      ['15:00', '15:29', [ 11*60,      10*60,     9*60+30  ]],
      ['15:30', '15:59', [ 10*60+30,   9*60+30,   9*60     ]],
      ['16:00', '16:29', [ 10*60,      9*60,      8*60+30  ]],
      ['16:30', '16:59', [ 9*60+30,    8*60+30,   8*60     ]],
      ['17:00', '21:59', [ 9*60,       9*60,      9*60     ]],
      ['22:00', '22:59', [ 10*60,      9*60+30,   9*60     ]],
      ['23:00', '23:59', [ 11*60,      10*60,     9*60+30  ]],
    ],
  },

  EUROWINGS: {
    cols: ['1–2', '3', '4', '5', '6'],
    table: [
      ['00:00', '04:59', [ 11*60,      10*60+30,  10*60,     9*60+30,   9*60     ]],
      ['05:00', '05:14', [ 12*60,      11*60+30,  11*60,     10*60+30,  10*60    ]],
      ['05:15', '05:29', [ 12*60+15,   11*60+45,  11*60+15,  10*60+45,  10*60+15 ]],
      ['05:30', '05:44', [ 12*60+30,   12*60,     11*60+30,  11*60,     10*60+30 ]],
      ['05:45', '05:59', [ 12*60+45,   12*60+15,  11*60+45,  11*60+15,  10*60+45 ]],
      ['06:00', '13:29', [ 13*60,      12*60+30,  12*60,     11*60+30,  11*60    ]],
      ['13:30', '13:59', [ 12*60+45,   12*60+15,  11*60+45,  11*60+15,  10*60+45 ]],
      ['14:00', '14:29', [ 12*60+30,   12*60,     11*60+30,  11*60,     10*60+30 ]],
      ['14:30', '14:59', [ 12*60+15,   11*60+45,  11*60+15,  10*60+45,  10*60+15 ]],
      ['15:00', '15:29', [ 12*60,      11*60+30,  11*60,     10*60+30,  10*60    ]],
      ['15:30', '15:59', [ 11*60+45,   11*60+15,  10*60+45,  10*60+15,  9*60+45  ]],
      ['16:00', '16:29', [ 11*60+30,   11*60,     10*60+30,  10*60,     9*60+30  ]],
      ['16:30', '16:59', [ 11*60+15,   10*60+45,  10*60+15,  9*60+45,   9*60+15  ]],
      ['17:00', '23:59', [ 11*60,      10*60+30,  10*60,     9*60+30,   9*60     ]],
    ],
    extTable: [
      ['00:00', '05:59', [ null,         null,        null,        null      ]],
      ['06:00', '06:14', [ null,         null,        null,        null      ]],
      ['06:15', '06:29', [ 13*60+15,     12*60+45,    12*60+15,    11*60+45  ]],
      ['06:30', '06:44', [ 13*60+30,     13*60,       12*60+30,    12*60     ]],
      ['06:45', '06:59', [ 13*60+45,     13*60+15,    12*60+45,    12*60+15  ]],
      ['07:00', '13:29', [ 14*60,        13*60+30,    13*60,       12*60+30  ]],
      ['13:30', '13:59', [ 13*60+45,     13*60+15,    12*60+45,    null      ]],
      ['14:00', '14:29', [ 13*60+30,     13*60,       12*60+30,    null      ]],
      ['14:30', '14:59', [ 13*60+15,     12*60+45,    12*60+15,    null      ]],
      ['15:00', '15:29', [ 13*60,        12*60+30,    12*60,       null      ]],
      ['15:30', '15:59', [ 12*60+45,     null,        null,        null      ]],
      ['16:00', '16:29', [ 12*60+30,     null,        null,        null      ]],
      ['16:30', '16:59', [ 12*60+15,     null,        null,        null      ]],
      ['17:00', '17:29', [ 12*60,        null,        null,        null      ]],
      ['17:30', '17:59', [ 11*60+45,     null,        null,        null      ]],
      ['18:00', '18:29', [ 11*60+30,     null,        null,        null      ]],
      ['18:30', '18:59', [ 11*60+15,     null,        null,        null      ]],
      ['19:00', '23:59', [ null,         null,        null,        null      ]],
    ]
  }
};

// ─── Calculation functions (mirrored from fdp-calculator.html) ─────────────────

function ewColIdx(n) {
  return n <= 2 ? 0 : n === 3 ? 1 : n === 4 ? 2 : n === 5 ? 3 : 4;
}

function getFDPLimit(reportMinsLT, numSectors, airline) {
  const data   = FDP_DATA[airline];
  const colIdx = airline === 'EUROWINGS'
    ? ewColIdx(numSectors)
    : (numSectors <= 2 ? 0 : numSectors <= 4 ? 1 : 2);
  for (let i = 0; i < data.table.length; i++) {
    const row   = data.table[i];
    const start = hhmmToMins(row[0]);
    const end   = hhmmToMins(row[1]);
    if (reportMinsLT >= start && reportMinsLT <= end) return row[2][colIdx];
  }
  return null;
}

function getEWExtendedFDP(reportMinsLT, numSectors) {
  if (numSectors > 5) return null;
  const colIdx = ewColIdx(numSectors);
  const rows = FDP_DATA.EUROWINGS.extTable;
  for (let i = 0; i < rows.length; i++) {
    const start = hhmmToMins(rows[i][0]);
    const end   = hhmmToMins(rows[i][1]);
    if (reportMinsLT >= start && reportMinsLT <= end) return rows[i][2][colIdx];
  }
  return null;
}

function isNightDuty(reportMinsLT, fdpEndMinsLT) {
  const NS = 2 * 60, NE = 4 * 60 + 59;
  function overlaps(ds, de, ws, we) { return ds <= we && de >= ws; }
  const r = reportMinsLT % 1440;
  if (overlaps(r, fdpEndMinsLT, NS, NE))           return true;
  if (overlaps(r, fdpEndMinsLT, NS+1440, NE+1440)) return true;
  return false;
}

function woclEncroachmentMins(startLT, fdpEndLT) {
  const WS = 2 * 60, WE = 5 * 60 + 59;
  function overlapWith(ws, we) {
    var s = Math.max(startLT % 1440, ws);
    var e = Math.min(fdpEndLT > 1440 ? fdpEndLT - 1440 : fdpEndLT, we);
    var overlap = Math.max(0, e - s);
    if (fdpEndLT > 1440) {
      var s2 = Math.max(startLT % 1440, ws + 1440);
      var e2 = Math.min(fdpEndLT, we + 1440);
      overlap = Math.max(overlap, e2 - s2);
    }
    return overlap;
  }
  return overlapWith(WS, WE);
}

function computeMaxFDP(reportMinsLT, numSectors, airline, opExt, cd) {
  const baseFDP = getFDPLimit(reportMinsLT, numSectors, airline);
  if (baseFDP === null) return null;
  if (airline === 'EUROWINGS') {
    const ewExt    = opExt ? getEWExtendedFDP(reportMinsLT, numSectors) : null;
    const opExtFDP = (opExt && ewExt !== null) ? ewExt : baseFDP;
    const cdFDP    = cd ? baseFDP + 120 : baseFDP;
    return Math.max(opExtFDP, cdFDP);
  } else {
    return baseFDP + (opExt ? 60 : 0) + (cd ? 120 : 0);
  }
}

function computeMinRest(dutyDuration, restBase, opExtWasActive) {
  const baseHome = Math.max(dutyDuration, 720);
  const baseAway = Math.max(dutyDuration, 600);
  if (restBase === 'home') return opExtWasActive ? baseHome + 240 : baseHome;
  else                     return opExtWasActive ? baseAway + 240 : baseAway;
}

// ─── Test harness ──────────────────────────────────────────────────────────────

let passed = 0, failed = 0;
const failures = [];

function eq(label, got, expected) {
  if (got === expected) {
    passed++;
  } else {
    failed++;
    failures.push(`FAIL: ${label}\n      expected: ${expected}\n      got:      ${got}`);
  }
}

function mins(h, m) { return h * 60 + (m || 0); }

// ══════════════════════════════════════════════════════════════════════════════
// 1. BASE FDP TABLE — EW OM-A (spot check every row boundary and midpoint)
// ══════════════════════════════════════════════════════════════════════════════

// Row: 06:00–13:29 → [13:00, 12:30, 12:00, 11:30, 11:00]
eq('EW base 06:00 1-2sec', getFDPLimit(mins(6,0),  1, 'EUROWINGS'), mins(13,0));
eq('EW base 06:00 3sec',   getFDPLimit(mins(6,0),  3, 'EUROWINGS'), mins(12,30));
eq('EW base 06:00 4sec',   getFDPLimit(mins(6,0),  4, 'EUROWINGS'), mins(12,0));
eq('EW base 06:00 5sec',   getFDPLimit(mins(6,0),  5, 'EUROWINGS'), mins(11,30));
eq('EW base 06:00 6sec',   getFDPLimit(mins(6,0),  6, 'EUROWINGS'), mins(11,0));
eq('EW base 10:00 1-2sec', getFDPLimit(mins(10,0), 1, 'EUROWINGS'), mins(13,0));
eq('EW base 13:29 4sec',   getFDPLimit(mins(13,29),4, 'EUROWINGS'), mins(12,0));

// Row: 13:30–13:59 → [12:45, 12:15, 11:45, 11:15, 10:45]
eq('EW base 13:30 1-2sec', getFDPLimit(mins(13,30),1, 'EUROWINGS'), mins(12,45));
eq('EW base 13:30 6sec',   getFDPLimit(mins(13,30),6, 'EUROWINGS'), mins(10,45));

// Row: 17:00–23:59 → [11:00, 10:30, 10:00, 09:30, 09:00]
eq('EW base 17:00 1-2sec', getFDPLimit(mins(17,0), 1, 'EUROWINGS'), mins(11,0));
eq('EW base 20:00 3sec',   getFDPLimit(mins(20,0), 3, 'EUROWINGS'), mins(10,30));
eq('EW base 23:59 6sec',   getFDPLimit(mins(23,59),6, 'EUROWINGS'), mins(9,0));

// Row: 00:00–04:59 → [11:00, 10:30, 10:00, 09:30, 09:00]
eq('EW base 00:00 1-2sec', getFDPLimit(mins(0,0),  1, 'EUROWINGS'), mins(11,0));
eq('EW base 04:59 5sec',   getFDPLimit(mins(4,59), 5, 'EUROWINGS'), mins(9,30));

// 15-min morning bands
eq('EW base 05:00 1-2sec', getFDPLimit(mins(5,0),  1, 'EUROWINGS'), mins(12,0));
eq('EW base 05:14 3sec',   getFDPLimit(mins(5,14), 3, 'EUROWINGS'), mins(11,30));
eq('EW base 05:15 1-2sec', getFDPLimit(mins(5,15), 1, 'EUROWINGS'), mins(12,15));
eq('EW base 05:30 4sec',   getFDPLimit(mins(5,30), 4, 'EUROWINGS'), mins(11,30));
eq('EW base 05:45 5sec',   getFDPLimit(mins(5,45), 5, 'EUROWINGS'), mins(11,15));
eq('EW base 05:59 6sec',   getFDPLimit(mins(5,59), 6, 'EUROWINGS'), mins(10,45));

// Row boundaries
eq('EW base 16:00 1-2sec', getFDPLimit(mins(16,0), 1, 'EUROWINGS'), mins(11,30));
eq('EW base 16:30 4sec',   getFDPLimit(mins(16,30),4, 'EUROWINGS'), mins(10,15));

// ══════════════════════════════════════════════════════════════════════════════
// 2. BASE FDP TABLE — EASA (spot checks)
// ══════════════════════════════════════════════════════════════════════════════

eq('EASA base 06:00 1-2sec',  getFDPLimit(mins(6,0),  1, 'EASA'), mins(13,0));
eq('EASA base 06:00 3-4sec',  getFDPLimit(mins(6,0),  3, 'EASA'), mins(12,0));
eq('EASA base 06:00 5-6sec',  getFDPLimit(mins(6,0),  5, 'EASA'), mins(11,30));
eq('EASA base 17:00 1-2sec',  getFDPLimit(mins(17,0), 1, 'EASA'), mins(9,0));
eq('EASA base 17:00 3-4sec',  getFDPLimit(mins(17,0), 3, 'EASA'), mins(9,0));
eq('EASA base 00:00 1-2sec',  getFDPLimit(mins(0,0),  1, 'EASA'), mins(11,0));
eq('EASA base 23:00 5-6sec',  getFDPLimit(mins(23,0), 5, 'EASA'), mins(9,30));

// ══════════════════════════════════════════════════════════════════════════════
// 3. OPERATOR EXTENSION TABLE — EW
// ══════════════════════════════════════════════════════════════════════════════

// Prohibited windows
eq('EW ext 00:00 1-2sec prohibited', getEWExtendedFDP(mins(0,0),   1), null);
eq('EW ext 05:59 1-2sec prohibited', getEWExtendedFDP(mins(5,59),  1), null);
eq('EW ext 06:14 4sec prohibited',   getEWExtendedFDP(mins(6,14),  4), null);
eq('EW ext 19:00 1-2sec prohibited', getEWExtendedFDP(mins(19,0),  1), null);
eq('EW ext 23:59 1-2sec prohibited', getEWExtendedFDP(mins(23,59), 1), null);
eq('EW ext 6sec always prohibited',  getEWExtendedFDP(mins(8,0),   6), null);

// Permitted windows
eq('EW ext 06:15 1-2sec', getEWExtendedFDP(mins(6,15), 1), mins(13,15));
eq('EW ext 06:15 3sec',   getEWExtendedFDP(mins(6,15), 3), mins(12,45));
eq('EW ext 06:15 4sec',   getEWExtendedFDP(mins(6,15), 4), mins(12,15));
eq('EW ext 06:15 5sec',   getEWExtendedFDP(mins(6,15), 5), mins(11,45));
eq('EW ext 07:00 1-2sec', getEWExtendedFDP(mins(7,0),  1), mins(14,0));
eq('EW ext 07:00 3sec',   getEWExtendedFDP(mins(7,0),  3), mins(13,30));
eq('EW ext 07:00 4sec',   getEWExtendedFDP(mins(7,0),  4), mins(13,0));
eq('EW ext 07:00 5sec',   getEWExtendedFDP(mins(7,0),  5), mins(12,30));
eq('EW ext 13:29 1-2sec', getEWExtendedFDP(mins(13,29),1), mins(14,0));
eq('EW ext 13:30 1-2sec', getEWExtendedFDP(mins(13,30),1), mins(13,45));
eq('EW ext 13:30 5sec prohibited', getEWExtendedFDP(mins(13,30),5), null);
eq('EW ext 15:30 1-2sec', getEWExtendedFDP(mins(15,30),1), mins(12,45));
eq('EW ext 15:30 3sec prohibited', getEWExtendedFDP(mins(15,30),3), null);
eq('EW ext 18:30 1-2sec', getEWExtendedFDP(mins(18,30),1), mins(11,15));
eq('EW ext 18:59 1-2sec', getEWExtendedFDP(mins(18,59),1), mins(11,15));

// ══════════════════════════════════════════════════════════════════════════════
// 4. COMMANDER'S DISCRETION — always baseFDP + 120, no cap
// ══════════════════════════════════════════════════════════════════════════════

// CD only (no Op Ext)
eq('CD only EW 06:00 4sec', computeMaxFDP(mins(6,0), 4, 'EUROWINGS', false, true), mins(12,0)+120);
eq('CD only EW 17:00 4sec', computeMaxFDP(mins(17,0),4, 'EUROWINGS', false, true), mins(10,0)+120);
eq('CD only EASA 06:00 3sec', computeMaxFDP(mins(6,0),3, 'EASA', false, true), mins(12,0)+120);

// CD + Op Ext: max(ewExtendedFDP, baseFDP+120)
// 07:00 4sec: base=12:00, ext=13:00, CD=12:00+2h=14:00 → max(13:00, 14:00) = 14:00
eq('CD+OpExt EW 07:00 4sec', computeMaxFDP(mins(7,0), 4, 'EUROWINGS', true, true), mins(12,0)+120);
// 07:00 1-2sec: base=13:00, ext=14:00, CD=13:00+2=15:00 → max(14:00, 15:00) = 15:00
eq('CD+OpExt EW 07:00 1sec', computeMaxFDP(mins(7,0), 1, 'EUROWINGS', true, true), mins(15,0));
// 06:15 1-2sec: base=13:00, ext=13:15, CD=15:00 → max(13:15, 15:00) = 15:00
eq('CD+OpExt EW 06:15 1sec', computeMaxFDP(mins(6,15),1, 'EUROWINGS', true, true), mins(15,0));

// CD on prohibited Op Ext report time (19:00) — CD still works on base
eq('CD EW 19:00 4sec no OpExt', computeMaxFDP(mins(19,0),4,'EUROWINGS',false,true), mins(10,0)+120);

// ══════════════════════════════════════════════════════════════════════════════
// 5. NIGHT DUTY — 02:00–04:59 LT
// ══════════════════════════════════════════════════════════════════════════════

// FDP entirely within night window → night duty
eq('Night: FDP 02:00–03:00 LT', isNightDuty(mins(2,0),  mins(3,0)),  true);
// FDP ends just inside window
eq('Night: ends 04:59 LT',      isNightDuty(mins(1,0),  mins(4,59)), true);
// FDP ends at 05:00 but overlaps window (02:00–04:59) — 01:00 ≤ 04:59 and 05:00 ≥ 02:00
eq('Night: ends 05:00 LT',      isNightDuty(mins(1,0),  mins(5,0)),  true);
// FDP starts just inside window
eq('Night: starts 04:59 LT',    isNightDuty(mins(4,59), mins(6,0)),  true);
// FDP entirely before window
eq('Night: 22:00–01:59 no night', isNightDuty(mins(22,0), mins(25,59)), false);
// FDP crosses midnight and encroaches window
eq('Night: 23:00 +5h crosses 02:00', isNightDuty(mins(23,0), mins(23,0)+300), true);
// FDP 05:00–18:00 entirely after window
eq('Night: 05:00–18:00 no night', isNightDuty(mins(5,0), mins(18,0)), false);
// FDP 06:00–19:00 — no encroachment
eq('Night: 06:00–19:00 no night', isNightDuty(mins(6,0), mins(19,0)), false);
// FDP 02:00 start exactly
eq('Night: starts 02:00 exactly', isNightDuty(mins(2,0), mins(14,0)), true);
// FDP ends 01:59 — just before window
eq('Night: ends 01:59', isNightDuty(mins(20,0), mins(25,59)), false);

// ══════════════════════════════════════════════════════════════════════════════
// 6. WOCL ENCROACHMENT (02:00–05:59 LT)
// ══════════════════════════════════════════════════════════════════════════════

// No encroachment
eq('WOCL: 06:00–19:00 = 0',  woclEncroachmentMins(mins(6,0),  mins(19,0)), 0);
eq('WOCL: 07:00–21:00 = 0',  woclEncroachmentMins(mins(7,0),  mins(21,0)), 0);
// Full overlap
eq('WOCL: 02:00–06:00 = 240', woclEncroachmentMins(mins(2,0),  mins(6,0)),  239); // 02:00–05:59 = 239 min
// Partial start overlap
eq('WOCL: 01:00–04:00 = 120', woclEncroachmentMins(mins(1,0),  mins(4,0)),  120);
// Partial end overlap
eq('WOCL: 04:00–07:00 = 119', woclEncroachmentMins(mins(4,0),  mins(7,0)),  119); // 04:00–05:59 = 119
// Cross midnight encroaching WOCL next day: 23:00→04:00, WOCL 02:00–05:59 overlap = 02:00–04:00 = 120 min
eq('WOCL: 23:00 +5h crosses 02:00', woclEncroachmentMins(mins(23,0), mins(23,0)+300), 120);

// ══════════════════════════════════════════════════════════════════════════════
// 7. MINIMUM REST
// ══════════════════════════════════════════════════════════════════════════════

// Home base, no Op Ext: max(duty, 12h)
eq('Rest home no ext: duty 10h → 12h', computeMinRest(600, 'home', false), 720);
eq('Rest home no ext: duty 13h → 13h', computeMinRest(780, 'home', false), 780);
eq('Rest home no ext: duty 12h → 12h', computeMinRest(720, 'home', false), 720);

// Away base, no Op Ext: max(duty, 10h)
eq('Rest away no ext: duty 8h → 10h',  computeMinRest(480, 'away', false), 600);
eq('Rest away no ext: duty 11h → 11h', computeMinRest(660, 'away', false), 660);
eq('Rest away no ext: duty 10h → 10h', computeMinRest(600, 'away', false), 600);

// Home base + Op Ext: max(duty, 12h) + 4h
eq('Rest home Op Ext: duty 10h → 16h', computeMinRest(600, 'home', true), 720+240);
eq('Rest home Op Ext: duty 13h → 17h', computeMinRest(780, 'home', true), 780+240);
eq('Rest home Op Ext: duty 14h30 → 18h30', computeMinRest(870, 'home', true), 870+240);

// Away base + Op Ext: max(duty, 10h) + 4h
eq('Rest away Op Ext: duty 8h → 14h',  computeMinRest(480, 'away', true), 600+240);
eq('Rest away Op Ext: duty 14h30 → 18h30', computeMinRest(870, 'away', true), 870+240);

// ══════════════════════════════════════════════════════════════════════════════
// 8. UTC OFFSET — LT conversion
// ══════════════════════════════════════════════════════════════════════════════

// UTC+2: 06:00 UTC → 08:00 LT → base FDP table row 06:00–13:29 → 13:00 (1-2sec)
const reportUTC_0600 = mins(6,0);
const ltOffset = 2;
const reportLT_0800 = reportUTC_0600 + ltOffset * 60;  // 480 mins = 08:00
eq('UTC+2: 06:00 UTC → 08:00 LT table lookup', getFDPLimit(reportLT_0800, 1, 'EUROWINGS'), mins(13,0));

// UTC+2: 04:00 UTC → 06:00 LT → base FDP table row 06:00–13:29
const reportLT_0600 = mins(4,0) + 2*60;  // = 06:00 LT
eq('UTC+2: 04:00 UTC → 06:00 LT table lookup', getFDPLimit(reportLT_0600, 4, 'EUROWINGS'), mins(12,0));

// UTC+2: 21:00 UTC → 23:00 LT → row 17:00–23:59 → [11:00, 10:30, 10:00, 09:30, 09:00]
const reportLT_2300 = mins(21,0) + 2*60;  // = 23:00 LT
eq('UTC+2: 21:00 UTC → 23:00 LT table lookup 4sec', getFDPLimit(reportLT_2300, 4, 'EUROWINGS'), mins(10,0));

// ══════════════════════════════════════════════════════════════════════════════
// 9. FDP END (UTC)
// ══════════════════════════════════════════════════════════════════════════════

// Report 06:00 UTC, offset +2, 4 sectors → LT 08:00 → base 12:00 → end 18:00 UTC
{
  const rUTC = mins(6,0), off = 2, sec = 4;
  const rLT  = rUTC + off*60;
  const base = getFDPLimit(rLT, sec, 'EUROWINGS');
  eq('FDP end UTC: 06:00 UTC+2 4sec', rUTC + base, mins(18,0));
}

// Report 22:00 UTC, offset +2, 2 sectors → LT 00:00 → base 11:00 → end 09:00 UTC next day
{
  const rUTC = mins(22,0), off = 2, sec = 2;
  const rLT  = rUTC + off*60;  // = 1440 = 00:00 LT
  const base = getFDPLimit(rLT % 1440 === 0 ? 0 : rLT, sec, 'EUROWINGS');
  eq('FDP end UTC: 22:00 UTC+2 2sec base', base, mins(11,0));
  eq('FDP end UTC: 22:00 UTC+2 2sec end', rUTC + base, mins(22,0)+mins(11,0));
}

// ══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\n${'='.repeat(60)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(f => console.log(f));
} else {
  console.log('All tests passed.');
}
process.exit(failed > 0 ? 1 : 0);
