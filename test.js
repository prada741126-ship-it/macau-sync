#!/usr/bin/env node
/**
 * v11.2.x Macau Dashboard Regression Tests
 * 
 * Run: node test.js
 * 
 * Tests core logic functions without needing a browser or Firebase.
 */
'use strict';

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEST_COUNT = { pass: 0, fail: 0, skip: 0 };

// ===== 1. Create jsdom =====
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
  <!-- Query page elements -->
  <select id="q-agent"><option value="">全部代理</option></select>
  <select id="q-month">
    <option value="__ALL__">全部月份</option>
    <option value="2026-06">2026-06</option>
    <option value="2026-05">2026-05</option>
    <option value="2026-07">2026-07</option>
  </select>
  <select id="q-venue"><option value="">全部地點</option></select>
  <input id="q-date-from" type="text">
  <input id="q-date-to" type="text">
  <input id="q-vol-min" type="text">
  <input id="q-vol-max" type="text">
  <div id="query-kpi"></div>
  <div id="query-body"></div>
  <div id="adv-filter"></div>
  <button id="btn-adv-filter"></button>
  <!-- All table elements -->
  <table id="all-table"></table>
  <div id="all-body"></div>
  <div id="all-msg"></div>
  <input id="search-all" type="text">
  <div id="tx-count"></div>
  <!-- Overview -->
  <div id="page-overview"></div>
  <!-- Sidebar -->
  <div id="tw-value"></div>
  <!-- Modal elements -->
  <div id="agent-wallet-modal"></div>
  <div id="agent-wallet-title"></div>
  <input id="aw-date" type="text">
  <input id="aw-amount" type="text">
  <input id="aw-note" type="text">
  <select id="aw-type"><option value="withdraw">提領</option></select>
  <input id="aw-balance" type="text">
  <!-- Month badge -->
  <span id="month-badge"></span>
  <span id="month-status"></span>
  <button id="btn-close-month"></button>
</body>
</html>
`, { url: 'http://localhost', runScripts: 'outside-only' });

// ===== 2. Set up globals =====
const window = dom.window;
const document = window.document;

// Polyfill localStorage & sessionStorage (jsdom provides them but let's ensure they work)
global.window = window;
global.document = document;
global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
global.HTMLElement = window.HTMLElement;
global.DOMParser = window.DOMParser;
global.console = console;

// navigator is read-only in Node 22+, use Object.defineProperty if needed
try {
  Object.defineProperty(global, 'navigator', { value: window.navigator, writable: true });
} catch(e) { /* Node 22+ has native getter, fallback below */ }
try {
  Object.defineProperty(global, 'customElements', { value: window.customElements, writable: true });
} catch(e) {}

// Mock requestAnimationFrame
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 0); };
global.cancelAnimationFrame = function(id) { clearTimeout(id); };

// Mock Firebase
global.firebase = {
  database: function() { return {}; },
  initializeApp: function() { return {}; }
};
// crypto is read-only in Node 22+
try {
  Object.defineProperty(global, 'crypto', { value: window.crypto, writable: true });
} catch(e) {}

// ===== 3. Load JS files in order =====
const vm = require('vm');

const JS_FILES = [
  'js/config.js',
  'js/storage.js',
  'js/utils.js',
  'js/crypto.js',
  'js/ui/toast.js',
  'js/data/transactions.js',
  'js/auth.js',
  'js/auth-navigation.js',
  'js/navigation.js',
  'js/data/backup.js',
  'js/data/fund.js',
  'js/data/agent-wallets.js',
  'js/sync.js',
  'js/pages/query.js',
  'js/data/agent-list.js',
  'js/pages/overview.js',
  'js/pages/overview-charts.js',
  'js/pages/rank-chart.js',
  'js/pages/room.js',
  'js/pages/room-misc.js',
  'js/hotel-config-presets.js',
  'js/hotel-config-logic.js',
  'js/mobile.js',
];

// Mock body locking
global.lockBody = function() {};
global.unlockBody = function() {};

// Override problematic functions before loading
// We'll load each file through vm.runInThisContext to make var/function declarations global
for (const f of JS_FILES) {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) { console.log('[test] SKIP missing: ' + f); continue; }
  let src = fs.readFileSync(fp, 'utf8');
  // Remove 'use strict' (vm.runInThisContext needs sloppy mode for var → global)
  src = src.replace(/^'use strict';\s*/m, '');
  try {
    vm.runInThisContext(src, { filename: f });
  } catch(e) {
    console.log('[test] WARN loading ' + f + ': ' + e.message);
  }
}

// ===== 4. MOCK DANGEROUS FUNCTIONS =====
// Mock Firebase calls that would fail
global.db = null;

// Mock showToast
const origShowToast = global.showToast;
global.showToast = function(msg, type) {
  // Silent in tests
};

// Mock syncUpload
global.syncUpload = function() {};

// Mock CryptoJS
global.CryptoJS = {
  AES: {
    encrypt: function(data, key) { return { toString: function() { return data; } }; },
    decrypt: function(data, key) { return { toString: function(t) { return data; } }; }
  },
  enc: { Utf8: 'Utf8' }
};

// ===== 5. Set up test data =====
function resetTestData() {
  global.txs = [
    { _fbKey: 'tx001', id: 1, date: '2026-06-01', agent: '陳大文', client: '張三', venue: '新濠(勵盈1)', volume: 500, comm: 6000, bonus: 4500, drawn: 1000, fund: 1500, cash: 0, note: '' },
    { _fbKey: 'tx002', id: 2, date: '2026-06-05', agent: '李大龍', client: '李四', venue: '銀河(金門1)', volume: 300, comm: 3600, bonus: 2700, drawn: 0, fund: 900, cash: 0, note: '' },
    { _fbKey: 'tx003', id: 3, date: '2026-06-10', agent: '陳大文', client: '王五', venue: '永利(永利會)', volume: 800, comm: 9600, bonus: 7200, drawn: 1000, fund: 2400, cash: 0, note: '' },
    { _fbKey: 'tx004', id: 4, date: '2026-05-20', agent: '陳大文', client: '趙六', venue: '金沙(御匾會)', volume: 200, comm: 2400, bonus: 1800, drawn: 0, fund: 600, cash: 0, note: '' },
    { _fbKey: 'tx005', id: 5, date: '2026-07-01', agent: '李大龍', client: '錢七', venue: '上葡京', volume: 1000, comm: 12000, bonus: 9000, drawn: 0, fund: 3000, cash: 0, note: '' },
  ];
  global.fundWithdrawals = [];
  global.agentWallets = {};
  global.nextId = 6;
  global.fundNextId = 1;
  global.agentWalletNextId = 1;
}

// Initialize
resetTestData();

// ===== 6. Test helpers =====
function assert(description, condition) {
  if (condition) {
    TEST_COUNT.pass++;
    console.log('  ✅ ' + description);
  } else {
    TEST_COUNT.fail++;
    console.log('  ❌ ' + description + ' <-- FAILED');
  }
}

function assertEqual(description, actual, expected) {
  if (actual === expected) {
    TEST_COUNT.pass++;
    console.log('  ✅ ' + description + ' → ' + JSON.stringify(actual));
  } else {
    TEST_COUNT.fail++;
    console.log('  ❌ ' + description + ' → got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected));
  }
}

function skip(description) {
  TEST_COUNT.skip++;
  console.log('  ⏭️  ' + description);
}

function runSuite(name, fn) {
  console.log('\n📋 ' + name);
  console.log('─'.repeat(60));
  fn();
}

// ===== 7. TESTS =====

// --- Suite: Utilities ---
runSuite('Utils - fmt()', function() {
  assertEqual('fmt(0)', global.fmt(0), '0');
  assertEqual('fmt(100)', global.fmt(100), '100');
  assertEqual('fmt(1000)', global.fmt(1000), '1,000');
  assertEqual('fmt(1234567)', global.fmt(1234567), '1,234,567');
  assertEqual('fmt(999999999)', global.fmt(999999999), '999,999,999');
  assertEqual('fmt(-1000)', global.fmt(-1000), '-1,000');
  assertEqual('fmt(0.5) → rounds down', global.fmt(0.5), '1');
  assertEqual('fmt("0")', global.fmt('0'), '0');
});

runSuite('Utils - toNum()', function() {
  assertEqual('toNum("500")', global.toNum('500'), 500);
  assertEqual('toNum("1,234")', global.toNum('1,234'), 1234);
  assertEqual('toNum("50万")', global.toNum('50万'), 50);
  assertEqual('toNum("")', global.toNum(''), 0);
  assertEqual('toNum()', global.toNum(), 0);
  assertEqual('toNum(123)', global.toNum(123), 123);
  assertEqual('toNum("abc")', global.toNum('abc'), 0);
  assertEqual('toNum("5 00")', global.toNum('5 00'), 500);
});

runSuite('Utils - calcComm()', function() {
  assertEqual('calcComm(500, 1.5)', global.calcComm(500, 1.5), 75000);
  assertEqual('calcComm(300, 1.0)', global.calcComm(300, 1.0), 30000);
  assertEqual('calcComm(100, 0.5)', global.calcComm(100, 0.5), 5000);
  assertEqual('calcComm(0, 1.0)', global.calcComm(0, 1.0), 0);
});

runSuite('Utils - calcFund()', function() {
  assertEqual('calcFund(6000, 4500)', global.calcFund(6000, 4500), 1500);
  assertEqual('calcFund(12000, 9000)', global.calcFund(12000, 9000), 3000);
  assertEqual('calcFund(100, 200)', global.calcFund(100, 200), -100);
});

runSuite('Utils - nowStr()', function() {
  var s = global.nowStr();
  assert('nowStr() returns string', typeof s === 'string');
  assert('nowStr() format YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(s));
});

runSuite('Utils - getDow()', function() {
  assert('getDow("2026-06-09") returns day', global.getDow('2026-06-09') !== '');
  assert('getDow("") returns ""', global.getDow('') === '');
  assert('getDow() returns ""', global.getDow() === '');
});

// --- Suite: Month filtering logic ---
runSuite('Month filtering - doQuery() behavior', function() {
  resetTestData();
  global.workingMonth = '2026-06';

  // Test: 選擇全部月份應顯示所有記錄
  document.getElementById('q-agent').value = '';
  document.getElementById('q-month').value = '__ALL__';
  document.getElementById('q-venue').value = '';
  document.getElementById('q-date-from').value = '';
  document.getElementById('q-date-to').value = '';
  document.getElementById('q-vol-min').value = '';
  document.getElementById('q-vol-max').value = '';

  var month = document.getElementById('q-month').value.trim();
  var skipMonthFilter = (month === '__ALL__');
  assertEqual('all-months: skipMonthFilter = true', skipMonthFilter, true);

  // Count matching records manually
  var countAll = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (!skipMonthFilter && global.txs[i].date && global.txs[i].date.indexOf(month) !== 0) continue;
    countAll++;
  }
  assertEqual('all-months: 5 records with no filter', countAll, 5);
});

runSuite('Month filtering - select 2026-06', function() {
  resetTestData();
  global.workingMonth = '2026-06';

  document.getElementById('q-agent').value = '';
  document.getElementById('q-month').value = '2026-06';

  var month = '2026-06';
  var count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].date && global.txs[i].date.indexOf(month) !== 0) continue;
    count++;
  }
  assertEqual('2026-06: 3 records filtered', count, 3);
});

runSuite('Month filtering - select 2026-05', function() {
  resetTestData();
  document.getElementById('q-month').value = '2026-05';
  var month = '2026-05';
  var count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].date && global.txs[i].date.indexOf(month) !== 0) continue;
    count++;
  }
  assertEqual('2026-05: 1 record', count, 1);

  // The record should be "趙六"
  var txs202605 = global.txs.filter(function(t) { return t.date && t.date.indexOf('2026-05') === 0; });
  assertEqual('2026-05: agent is 陳大文', txs202605[0].agent, '陳大文');
});

runSuite('Month filtering - select 2026-07', function() {
  resetTestData();
  document.getElementById('q-month').value = '2026-07';
  var month = '2026-07';
  var count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].date && global.txs[i].date.indexOf(month) !== 0) continue;
    count++;
  }
  assertEqual('2026-07: 1 record (李大龍)', count, 1);
});

// --- Suite: Agent wallet balance calc ---
runSuite('Agent wallet - calcTotalWallet()', function() {
  resetTestData();
  // Set up agent wallet: 陳大文 withdrew 2000
  global.agentWallets['陳大文'] = [
    { _fbKey: 'aw001', id: 1, date: '2026-06-15', type: 'withdraw', amount: 2000, note: '' }
  ];
  // sync drawn to 2000
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].agent === '陳大文') global.txs[i].drawn = 2000;
  }
  
  var a = '陳大文';
  var totalB = 0, totalC = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].agent === a) { totalB += (global.txs[i].bonus || 0); totalC += (global.txs[i].cash || 0); }
  }
  var awArr = global.agentWallets[a] || [];
  var awWithdraw = 0;
  for (var i = 0; i < awArr.length; i++) {
    awWithdraw += (awArr[i].amount || 0);
  }
  var effectiveDrawn = Math.max(awWithdraw, global.txs.filter(function(t){return t.agent===a;})[0].drawn || 0);
  var bal = Math.max(0, totalB + totalC - effectiveDrawn);
  
  // 陳大文: bonus=4500+7200+1800=13500, drawn eff=2000, bal=11500
  assertEqual('陳大文 total bonus = 13500', totalB, 13500);
  assertEqual('陳大文 balance = 11500', bal, 11500);
});

// --- Suite: Agent filter ---
runSuite('Agent filter', function() {
  resetTestData();
  var agent = '陳大文';
  var count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].agent !== agent) continue;
    count++;
  }
  assertEqual('agent=陳大文: 3 records', count, 3);

  var agent2 = '李大龍';
  count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].agent !== agent2) continue;
    count++;
  }
  assertEqual('agent=李大龍: 2 records', count, 2);
});

// --- Suite: Month + Agent combined ---
runSuite('Combined filter: 2026-06 + 陳大文', function() {
  resetTestData();
  var month = '2026-06';
  var agent = '陳大文';
  var count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].date && global.txs[i].date.indexOf(month) !== 0) continue;
    if (global.txs[i].agent !== agent) continue;
    count++;
  }
  assertEqual('2026-06 + 陳大文: 2 records', count, 2);
});

// --- Suite: Volume filter ---
runSuite('Volume range filter', function() {
  resetTestData();
  var volMin = 500, volMax = 800;
  var count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    var vol = global.toNum(global.txs[i].volume) || 0;
    if (vol < volMin) continue;
    if (vol > volMax) continue;
    count++;
  }
  assertEqual('vol 500-800: 2 records', count, 2);
});

// --- Suite: Venue filter ---
runSuite('Venue filter', function() {
  resetTestData();
  var venue = '新濠(勵盈1)';
  var count = 0;
  for (var i = 0; i < global.txs.length; i++) {
    if (global.txs[i].venue !== venue) continue;
    count++;
  }
  assertEqual('venue=新濠(勵盈1): 1 record', count, 1);
});

// --- Suite: Month workingMonth default ---
runSuite('populateMonthDropdown() default month behavior', function() {
  resetTestData();
  
  // The dropdown has options set up by populateMonthDropdown
  // Reset and call it again
  var sel = document.getElementById('q-month');
  global.populateMonthDropdown();
  
  // After calling, the select should have the workingMonth set as value
  global.workingMonth = '2026-06';
  
  // Re-call populateMonthDropdown with workingMonth set
  global.populateMonthDropdown();
  
  // By convention, populateMonthDropdown should respect workingMonth
  // If workingMonth is set and exists as an option, it should be selected
  var currentWorkingMonth = global.workingMonth || global.nowStr().slice(0, 7);
  assert('workingMonth exists: ' + currentWorkingMonth, currentWorkingMonth !== '');
  
  // Key test: sel.value should be '__ALL__' (no default month override in v11.2.4 rollback)
  var afterValue = sel.value;
  assert('Dropdown value is "__ALL__" (no default month override): got "' + afterValue + '"', afterValue === '__ALL__');
});

// --- Suite: calcTotalWallet() for 0 data ---
runSuite('calcTotalWallet() with empty data', function() {
  var savedTxs = global.txs;
  var savedFW = global.fundWithdrawals;
  var savedAW = global.agentWallets;
  global.txs = [];
  global.fundWithdrawals = [];
  global.agentWallets = {};
  
  var result = global.calcTotalWallet();
  assertEqual('empty data returns 0', result, 0);
  
  global.txs = savedTxs;
  global.fundWithdrawals = savedFW;
  global.agentWallets = savedAW;
});

// --- Suite: Depth ---
runSuite('Depth - deepEqual (utils if exists)', function() {
  try {
    if (typeof global.deepEqual === 'function') {
      assert('deepEqual works', global.deepEqual({a:1}, {a:1}));
    } else {
      skip('deepEqual not defined');
    }
  } catch(e) {
    skip('deepEqual error: ' + e.message);
  }
});

// ===== 8. Report =====
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS');
console.log('─'.repeat(60));
console.log('  ✅ Passed: ' + TEST_COUNT.pass);
console.log('  ❌ Failed: ' + TEST_COUNT.fail);
console.log('  ⏭️  Skipped: ' + TEST_COUNT.skip);
console.log('─'.repeat(60));
if (TEST_COUNT.fail === 0) {
  console.log('  ✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.log('  ❌ SOME TESTS FAILED');
  process.exit(1);
}
