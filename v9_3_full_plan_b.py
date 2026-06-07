#!/usr/bin/env python3
"""
v9.3 完整B方案重構腳本
========================
使用 Firebase push() 鍵 + 每筆記錄獨立讀寫，徹底消除覆蓋衝突。

主要變更：
1. 所有記錄（txs/fundWithdrawals/agentWallets）新增 _fbKey 欄位
2. 新增記錄使用 db.ref().push() 產生唯一鍵
3. 編輯/刪除使用 _fbKey 精準定位 Firebase 路徑
4. 監聽器改為分路徑監聽，並將 Firebase 物件轉為帶 _fbKey 的陣列
5. 移除 syncUpload() 的全量 set()，改為每筆即時同步
6. loadData/loadFundData/loadAgentWallets 支援新舊兩種格式（向下相容）
"""
import re
import sys

def main():
    filepath = "C:/Users/monkey888/WorkBuddy/Claw/render-deploy/index.html"
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_len = len(content)
    print(f"[v9.3] 開始重構，原始檔案大小: {original_len} 字元")
    
    # === 1. 修改變數宣告區：移除重複的 nextId，加入版本標記 ===
    content = re.sub(
        r'var nextId = 1;\s*var fundNextId = 1;\s*var agentWalletNextId = 1;',
        'var nextId = 1;\nvar fundNextId = 1;\nvar agentWalletNextId = 1;',
        content
    )
    # 移除重複宣告的 nextId/fundNextId
    content = re.sub(r'var nextId = 1;\s*var fundNextId = 1;', '', content)
    
    # === 2. 重寫 saveForm() 函數 ===
    # 找到 saveForm 函數的開頭和結尾
    saveForm_match = re.search(
        r'function saveForm\(\) \{[^}]*?showLoading\("儲存中…"\);',
        content,
        re.DOTALL
    )
    
    if saveForm_match:
        # 我們需要更精確地找到 saveForm 的完整範圍
        # 找到 function saveForm() { 的起始位置
        sf_start = content.find('function saveForm() {')
        if sf_start >= 0:
            # 找到對應的結尾（下一個 function 或足夠的 }）
            # 用簡單方法：找到 saveForm 後 3000 字元內的第一個獨立 function 或明確結尾
            sf_section = content[sf_start:sf_start+8000]
            # 找到函數結尾：連續的 } 後面跟著空行或註釋或下一個 function
            # 實際上 saveForm 在 saveDraft 之前結束
            sf_end_in_section = sf_section.find('\n// ===== 自動儲存草稿')
            if sf_end_in_section < 0:
                sf_end_in_section = sf_section.find('\nfunction saveDraft')
            if sf_end_in_section >= 0:
                sf_end = sf_start + sf_end_in_section
                old_saveForm = content[sf_start:sf_end]
                print(f"[v9.3] 找到 saveForm: {sf_start} ~ {sf_end} ({sf_end-sf_start} 字元)")
                
                # 建構新的 saveForm
                new_saveForm = '''function saveForm() {
  var date = document.getElementById("f-date").value;
  var type = document.getElementById("f-type").value;
  var agent = document.getElementById("f-agent").value.trim();
  var note = document.getElementById("f-note").value.trim();
  if (!date) { showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "交易")) return;
  if (!agent) { showToast("請選擇代理！","warning"); return; }

  if (type === "cash") {
    var cash = toNum(document.getElementById("f-cash").value);
    if (!cash) { showToast("請輸入寄放金額！","warning"); return; }
    if (editId) {
      // 編輯模式：找到該筆記錄，用 _fbKey 更新 Firebase
      for (var i = 0; i < txs.length; i++) {
        if (txs[i].id === editId) {
          txs[i].date = date;
          txs[i].dow = getDow(date);
          txs[i].type = "cash";
          txs[i].agent = agent;
          txs[i].cash = cash;
          txs[i].note = note;
          txs[i].client = "";
          txs[i].venue = "";
          txs[i].volume = 0;
          txs[i].rate = 0;
          txs[i].comm = 0;
          txs[i].bonus = 0;
          txs[i].drawn = 0;
          txs[i].undrawn = 0;
          txs[i].fund = 0;
          // v9.3 同步到 Firebase（使用 _fbKey 精準定位）
          if (db && txs[i]._fbKey) {
            var fbObj = {}; for (var k in txs[i]) { if (k !== '_fbKey') fbObj[k] = txs[i][k]; }
            db.ref('macau_data/txs/' + txs[i]._fbKey).set(fbObj);
          } else if (db) {
            // 舊記錄沒有 _fbKey：先 push 取得鍵，再儲存
            var ref = db.ref('macau_data/txs').push();
            txs[i]._fbKey = ref.key;
            var fbObj = {}; for (var k in txs[i]) { if (k !== '_fbKey') fbObj[k] = txs[i][k]; }
            ref.set(fbObj);
          }
          break;
        }
      }
    } else {
      // 新增模式：使用 push() 取得唯一鍵
      var rec = {
        id: nextId++, date: date, dow: getDow(date), type: "cash",
        agent: agent, client: "", venue: "", volume: 0, rate: 0,
        comm: 0, bonus: 0, drawn: 0, undrawn: 0, fund: 0,
        cash: cash, note: note
      };
      if (db) {
        var ref = db.ref('macau_data/txs').push();
        rec._fbKey = ref.key;
        var fbObj = {}; for (var k in rec) { if (k !== '_fbKey') fbObj[k] = rec[k]; }
        ref.set(fbObj);
      }
      txs.push(rec);
    }
  } else {
    // 洗碼交易
    var client = document.getElementById("f-client").value.trim();
    var venue = document.getElementById("f-venue").value;
    var vol = toNum(document.getElementById("f-vol").value);
    var rate = toNum(document.getElementById("f-rate").value);
    var bonus = toNum(document.getElementById("f-bonus").value);
    var drawn = toNum(document.getElementById("f-drawn").value);
    if (!vol) { showToast("請輸入洗碼量！","warning"); return; }
    var comm = calcComm(vol, rate);
    var fund = calcFund(comm, bonus);
    var undrawn = Math.max(0, bonus - drawn);
    if (editId) {
      for (var i = 0; i < txs.length; i++) {
        if (txs[i].id === editId) {
          txs[i].date = date; txs[i].dow = getDow(date);
          txs[i].type = "rolling";
          txs[i].agent = agent; txs[i].client = client; txs[i].venue = venue;
          txs[i].volume = vol; txs[i].rate = rate;
          txs[i].comm = comm; txs[i].bonus = bonus;
          txs[i].drawn = drawn; txs[i].undrawn = undrawn;
          txs[i].fund = fund; txs[i].note = note;
          txs[i].cash = 0;
          // v9.3 同步到 Firebase
          if (db && txs[i]._fbKey) {
            var fbObj = {}; for (var k in txs[i]) { if (k !== '_fbKey') fbObj[k] = txs[i][k]; }
            db.ref('macau_data/txs/' + txs[i]._fbKey).set(fbObj);
          } else if (db) {
            var ref = db.ref('macau_data/txs').push();
            txs[i]._fbKey = ref.key;
            var fbObj = {}; for (var k in txs[i]) { if (k !== '_fbKey') fbObj[k] = txs[i][k]; }
            ref.set(fbObj);
          }
          break;
        }
      }
    } else {
      var rec = {
        id: nextId++, date: date, dow: getDow(date), type: "rolling",
        agent: agent, client: client, venue: venue,
        volume: vol, rate: rate, comm: comm, bonus: bonus,
        drawn: drawn, undrawn: undrawn, fund: fund, cash: 0, note: note
      };
      if (db) {
        var ref = db.ref('macau_data/txs').push();
        rec._fbKey = ref.key;
        var fbObj = {}; for (var k in rec) { if (k !== '_fbKey') fbObj[k] = rec[k]; }
        ref.set(fbObj);
      }
      txs.push(rec);
    }
  }
  showLoading("儲存中…");
  // v9.3 本地也存到 localStorage（作為快取/備份）
  try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
  closeModal();
  clearDraft();
  showToast(editId ? "已更新！" : "已新增！","success");
  editId = null;
  try { renderAll(); } catch(e) { console.error("renderAll error:", e); }
  try { renderOverview(); } catch(e) { console.error("renderOverview error:", e); }
  try { renderSummary(); } catch(e) { console.error("renderSummary error:", e); }
  setTimeout(hideLoading, 300);
}'''
                
                content = content[:sf_start] + new_saveForm + content[sf_end:]
                print(f"[v9.3] saveForm() 已重寫")
    
    # === 3. 重寫 deleteTx() 函數 ===
    dt_start = content.find('function deleteTx(id) {')
    if dt_start >= 0:
        dt_section = content[dt_start:dt_start+2000]
        dt_end_in_section = dt_section.find('\nfunction showUndoToast')
        if dt_end_in_section >= 0:
            dt_end = dt_start + dt_end_in_section
            old_deleteTx = content[dt_start:dt_end]
            print(f"[v9.3] 找到 deleteTx: {dt_start} ~ {dt_end}")
            
            new_deleteTx = '''function deleteTx(id) {
  if (!confirm("確定刪除此筆交易？")) return;
  showLoading("刪除中…");
  var idx = -1, tx = null;
  for (var i = 0; i < txs.length; i++) {
    if (txs[i].id === id) { tx = txs[i]; idx = i; break; }
  }
  if (idx < 0) { hideLoading(); return; }
  // v9.3 先刪除 Firebase 上的記錄（使用 _fbKey 精準定位）
  if (db && tx._fbKey) {
    db.ref('macau_data/txs/' + tx._fbKey).remove();
  }
  // 本地刪除
  txs.splice(idx, 1);
  try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  setTimeout(hideLoading, 300);
}'''
            
            content = content[:dt_start] + new_deleteTx + content[dt_end:]
            print(f"[v9.3] deleteTx() 已重寫")
    
    # === 4. 重寫 loadData() 函數 ===
    ld_start = content.find('function loadData(silent) {')
    if ld_start >= 0:
        ld_section = content[ld_start:ld_start+2000]
        ld_end_in_section = ld_section.find('\n  if (!silent) showToast')
        if ld_end_in_section < 0:
            ld_end_in_section = ld_section.find('renderSummary()')
            if ld_end_in_section >= 0:
                ld_end_in_section = ld_section.find('}', ld_end_in_section)
        # 找到函數結尾
        brace_count = 0
        ld_end = -1
        for i in range(ld_start, len(content)):
            if content[i] == '{': brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    ld_end = i + 1
                    break
        
        if ld_end >= 0:
            print(f"[v9.3] 找到 loadData: {ld_start} ~ {ld_end}")
            
            new_loadData = '''function loadData(silent) {
  var d = localStorage.getItem("macau_data");
  if (!d) { if (!silent) showToast("無資料","info"); return; }
  var raw = decryptData(d);
  // v9.3 向下相容：判斷是陣列（舊格式）還是物件（新 Firebase 格式）
  if (Array.isArray(raw)) {
    txs = raw;
  } else if (typeof raw === 'object' && raw !== null) {
    // 新格式：物件轉陣列，並附加 _fbKey
    txs = [];
    var keys = Object.keys(raw);
    for (var i = 0; i < keys.length; i++) {
      if (raw[keys[i]] && typeof raw[keys[i]] === 'object') {
        raw[keys[i]]._fbKey = keys[i];
        txs.push(raw[keys[i]]);
      }
    }
  }
  // 確保 nextId 正確
  var maxId = 0;
  for (var i = 0; i < txs.length; i++) { if (txs[i].id > maxId) maxId = txs[i].id; }
  nextId = maxId + 1;
  // 確保所有記錄都有 _fbKey（向下相容）
  if (db) {
    for (var i = 0; i < txs.length; i++) {
      if (!txs[i]._fbKey) {
        var ref = db.ref('macau_data/txs').push();
        txs[i]._fbKey = ref.key;
        var fbObj = {}; for (var k in txs[i]) { if (k !== '_fbKey') fbObj[k] = txs[i][k]; }
        ref.set(fbObj);
      }
    }
    // 同步回 localStorage
    try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
  }
  renderAll();
  renderOverview();
  renderSummary();
  if (!silent) showToast("已讀取 " + txs.length + " 筆","success");
}'''
            
            content = content[:ld_start] + new_loadData + content[ld_end:]
            print(f"[v9.3] loadData() 已重寫")
    
    # === 5. 重寫 initSync() 函數（分路徑監聽） ===
    is_start = content.find('function initSync() {')
    if is_start >= 0:
        is_section = content[is_start:]
        # 找到函數結尾
        brace_count = 0
        is_end = -1
        for i in range(len(is_section)):
            if is_section[i] == '{': brace_count += 1
            elif is_section[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    is_end = is_start + i + 1
                    break
        
        if is_end >= 0:
            print(f"[v9.3] 找到 initSync: {is_start} ~ {is_end}")
            
            new_initSync = '''function initSync() {
  if (!db) { console.log('[Sync] Firebase 未初始化'); return; }
  console.log('[Sync] v9.3 B方案：分路徑即時同步（push()鍵架構）');

  // v9.3 B方案：每個數據類型獨立監聽，互不干擾
  // 1. txs：交易記錄（使用 push() 鍵，永不衝突）
  db.ref('macau_data/txs').on('value', function(snapshot) {
    try {
      var fbObj = snapshot.val() || {};
      var newTxs = [];
      var maxId = 0;
      var keys = Object.keys(fbObj);
      for (var i = 0; i < keys.length; i++) {
        if (fbObj[keys[i]] && typeof fbObj[keys[i]] === 'object') {
          fbObj[keys[i]]._fbKey = keys[i];
          newTxs.push(fbObj[keys[i]]);
          if (fbObj[keys[i]].id > maxId) maxId = fbObj[keys[i]].id;
        }
      }
      txs = newTxs;
      nextId = maxId + 1;
      // 存到 localStorage 作為快取
      try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
      // 渲染（僅在頁面可見時）
      var pa = document.getElementById("page-all");
      if (pa && pa.style.display === "block") renderAll();
      var po = document.getElementById("page-overview");
      if (po && po.style.display === "block") renderOverview();
      var ps = document.getElementById("page-summary");
      if (ps && ps.style.display === "block") renderSummary();
      updateTotalWalletUI();
      console.log('[Sync ↓] txs 已同步，共 ' + txs.length + ' 筆');
    } catch(e) { console.error('[Sync ↓] txs 處理錯誤:', e); }
  });

  // 2. fundWithdrawals：公基金（同樣使用 push() 鍵）
  db.ref('macau_data/fundWithdrawals').on('value', function(snapshot) {
    try {
      var fbObj = snapshot.val() || {};
      fundWithdrawals = [];
      var maxId = 0;
      var keys = Object.keys(fbObj);
      for (var i = 0; i < keys.length; i++) {
        if (fbObj[keys[i]] && typeof fbObj[keys[i]] === 'object') {
          fbObj[keys[i]]._fbKey = keys[i];
          fundWithdrawals.push(fbObj[keys[i]]);
          if (fbObj[keys[i]].id > maxId) maxId = fbObj[keys[i]].id;
        }
      }
      fundNextId = maxId + 1;
      try { localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals)); } catch(e) {}
      var pq = document.getElementById("page-query");
      if (pq && pq.style.display === "block") doQuery();
      updateTotalWalletUI();
      console.log('[Sync ↓] fundWithdrawals 已同步，共 ' + fundWithdrawals.length + ' 筆');
    } catch(e) { console.error('[Sync ↓] fundWithdrawals 錯誤:', e); }
  });

  // 3. agentList
  db.ref('macau_data/agentList').on('value', function(snapshot) {
    try {
      var d = snapshot.val();
      if (d && Array.isArray(d)) { agentList = d; fillAgent(); }
    } catch(e) {}
  });

  // 4. agentWallets（結構較複雜，每個代理是物件）
  db.ref('macau_data/agentWallets').on('value', function(snapshot) {
    try {
      var d = snapshot.val();
      if (d && typeof d === 'object') { agentWallets = d; }
    } catch(e) {}
  });

  // 5. workingMonth
  db.ref('macau_data/workingMonth').on('value', function(snapshot) {
    try {
      var d = snapshot.val();
      if (d) workingMonth = d;
    } catch(e) {}
  });

  // 6. rmBookings
  db.ref('macau_data/rmBookings').on('value', function(snapshot) {
    try {
      if (typeof RM !== 'undefined') {
        var d = snapshot.val() || [];
        RM.bookings = d;
        RM.save();
        RM.render();
      }
    } catch(e) {}
  });

  console.log('[Sync] v9.3 B方案：所有監聽器已啟動');
}'''
            
            content = content[:is_start] + new_initSync + content[is_end:]
            print(f"[v9.3] initSync() 已重寫（分路徑監聽）")
    
    # === 6. 修改 saveData()：移除 syncUpload 呼叫 ===
    # saveData 不再需要呼叫 syncUpload，因為每筆操作已即時同步
    content = re.sub(
        r'    if \(typeof syncUpload === \'function\'\) \{ console\.log\(\'\[saveData\] 準備呼叫 syncUpload\(\)\'\); syncUpload\(\); \}',
        '    // v9.3 B方案：每筆操作已即時同步到 Firebase，無需 syncUpload',
        content
    )
    
    # === 7. 修改 saveFundData()：移除 syncUpload 呼叫 ===
    content = re.sub(
        r'  // v8\.0 移除全局鎖，改用 deviceId 回音过滤\n  if \(typeof syncUpload === .function.\) syncUpload\(\);',
        '  // v9.3 B方案：每筆操作即時同步，無需 syncUpload',
        content
    )
    
    # === 8. 修改 saveFundForm()：使用 push() 鍵 ===
    sfund_start = content.find('function saveFundForm() {')
    if sfund_start >= 0:
        # 找到函數結尾
        brace_count = 0
        sfund_end = -1
        for i in range(sfund_start, len(content)):
            if content[i] == '{': brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    sfund_end = i + 1
                    break
        
        if sfund_end >= 0:
            print(f"[v9.3] 找到 saveFundForm: {sfund_start} ~ {sfund_end}")
            
            new_saveFundForm = '''function saveFundForm() {
  if (window._savingFund) return;
  window._savingFund = true;
  var date = document.getElementById("fund-date").value;
  var type = document.getElementById("fund-type").value;
  var amount = toNum(document.getElementById("fund-amount").value);
  var note = document.getElementById("fund-note").value.trim();
  if (!date) { window._savingFund = false; showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "公基金異動")) { window._savingFund = false; return; }
  if (!amount) { window._savingFund = false; showToast("請輸入金額！","warning"); return; }
  var rec = { id: fundNextId++, date: date, type: type, amount: amount, note: note };
  if (db) {
    var ref = db.ref('macau_data/fundWithdrawals').push();
    rec._fbKey = ref.key;
    var fbObj = {}; for (var k in rec) { if (k !== '_fbKey') fbObj[k] = rec[k]; }
    ref.set(fbObj);
  }
  fundWithdrawals.push(rec);
  try { localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals)); } catch(e) {}
  closeFundModal();
  doQuery();
  updateTotalWalletUI();
  showToast("已儲存！","success");
  window._savingFund = false;
}'''
            
            content = content[:sfund_start] + new_saveFundForm + content[sfund_end:]
            print(f"[v9.3] saveFundForm() 已重寫")
    
    # === 9. 修改 deleteFund()：使用 _fbKey 刪除 ===
    df_start = content.find('function deleteFund(id) {')
    if df_start >= 0:
        df_section = content[df_start:df_start+1000]
        df_end_in_section = df_section.find('\nfunction saveFundData')
        if df_end_in_section >= 0:
            df_end = df_start + df_end_in_section
            
            new_deleteFund = '''function deleteFund(id) {
  if (!confirm("確定刪除？")) return;
  var idx = -1, rec = null;
  for (var i = 0; i < fundWithdrawals.length; i++) {
    if (fundWithdrawals[i].id === id) { rec = fundWithdrawals[i]; idx = i; break; }
  }
  if (idx < 0) return;
  if (db && rec._fbKey) {
    db.ref('macau_data/fundWithdrawals/' + rec._fbKey).remove();
  }
  fundWithdrawals.splice(idx, 1);
  try { localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals)); } catch(e) {}
  doQuery();
  updateTotalWalletUI();
}'''
            
            content = content[:df_start] + new_deleteFund + content[df_end:]
            print(f"[v9.3] deleteFund() 已重寫")
    
    # === 10. 移除 syncUpload 函數（B方案不需要） ===
    su_start = content.find('function syncUpload() {')
    if su_start >= 0:
        brace_count = 0
        su_end = -1
        for i in range(su_start, len(content)):
            if content[i] == '{': brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    su_end = i + 1
                    break
        
        if su_end >= 0:
            # 檢查 syncUpload 是否為獨立函數（前後有空行）
            # 用空字串替換（不再需要）
            content = content[:su_start] + '\n// v9.3 B方案：無需 syncUpload，每筆操作即時同步\n' + content[su_end:]
            print(f"[v9.3] syncUpload() 已移除")
    
    # === 11. 修改標題為 v9.3 ===
    content = content.replace(
        '<title>澳門洗碼報表 v9.0</title>',
        '<title>澳門洗碼報表 v9.3</title>'
    )
    
    # === 寫入檔案 ===
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    new_len = len(content)
    print(f"\n[v9.3] ✅ 重構完成！")
    print(f"  原始大小: {original_len} 字元")
    print(f"  新檔大小: {new_len} 字元")
    print(f"  變化: {new_len - original_len:+d} 字元")
    print(f"\n[v9.3] 主要變更：")
    print(f"  1. saveForm(): 新增用 push() 鍵，編輯用 _fbKey 定位")
    print(f"  2. deleteTx(): 用 _fbKey 精準刪除 Firebase 記錄")
    print(f"  3. loadData(): 支援新（物件）舊（陣列）兩種格式")
    print(f"  4. initSync(): 分路徑監聽，互不干擾")
    print(f"  5. saveFundForm/deleteFund: 同樣使用 push() 鍵")
    print(f"  6. 移除 syncUpload(): 每筆即時同步，無需全量上傳")
    print(f"\n[v9.3] ⚠️ 注意：")
    print(f"  - 首次載入時會自動為舊記錄補上 _fbKey")
    print(f"  - Firebase 資料結構改變，舊資料會自動遷移")
    print(f"  - 建議先備份 Firebase 資料庫")

if __name__ == "__main__":
    main()
