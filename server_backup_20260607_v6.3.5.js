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
    var initData = { txs: [], fundWithdrawals: [], agentWallets: {}, config: {}, agentList: [], archives: {}, rm_bookings: [], rm_last_id: 1, deletedIds: [], lastModified: 0 };
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
    return res.status(403).json({ ok: false, error: '密碼錯誤' });
  }
  next();
});

// 靜態資源（bg_logo.png, css, js 等）
app.use(express.static(__dirname));

// 根路徑 - 返回 HTML（禁止快取，確保客戶端總是取得最新版本）
app.get('/', (req, res) => {
  if (fs.existsSync(HTML_FILE)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(HTML_FILE);
  } else {
    res.status(404).send('index.html not found at: ' + HTML_FILE);
  }
});

// Railway 健康檢查
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'running', version: '6.3.4' });
});

// 讀取數據庫
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) { console.error('readDB error:', e.message); }
  return { txs: [], fundWithdrawals: [], agentWallets: {}, config: {}, agentList: [], archives: {}, rm_bookings: [], rm_last_id: 1, deletedIds: [], lastModified: 0 };
}

// 按 ID 合併陣列（保留伺服器上客戶端沒有的資料，防止刪除被還原）
// 策略：existing 先放入 Map；incoming 合併時，若 existing 已有 deleted:true 則保留刪除標記
function mergeById(existing, incoming) {
  if (!incoming || !Array.isArray(incoming) || incoming.length === 0) {
    return existing || [];
  }
  var map = new Map();
  // 先放入伺服器現有資料（保留順序）
  if (existing && Array.isArray(existing)) {
    for (var i = 0; i < existing.length; i++) {
      var item = existing[i];
      if (item && item.id !== undefined) {
        map.set(item.id, item);
      }
    }
  }
  // 用客戶端資料合併（相同 ID 以客戶端為準，但保留 deleted:true）
  for (var i = 0; i < incoming.length; i++) {
    var item = incoming[i];
    if (item && item.id !== undefined) {
      var existingItem = map.get(item.id);
      // 關鍵：如果伺服器已有 deleted:true，且客戶端未標記刪除，保留刪除狀態
      // 防止舊設備上傳舊資料覆寫刪除標記
      if (existingItem && existingItem.deleted && !item.deleted) {
        // 保留現有資料（含 deleted:true），不讓舊資料覆寫
        // （不執行 map.set，保留 existingItem）
      } else {
        map.set(item.id, item);
      }
    }
  }
  // 依插入順序轉回陣列（Map 保留插入順序）
  return Array.from(map.values());
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

// 保存全量數據（舊版，保留相容）
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

// ===== 同步上傳：改為按 ID 合併，不下載時過濾 deleted 標記 =====
app.post('/api/sync/upload', (req, res) => {
  try {
    const body = req.body;
    const db = readDB();

    // txs：按 ID 合併（保留伺服器上客戶端沒有的資料）
    if (body.txs !== undefined) {
      db.txs = mergeById(db.txs, body.txs);
    }

    // fundWithdrawals：按 ID 合併
    if (body.fundWithdrawals !== undefined) {
      db.fundWithdrawals = mergeById(db.fundWithdrawals, body.fundWithdrawals);
    }

    // agentWallets：按 agent 名稱合併（不覆寫整個物件）
    if (body.agentWallets !== undefined && typeof body.agentWallets === 'object') {
      if (!db.agentWallets) db.agentWallets = {};
      var walletKeys = Object.keys(body.agentWallets);
      for (var wi = 0; wi < walletKeys.length; wi++) {
        db.agentWallets[walletKeys[wi]] = body.agentWallets[walletKeys[wi]];
      }
    }

    // agentList：合併（保留所有唯一名稱）
    if (body.agentList !== undefined && Array.isArray(body.agentList)) {
      var nameSet = new Set(db.agentList || []);
      for (var ai = 0; ai < body.agentList.length; ai++) {
        if (body.agentList[ai]) nameSet.add(body.agentList[ai]);
      }
      db.agentList = [];
      nameSet.forEach(function(n) { db.agentList.push(n); });
    }

    // config / workingMonth
    if (body.config !== undefined) {
      if (!db.config) db.config = {};
      var cfgKeys = Object.keys(body.config);
      for (var ci = 0; ci < cfgKeys.length; ci++) {
        db.config[cfgKeys[ci]] = body.config[cfgKeys[ci]];
      }
    }
    if (body.workingMonth !== undefined) {
      if (!db.config) db.config = {};
      db.config.workingMonth = body.workingMonth;
    }

    // archives：按月分合併（不覆寫整個物件）
    if (body.archives !== undefined && typeof body.archives === 'object') {
      if (!db.archives) db.archives = {};
      var archKeys = Object.keys(body.archives);
      for (var ai = 0; ai < archKeys.length; ai++) {
        db.archives[archKeys[ai]] = body.archives[archKeys[ai]];
      }
    }

    // rm_bookings：按 ID 合併
    if (body.rm_bookings !== undefined) {
      db.rm_bookings = mergeById(db.rm_bookings, body.rm_bookings);
    }
    if (body.rm_last_id !== undefined && body.rm_last_id > (db.rm_last_id || 0)) {
      db.rm_last_id = body.rm_last_id;
    }

    writeDB(db);
    res.json({ ok: true, lastModified: db.lastModified });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 同步下載：回傳所有資料（含 deleted 標記，由前端過濾）
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
