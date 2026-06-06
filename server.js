const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('[START] Railway server starting...');
console.log('[START] PORT=' + PORT + ', HOST=' + HOST);
console.log('[START] __dirname=' + __dirname);

const DB_FILE = path.join(__dirname, 'db.json');

// 嘗試 index.html，不存在則用 macau_report.html
var HTML_FILE = path.join(__dirname, 'index.html');
if (!fs.existsSync(HTML_FILE)) {
  HTML_FILE = path.join(__dirname, 'macau_report.html');
}
console.log('[START] HTML_FILE=' + HTML_FILE + ', exists=' + fs.existsSync(HTML_FILE));

// 啟用 CORS（允許手機訪問）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-sync-password');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 確保 db.json 存在
try {
  if (!fs.existsSync(DB_FILE)) {
    var initData = { txs: [], fundWithdrawals: [], agentWallets: {}, config: {}, agentList: [], archives: {}, rm_bookings: [], rm_last_id: 1, lastModified: 0 };
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2), 'utf8');
    console.log('[START] Created new db.json');
  } else {
    console.log('[START] db.json exists');
  }
} catch (e) {
  console.error('[START] db.json init error:', e.message);
}

app.use(express.json({ limit: '5mb' }));

// 密碼保護（API 層面）
var SYNC_PASSWORD = process.env.SYNC_PASSWORD || 'macau888';

// 所有 /api/* 接口都驗證密碼（靜態資源和首頁不驗證）
app.use('/api', function(req, res, next) {
  if (req.method === 'OPTIONS') return next();
  var pass = req.headers['x-sync-password'] || '';
  if (pass !== SYNC_PASSWORD) {
    return res.status(403).json({ ok: false, error: '密码错误' });
  }
  next();
});

// 靜態資源（bg_logo.png, css, js 等）
app.use(express.static(__dirname));

// 根路徑 - 返回 HTML
app.get('/', (req, res) => {
  if (fs.existsSync(HTML_FILE)) {
    res.sendFile(HTML_FILE);
  } else {
    res.status(404).send('index.html not found at: ' + HTML_FILE);
  }
});

// Railway 健康檢查
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'running', version: '5.9' });
});

// 讀取數據庫
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) { console.error('readDB error:', e.message); }
  return { txs: [], fundWithdrawals: [], agentWallets: {}, config: {}, agentList: [], archives: {}, rm_bookings: [], rm_last_id: 1, lastModified: 0 };
}

// 寫入數據庫
function writeDB(data) {
  data.lastModified = Date.now();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 獲取全量數據
app.get('/api/all', (req, res) => {
  const db = readDB();
  res.json({ ok: true, data: db, lastModified: db.lastModified || 0 });
});

// 檢查是否有更新（輕量輪詢）
app.get('/api/poll', (req, res) => {
  const clientTime = parseInt(req.query.since) || 0;
  const db = readDB();
  const serverTime = db.lastModified || 0;
  if (serverTime > clientTime) {
    res.json({ ok: true, changed: true, data: db, lastModified: serverTime });
  } else {
    res.json({ ok: true, changed: false, lastModified: serverTime });
  }
});

// 保存全量數據
app.post('/api/save', (req, res) => {
  try {
    const body = req.body;
    const db = readDB();
    if (body.txs !== undefined) db.txs = body.txs;
    if (body.fundWithdrawals !== undefined) db.fundWithdrawals = body.fundWithdrawals;
    if (body.agentWallets !== undefined) db.agentWallets = body.agentWallets;
    if (body.config !== undefined) db.config = body.config;
    if (body.agentList !== undefined) db.agentList = body.agentList;
    if (body.archives !== undefined) db.archives = body.archives;
    writeDB(db);
    res.json({ ok: true, lastModified: db.lastModified });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ===== 舊版 /api/sync/* 端點（與前端相容）=====
app.post('/api/sync/upload', (req, res) => {
  try {
    const body = req.body;
    const db = readDB();
    if (body.txs !== undefined) db.txs = body.txs;
    if (body.fundWithdrawals !== undefined) db.fundWithdrawals = body.fundWithdrawals;
    if (body.agentWallets !== undefined) db.agentWallets = body.agentWallets;
    if (body.config !== undefined) db.config = body.config;
    if (body.agentList !== undefined) db.agentList = body.agentList;
    if (body.archives !== undefined) db.archives = body.archives;
    if (body.workingMonth !== undefined) {
      if (!db.config) db.config = {};
      db.config.workingMonth = body.workingMonth;
    }
    if (body.rm_bookings !== undefined) db.rm_bookings = body.rm_bookings;
    if (body.rm_last_id !== undefined) db.rm_last_id = body.rm_last_id;
    writeDB(db);
    res.json({ ok: true, lastModified: db.lastModified });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/sync/download', (req, res) => {
  const db = readDB();
  res.json({
    ok: true,
    txs: db.txs || [],
    fundWithdrawals: db.fundWithdrawals || [],
    agentWallets: db.agentWallets || {},
    agentList: db.agentList || [],
    workingMonth: db.config ? db.config.workingMonth : '',
    archives: db.archives || {},
    rm_bookings: db.rm_bookings || [],
    rm_last_id: db.rm_last_id || 1,
    lastModified: db.lastModified || 0
  });
});

app.listen(PORT, HOST, () => {
  console.log('[START] Sync server running on http://' + HOST + ':' + PORT);
});
