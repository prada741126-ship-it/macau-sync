const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'db.json');
// 嘗試 index.html，不存在則用 macau_report.html
const HTML_FILE = (function() {
  var idx = path.join(__dirname, 'index.html');
  if (fs.existsSync(idx)) return idx;
  return path.join(__dirname, 'macau_report.html');
})();

// 启用 CORS（允许手机访问）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-sync-password');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 确保 db.json 存在
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ txs: [], fundWithdrawals: [], agentWallets: {}, config: {}, agentList: [], archives: {}, lastModified: 0 }, null, 2), 'utf8');
}

app.use(express.json({ limit: '5mb' }));

// 密码保护（API 层面）
var SYNC_PASSWORD = process.env.SYNC_PASSWORD || 'macau888';

// 所有 /api/* 接口都验证密码（静态资源和首页不验证）
app.use('/api', function(req, res, next) {
  if (req.method === 'OPTIONS') return next();
  var pass = req.headers['x-sync-password'] || '';
  if (pass !== SYNC_PASSWORD) {
    return res.status(403).json({ ok: false, error: '密码错误' });
  }
  next();
});

// 静态资源（bg_logo.png, css, js 等）
app.use(express.static(__dirname));

// 根路径 - 返回 HTML
app.get('/', (req, res) => {
  res.sendFile(HTML_FILE);
});

// Railway 健康檢查
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'running', version: '5.9' });
});

// 读取数据库
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) { console.error('readDB error:', e.message); }
  return { txs: [], fundWithdrawals: [], agentWallets: {}, config: {}, agentList: [], archives: {}, lastModified: 0 };
}

// 写入数据库
function writeDB(data) {
  data.lastModified = Date.now();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 获取全量数据
app.get('/api/all', (req, res) => {
  const db = readDB();
  res.json({ ok: true, data: db, lastModified: db.lastModified || 0 });
});

// 检查是否有更新（轻量轮询）
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

// 保存全量数据
app.post('/api/save', (req, res) => {
  try {
    const body = req.body;
    const db = readDB();
    // 合并客户端数据
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

app.listen(PORT, () => {
  console.log('Sync server running on port ' + PORT);
});
