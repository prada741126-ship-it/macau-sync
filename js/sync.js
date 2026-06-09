// js/sync.js - v11.0
// Non-overlapping extraction

// 輔助函數：將物件格式轉為陣列（Firebase 物件 → 本地陣列）
function _objToArray(obj) {
  var arr = [];
  if (obj && typeof obj === 'object') {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (v && typeof v === 'object' && !Array.isArray(v)) { v._fbKey = keys[i]; arr.push(v); }
    }
  }
  return arr;
}

// 輔助函數：將陣列轉為物件（本地陣列 → Firebase 物件格式）
function _arrToObj(arr) {
  var obj = {};
  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    if (!item._fbKey) item._fbKey = _fbKey();
    obj[item._fbKey] = item;
  }
  return obj;
}

// 輔助函數：將代理錢包物件值轉為 Firebase 物件格式
function _awArrToObj(aw) {
  var result = {};
  var agents = Object.keys(aw);
  for (var i = 0; i < agents.length; i++) {
    var agent = agents[i];
    var arr = aw[agent] || [];
    result[agent] = {};  // v10.15 修正：空陲列也要寫入，觸發 Firebase 刪除
    for (var j = 0; j < arr.length; j++) {
      var item = arr[j];
      if (!item._fbKey) item._fbKey = _fbKey();
      result[agent][item._fbKey] = item;
    }
  }
  return result;
}

function syncUpload() {
  if (!db) { console.log('[Sync ↑] Firebase 未初始化'); return; }
  console.log('[Sync ↑] v10.0 B方案：分路徑個別寫入');

  // v10.0 B方案：每個記錄已透過個別路徑寫入。syncUpload 作為批量備援。
  // 使用 transaction() 安全合併整個物件（不是陣列！）

  // 1. txs：交易記錄（物件格式）
  db.ref('macau_data/txs').transaction(function(current) {
    var fb = current || {};
    if (Array.isArray(fb)) fb = _arrToObj(fb);
    var local = _arrToObj(txs);
    var localKeys = {};
    var keys = Object.keys(local);
    for (var i = 0; i < keys.length; i++) { fb[keys[i]] = local[keys[i]]; localKeys[keys[i]] = true; }
    // 刪除 fb 中存在但本地不存在的鍵
    var fbKeys = Object.keys(fb);
    for (var j = 0; j < fbKeys.length; j++) { if (!localKeys[fbKeys[j]]) delete fb[fbKeys[j]]; }
    return fb;
  }, function(error, committed) {
    if (error) console.error('[Sync ↑] txs 失敗', error);
    else if (committed) console.log('[Sync ↑] txs 同步成功');
  });

  // 2. fundWithdrawals：公基金
  db.ref('macau_data/fundWithdrawals').transaction(function(current) {
    var fb = current || {};
    if (Array.isArray(fb)) fb = _arrToObj(fb);
    var local = _arrToObj(fundWithdrawals);
    var localKeys = {};
    var keys = Object.keys(local);
    for (var i = 0; i < keys.length; i++) { fb[keys[i]] = local[keys[i]]; localKeys[keys[i]] = true; }
    var fbKeys = Object.keys(fb);
    for (var j = 0; j < fbKeys.length; j++) { if (!localKeys[fbKeys[j]]) delete fb[fbKeys[j]]; }
    return fb;
  }, function(error, committed) {
    if (error) console.error('[Sync ↑] fundWithdrawals 失敗', error);
  });

  // 3. agentList（保持陣列）
  db.ref('macau_data/agentList').transaction(function(current) {
    if (current === null) return agentList;
    if (!Array.isArray(current)) return agentList;
    var s = {}; for (var i = 0; i < current.length; i++) s[current[i]] = true;
    for (var i = 0; i < agentList.length; i++) s[agentList[i]] = true;
    return Object.keys(s);
  });

  // 4. agentWallets（巢狀物件）
  console.log("[Sync ↑] === agentWallets transaction 開始 ===");
  console.log("[Sync ↑] 本地 agentWallets 代理列表:", JSON.stringify(Object.keys(agentWallets)));
  try { console.log("[Sync ↑] 本地 agentWallets 完整內容（前800字）:", JSON.stringify(agentWallets).substring(0, 800)); } catch(e) {}
  db.ref('macau_data/agentWallets').transaction(function(current) {
    console.log("[Sync ↑] transaction callback 觸發，current 有資料？", !!(current && Object.keys(current).length));
    try { console.log("[Sync ↑] current 內容（前800字）:", current ? JSON.stringify(current).substring(0, 800) : 'null'); } catch(e) {}
    var fb = current || {};
    var local = _awArrToObj(agentWallets);
    try { console.log("[Sync ↑] local (目標寫入值) 內容（前800字）:", JSON.stringify(local).substring(0, 800)); } catch(e) {}
    var localAgentKeys = {};
    var agents = Object.keys(local);
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      localAgentKeys[a] = {};
      if (!fb[a]) fb[a] = {};
      var keys = Object.keys(local[a]);
      for (var j = 0; j < keys.length; j++) { fb[a][keys[j]] = local[a][keys[j]]; localAgentKeys[a][keys[j]] = true; }
    }
    // 刪除 fb 中存在但本地不存在的鍵（每個代理內）
    var fbAgents = Object.keys(fb);
    console.log("[Sync ↑] 準備清理多餘鍵，fb 中有 " + fbAgents.length + " 個代理");
    for (var i = 0; i < fbAgents.length; i++) {
      var a = fbAgents[i];
      if (!localAgentKeys[a]) { console.log("[Sync ↑] 刪除整個代理 " + a + " (本地無此代理)"); delete fb[a]; continue; }
      var fbKeys = Object.keys(fb[a]);
      var delCount = 0;
      for (var j = 0; j < fbKeys.length; j++) { if (!localAgentKeys[a][fbKeys[j]]) { delete fb[a][fbKeys[j]]; delCount++; } }
      if (delCount > 0) console.log("[Sync ↑] 代理 " + a + " 刪除了 " + delCount + " 個鍵");
    }
    try { console.log("[Sync ↑] transaction callback 準備回傳，fb 內容（前800字）:", JSON.stringify(fb).substring(0, 800)); } catch(e) {}
    return fb;
  }, function(error, committed, snapshot) {
    if (error) { console.error('[Sync ↑] agentWallets transaction 失敗', error); }
    else if (committed) { console.log('[Sync ↑] === agentWallets transaction 成功提交 ==='); try { console.log('[Sync ↑] 提交後 Firebase 值（前800字）:', snapshot ? JSON.stringify(snapshot.val()).substring(0, 800) : 'null'); } catch(e) {} }
    else { console.log('[Sync ↑] agentWallets transaction 未提交（資料未變更）'); }
  });

  // 5. workingMonth
  if (workingMonth) db.ref('macau_data/workingMonth').set(workingMonth);

  // 6. rmBookings（修正：同步刪除）
  if (typeof RM !== 'undefined' && RM.bookings) {
    db.ref('macau_data/rmBookings').transaction(function(current) {
      // 以本地為基礎（確保刪除會同步）
      var local = _arrToObj(RM.bookings);
      if (!current) return local;  // Firebase 無資料，直接用本地
      var fb = current;
      if (Array.isArray(fb)) fb = _arrToObj(fb);  // 舊格式遷移
      // 先將本地所有記錄覆蓋到 fb
      var localKeys = {};
      var lk = Object.keys(local);
      for (var i = 0; i < lk.length; i++) { fb[lk[i]] = local[lk[i]]; localKeys[lk[i]] = true; }
      // 再刪除 fb 中存在但本地不存在的鍵（本地已刪除的）
      var fbKeys = Object.keys(fb);
      for (var j = 0; j < fbKeys.length; j++) {
        if (!localKeys[fbKeys[j]]) delete fb[fbKeys[j]];
      }
      return fb;
    }, function(error, committed) {
      if (error) console.error('[Sync ↑] rmBookings transaction 失敗', error);
      else if (committed) console.log('[Sync ↑] rmBookings 同步成功');
    });
  }

  // 7. archives
  try { var a = localStorage.getItem('macau_archives'); if (a) db.ref('macau_data/archives').set(JSON.parse(a)); } catch(e) {}

  console.log('[Sync ↑] 已送出');
}

function syncDownload() {
  // Firebase 使用即時監聽，無需手動下載
  console.log('[Sync ↓] Firebase 使用即時監聽');
}

function manualSync() {
  showLoading('正在同步…');
  syncUpload();
  setTimeout(function() { hideLoading(); showToast('同步完成', 'success'); }, 800);
}

// v10.0 B方案：Firebase push() 鍵架構 — 物件格式即時監聽

function initSync() {
  if (!db) { console.log('[Sync] Firebase 未初始化'); return; }
  console.log('[Sync] v10.0 B方案：push() 鍵即時同步已啟動');

  // v10.0 B方案：監聽物件格式資料，自動轉換為陣列（含 _fbKey）
  // 每個數據類型獨立監聽，互不干擾，永不衝突

  // 1. txs：交易記錄（物件 → 陣列）
  db.ref('macau_data/txs').on('value', function(snapshot) {
    try {
      var d = snapshot.val();
      if (!d) { txs = []; return; }
      // v10.0：支援三種格式：物件（新）、陣列（舊，遷移中）、空
      if (Array.isArray(d)) {
        // 舊格式陣列：自動遷移（給所有記錄補 _fbKey 並轉為物件）
        console.log('[Sync ↓] 偵測到舊格式 txs 陣列，自動遷移中...');
        txs = [];
        for (var i = 0; i < d.length; i++) {
          if (d[i] && typeof d[i] === 'object') {
            if (!d[i]._fbKey) d[i]._fbKey = _fbKey();
            txs.push(d[i]);
          }
        }
        // 寫回物件格式
        var newObj = _arrToObj(txs);
        db.ref('macau_data/txs').set(newObj);
      } else if (typeof d === 'object') {
        // 新格式物件：轉為陣列
        txs = _objToArray(d);
        if (!_migrated) { _migrated = true; console.log('[Sync ↓] 已遷移至 v10.0 物件格式'); }
      }
      // 更新 nextId
      var maxId = 0;
      for (var i = 0; i < txs.length; i++) { if (txs[i] && txs[i].id > maxId) maxId = txs[i].id; }
      nextId = maxId + 1;
      try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
      var pa = document.getElementById("page-all");
      if (pa && pa.style.display === "block") renderAll();
      var po = document.getElementById("page-overview");
      if (po && po.style.display === "block") renderOverview();
      var ps = document.getElementById("page-summary");
      if (ps && ps.style.display === "block") renderSummary();
      var pq = document.getElementById("page-query");
      if (pq && pq.style.display === "block") {
        var qm = document.getElementById("q-month");
        var savedMonth = qm ? qm.value : null;
        try { populateMonthDropdown(); } catch(e) {}
        if (qm && savedMonth) {
          for (var i = 0; i < qm.options.length; i++) {
            if (qm.options[i].value === savedMonth) { qm.value = savedMonth; break; }
          }
        }
        try { doQuery(); } catch(e) {}
      }
      try { updateTotalWalletUI(); } catch(e) {}
      console.log('[Sync ↓] txs 已同步，共 ' + txs.length + ' 筆');
    } catch(e) { console.error('[Sync ↓] txs 錯誤:', e); }
  });

  // 2. fundWithdrawals：公基金（物件 → 陣列）
  db.ref('macau_data/fundWithdrawals').on('value', function(snapshot) {
    try {
      var d = snapshot.val();
      if (!d) { fundWithdrawals = []; return; }
      if (Array.isArray(d)) {
        fundWithdrawals = [];
        for (var i = 0; i < d.length; i++) {
          if (d[i] && typeof d[i] === 'object') {
            if (!d[i]._fbKey) d[i]._fbKey = _fbKey();
            fundWithdrawals.push(d[i]);
          }
        }
        var newObj = _arrToObj(fundWithdrawals);
        db.ref('macau_data/fundWithdrawals').set(newObj);
      } else if (typeof d === 'object') {
        fundWithdrawals = _objToArray(d);
      }
      var maxId = 0;
      for (var i = 0; i < fundWithdrawals.length; i++) { if (fundWithdrawals[i] && fundWithdrawals[i].id > maxId) maxId = fundWithdrawals[i].id; }
      fundNextId = maxId + 1;
      try { localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals)); } catch(e) {}
      var pq = document.getElementById("page-query");
      if (pq && pq.style.display === "block") try { doQuery(); } catch(e) {}
      try { updateTotalWalletUI(); } catch(e) {}
    } catch(e) { console.error('[Sync ↓] fundWithdrawals 錯誤:', e); }
  });

  // 3. agentList（保持陣列）
  db.ref('macau_data/agentList').on('value', function(snapshot) {
    try { var d = snapshot.val(); if (d && Array.isArray(d)) { agentList = d; fillAgent(); } } catch(e) {}
  });

  // 4. agentWallets（巢狀物件 → 巢狀陣列）
  db.ref('macau_data/agentWallets').on('value', function(snapshot) {
    try {
      var d = snapshot.val();
      console.log('[Sync ↓] agentWallets 收到資料', d ? Object.keys(d).length + ' 個代理' : '空');
      // v10.17 修復：d===null 表示 Firebase 上整個 agentWallets 已被清空
      if (d === null) {
        console.log('[Sync ↓] Firebase 無資料，清空本地 agentWallets');
        agentWallets = {};
        saveAgentWalletsLocalOnly();
        try { doQuery(); } catch(e) {}
        return;
      }
      if (!d || typeof d !== 'object') return;
      var newAw = {};
      var agents = Object.keys(d);
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        var v = d[a];
        if (Array.isArray(v)) {
          // 舊格式陣列：自動遷移
          newAw[a] = [];
          for (var j = 0; j < v.length; j++) {
            if (v[j] && typeof v[j] === 'object') {
              if (!v[j]._fbKey) v[j]._fbKey = _fbKey();
              newAw[a].push(v[j]);
            }
          }
        } else if (typeof v === 'object') {
          newAw[a] = _objToArray(v);
        }
      }
      agentWallets = newAw;
      // 更新 agentWalletNextId
      var maxAWId = 0;
      agents = Object.keys(agentWallets);
      for (var i = 0; i < agents.length; i++) {
        var arr = agentWallets[agents[i]];
        for (var j = 0; j < arr.length; j++) { if (arr[j] && arr[j].id > maxAWId) maxAWId = arr[j].id; }
      }
      agentWalletNextId = maxAWId + 1;
      // v10.14 同步後刷新 UI（總是嘗試，確保資料變更時 UI 也跟著更新）
      try {
        console.log('[Sync ↓] 準備刷新 UI (agentWallets)');
        var pq = document.getElementById("page-query");
        if (pq) { console.log('[Sync ↓] 執行 doQuery()，pq.display=' + pq.style.display); doQuery(); }
        var po = document.getElementById("page-overview");
        if (po && po.style.display === "block") { console.log('[Sync ↓] 執行 renderOverview()'); renderOverview(); }
      } catch(e) { console.error('[Sync ↓] 刷新 UI 錯誤:', e); }
      // 顯示提示（避免過於頻繁，3秒內只顯示一次）
      if (!window._awToastTimer) {
        try { showToast('代理錢包資料已同步', 'success'); } catch(e) {}
        window._awToastTimer = true;
        setTimeout(function() { window._awToastTimer = false; }, 3000);
      }
      console.log('[Sync ↓] === agentWallets 資料處理完成 ===');
    } catch(e) { console.error('[Sync ↓] agentWallets listener 錯誤:', e); }
  }, function(error) {
    console.error('[Sync ↓] agentWallets listener 監聽錯誤:', error);
  });

 // 5. workingMonth
  db.ref('macau_data/workingMonth').on('value', function(snapshot) {
    try { var d = snapshot.val(); if (d) workingMonth = d; } catch(e) {}
  });

  // 6. rmBookings（v10.26 修復：直接寫 localStorage，不觸發 syncUpload 避免循環）
  db.ref('macau_data/rmBookings').on('value', function(snapshot) {
    try {
      if (typeof RM !== 'undefined') {
        var d = snapshot.val();
        if (!d) { RM.bookings = []; }
        else if (Array.isArray(d)) { RM.bookings = d; }
        else if (typeof d === 'object') { RM.bookings = _objToArray(d); }
        localStorage.setItem("rm_bookings", JSON.stringify(RM.bookings));
        RM.render();
      }
    } catch(e) {}
  });

  // 7. archives
  db.ref('macau_data/archives').on('value', function(snapshot) {
    try { var d = snapshot.val(); if (d) localStorage.setItem('macau_archives', JSON.stringify(d)); } catch(e) {}
  });

  console.log('[Sync] v10.0 B方案：所有監聽器已啟動');

  // v10.26 Firebase 連接監控 + 重連補償同步
  db.ref('.info/connected').on('value', function(snap) {
    var wasConnected = _syncConnected;
    _syncConnected = snap.val() === true;
    if (_syncConnected && !wasConnected) {
      console.log('[Sync] 偵測到重新連線，1.5 秒後觸發補償同步…');
      setTimeout(function() {
        console.log('[Sync] 執行重連補償同步');
        if (typeof syncUpload === 'function') syncUpload();
      }, 1500);
    } else if (!_syncConnected) {
      console.warn('[Sync] Firebase 連接已斷開');
    }
  });

  console.log('[Sync] v10.26 連接監控已啟動');
}

function renderSummary() {
  var map = {};
  for (var i = 0; i < txs.length; i++) {
    var t = txs[i];
    var key = (t.agent || "未設定") + "|" + (t.venue || "");
    if (!map[key]) map[key] = { agent: t.agent || "未設定", venue: t.venue, vol: 0, bonus: 0, drawn: 0, cash: 0 };
    map[key].vol += toNum(t.volume) || 0;
    map[key].bonus += t.bonus || 0;
    map[key].drawn += t.drawn || 0;
    if (t.type === "cash") map[key].cash += (t.cash || 0);
  }
  var tbody = document.getElementById("summary-body");
  tbody.innerHTML = "";
  var msgEl = document.getElementById("summary-msg");
  var tblEl = document.getElementById("summary-table");
  var keys = Object.keys(map);
  if (!keys.length) {
    if (tblEl) tblEl.style.display = "none";
    if (msgEl) {
      msgEl.style.display = "block";
      msgEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">尚無統計資料</div><div class="empty-desc">新增交易後將自動產生統計報表</div></div>';
    }
    document.getElementById("summary-kpi").innerHTML = "";
    return;
  }
  if (tblEl) tblEl.style.display = "table";
  if (msgEl) msgEl.style.display = "none";
  var totalBonus = 0, totalFund = 0;
  for (var k = 0; k < keys.length; k++) {
    var c = map[keys[k]];
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + c.agent + "</td>" +
      "<td>" + (c.venue || "-") + "</td>" +
      "<td class='num'>" + (c.vol >= 10000 ? (c.vol/10000).toFixed(1) + "萬" : fmt(c.vol)) + "</td>" +
      "<td class='num'>" + fmt(c.bonus) + "</td>" +
      "<td class='num'>" + fmt(c.drawn) + "</td>" +
      "<td class='num' style='color:#ffcc00;font-weight:700;'>" + fmt(Math.max(0, c.bonus - c.drawn + c.cash)) + "</td>";
    tbody.appendChild(tr);
    totalBonus += c.bonus;
    totalFund += Math.max(0, c.bonus - c.drawn + c.cash);
  }
  document.getElementById("summary-kpi").innerHTML =
    "<div class='kpi-card total-wallet-kpi'><div class='label'>💰 全部總錢包</div><div class='value'>¥" + fmt(calcTotalWallet()) + "</div></div>" +
    "<div class='kpi-card'><div class='label'>碼糧總額</div><div class='value'>" + fmt(totalBonus) + "</div></div>" +
    "<div class='kpi-card' style='background:#f0a500;'><div class='label'>未提領總額</div><div class='value'>" + fmt(totalFund) + "</div></div>";
  updateTotalWalletUI();
}

function quickFilter(type, ev) {
  var d = new Date();
  var utc8 = new Date(d.getTime() + 480*60000);
  var y = utc8.getUTCFullYear();
  var m = utc8.getUTCMonth() + 1;
  var day = utc8.getUTCDate();
  var sm = m < 10 ? "0" + m : "" + m;
  var month;
  if (type === "this_week") month = y + "-" + sm;
  else if (type === "last_week") {
    if (day <= 7) { if (m === 1) { y--; m = 12; } else { m--; } }
    month = y + "-" + (m < 10 ? "0" + m : "" + m);
  } else if (type === "this_month") month = y + "-" + sm;
  else if (type === "last_month") {
    if (m === 1) { y--; m = 12; } else { m--; }
    month = y + "-" + (m < 10 ? "0" + m : "" + m);
  } else if (type === "this_quarter") month = y.toString();
  else if (type === "this_year") month = y.toString();
  else month = "__ALL__";
  document.getElementById("q-month").value = month;
  var btns = document.querySelectorAll(".time-filter button");
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
  if (ev && ev.target) ev.target.classList.add("active");
  doQuery();
}

function fillAgent() {
  var sel = document.getElementById("q-agent");
  // v8.2 保存當前選擇的值，避免重建下拉框時重置
  var currentVal = sel.value;
  var h = "<option value=''>全部</option>";
  for (var j = 0; j < agentList.length; j++) { h += "<option value='" + agentList[j] + "'>" + agentList[j] + "</option>"; }
  h += "<option value='__FUND__'>公基金</option>";
  sel.innerHTML = h;
  // 恢復之前選擇的值（如果該選項仍存在）
  if (currentVal) {
    var exists = false;
    for (var k = 0; k < sel.options.length; k++) {
      if (sel.options[k].value === currentVal) { exists = true; break; }
    }
    if (exists) sel.value = currentVal;
  }
}

// ===== 進階篩選器 =====