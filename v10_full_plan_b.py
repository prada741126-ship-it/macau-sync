#!/usr/bin/env python3
"""
v10.0 完整B方案：Firebase push() 鍵重構所有 CRUD 函數

架構：
- 每筆記錄獲取 Firebase push() 鍵作為 _fbKey
- Firebase 儲存為物件（key = _fbKey），不再使用陣列
- 本地 _txs 陣列保持不變（向後兼容），每筆附加 _fbKey
- CRUD 函數直接寫入 Firebase 個別路徑，永不覆蓋
- initSync 監聽器將 Firebase 物件轉換為陣列

⚠️ 極小心的字串匹配替換，不可出錯
"""

import re

FILE = r"C:\Users\monkey888\WorkBuddy\Claw\render-deploy\index.html"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

original = content
changes_made = 0

def replace(old, new):
    global content, changes_made
    if old not in content:
        print(f"❌ 未找到目標字串！前80字元: {old[:80]!r}")
        raise SystemExit(1)
    # 檢查唯一性
    count = content.count(old)
    if count > 1:
        print(f"⚠️ 目標字串出現 {count} 次，將全部替換: {old[:80]!r}")
    content = content.replace(old, new)
    changes_made += 1
    print(f"✅ 第 {changes_made} 次替換成功")

def replace_once(old, new):
    """確保只替換一次"""
    global content, changes_made
    count = content.count(old)
    if count == 0:
        print(f"❌ 未找到目標字串！前80字元: {old[:80]!r}")
        raise SystemExit(1)
    if count > 1:
        print(f"❌ 目標字串出現 {count} 次（預期1次）！前80字元: {old[:80]!r}")
        raise SystemExit(1)
    content = content.replace(old, new)
    changes_made += 1
    print(f"✅ 第 {changes_made} 次替換成功（唯一替換）")


# ============================================================
# Stage 0: 標題更新
# ============================================================
print("\n=== Stage 0: 標題更新 ===")
replace("<title>澳門洗碼報表 v9.3</title>", "<title>澳門洗碼報表 v10.0</title>")

# ============================================================
# Stage 1: 變數宣告 + 輔助函數
# ============================================================
print("\n=== Stage 1: 變數宣告與輔助函數 ===")

# 在 var txs = []; 區塊後面插入 B 方案核心變數
old_var_block = """var txs = [];
var fundWithdrawals = [];
var agentWallets = {};
var editId = null;
var nextId = 1;
var fundNextId = 1;
var agentWalletNextId = 1;
var agentList = [];
var nextId = 1;
var fundNextId = 1;"""

new_var_block = """var txs = [];
var fundWithdrawals = [];
var agentWallets = {};
var editId = null;          // v10.0 B方案：editId 現在儲存 _fbKey（字串）而非數字 id
var nextId = 1;
var fundNextId = 1;
var agentWalletNextId = 1;
var agentList = [];
var nextId = 1;
var fundNextId = 1;
// v10.0 B方案：Firebase push() 鍵架構
var _migrated = false;      // 是否已完成 Firebase 物件格式遷移
function _fbKey() {
  if (db && db.ref) { try { return db.ref('macau_data/x').push().key; } catch(e) {} }
  return 'L' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}"""

replace(old_var_block, new_var_block)

# ============================================================
# Stage 2: deleteTx() — 使用 _fbKey 精準刪除
# ============================================================
print("\n=== Stage 2: deleteTx() ===")

old_deleteTx = """function deleteTx(id) {
  if (!confirm("確定刪除此筆交易？")) return;
  showLoading("刪除中…");
  // 保存副本供撤銷
  for (var i = 0; i < txs.length; i++) {
    if (txs[i].id === id) { lastDeleted = txs[i]; break; }
  }
  var newTxs = [];
  for (var i = 0; i < txs.length; i++) {
    if (txs[i].id !== id) newTxs.push(txs[i]);
  }
  txs = newTxs;
  saveData(true);
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  if (lastDeleted) showUndoToast();
  setTimeout(hideLoading, 300);
}"""

new_deleteTx = """// v10.0 B方案：使用 _fbKey 精準刪除
function deleteTx(fbKey) {
  if (!confirm("確定刪除此筆交易？")) return;
  showLoading("刪除中…");
  // 保存副本供撤銷
  for (var i = 0; i < txs.length; i++) {
    if (txs[i]._fbKey === fbKey) { lastDeleted = txs[i]; lastDeleted.fbKey = fbKey; break; }
  }
  // v10.0 直接從 Firebase 刪除該筆記錄（不重寫整個陣列）
  if (db && fbKey) db.ref('macau_data/txs/' + fbKey).set(null);
  // 本地移除
  var newTxs = [];
  for (var i = 0; i < txs.length; i++) {
    if (txs[i]._fbKey !== fbKey) newTxs.push(txs[i]);
  }
  txs = newTxs;
  saveData(true);
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  if (lastDeleted) showUndoToast();
  setTimeout(hideLoading, 300);
}"""

replace(old_deleteTx, new_deleteTx)

# ============================================================
# Stage 3: undoDelete() — 使用 _fbKey
# ============================================================
print("\n=== Stage 3: undoDelete() ===")

old_undo = """function undoDelete() {
  if (!lastDeleted) return;
  txs.push(lastDeleted);
  saveData(true);
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  showToast("已恢復交易！","success");
  lastDeleted = null;
}"""

new_undo = """// v10.0 B方案：撤銷時寫入 Firebase
function undoDelete() {
  if (!lastDeleted) return;
  txs.push(lastDeleted);
  // 寫入 Firebase
  if (db && lastDeleted.fbKey) db.ref('macau_data/txs/' + lastDeleted.fbKey).set(lastDeleted);
  saveData(true);
  renderAll();
  renderOverview();
  renderSummary();
  updateTotalWalletUI();
  showToast("已恢復交易！","success");
  lastDeleted = null;
}"""

replace(old_undo, new_undo)

# ============================================================
# Stage 4: openModal() — 接受 _fbKey 字串
# ============================================================
print("\n=== Stage 4: openModal() ===")

old_openModal = """function openModal(id) {
  // 編輯模式：傳入 id
  if (id) {
    var tx = null;
    for (var i = 0; i < txs.length; i++) {
      if (txs[i].id === id) { tx = txs[i]; break; }
    }
    if (!tx) { showToast("找不到該筆交易！", "warning"); return; }
    editId = id;
    document.getElementById("modal-title").textContent = "編輯交易";"""

new_openModal = """// v10.0 B方案：openModal 接受 _fbKey（字串）或數字 id（向後兼容）
function openModal(id) {
  // 編輯模式：傳入 id（_fbKey 或數字 id）
  if (id) {
    var tx = null;
    // 先按 _fbKey 查找
    for (var i = 0; i < txs.length; i++) {
      if (txs[i]._fbKey === id) { tx = txs[i]; editId = id; break; }
    }
    // 向後兼容：按數字 id 查找
    if (!tx) {
      var nid = parseInt(id);
      if (!isNaN(nid)) {
        for (var i = 0; i < txs.length; i++) {
          if (txs[i].id === nid) { tx = txs[i]; editId = txs[i]._fbKey; break; }
        }
      }
    }
    if (!tx) { showToast("找不到該筆交易！", "warning"); return; }
    document.getElementById("modal-title").textContent = "編輯交易";"""

replace(old_openModal, new_openModal)

# ============================================================
# Stage 5: saveForm() — 使用 _fbKey 直接寫入 Firebase
# ============================================================
print("\n=== Stage 5: saveForm() ===")

old_saveForm = """function saveForm() {
  var date = document.getElementById("f-date").value;
  var type = document.getElementById("f-type").value;
  var agent = document.getElementById("f-agent").value.trim();
  var note = document.getElementById("f-note").value.trim();
  if (!date) { showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "交易")) return;
  if (!agent) { showToast("請選擇代理！","warning"); return; }

  if (type === "cash") {
    // 現金寄放：只需日期、代理、寄放金額、備註
    var cash = toNum(document.getElementById("f-cash").value);
    if (!cash) { showToast("請輸入寄放金額！","warning"); return; }
    if (editId) {
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
          break;
        }
      }
    } else {
      txs.push({
        id: nextId++, date: date, dow: getDow(date), type: "cash",
        agent: agent, client: "", venue: "", volume: 0, rate: 0,
        comm: 0, bonus: 0, drawn: 0, undrawn: 0, fund: 0,
        cash: cash, note: note
      });
    }
  } else {
    // 洗碼交易：原有邏輯
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
          break;
        }
      }
    } else {
      txs.push({
        id: nextId++, date: date, dow: getDow(date), type: "rolling",
        agent: agent, client: client, venue: venue,
        volume: vol, rate: rate, comm: comm, bonus: bonus,
        drawn: drawn, undrawn: undrawn, fund: fund, cash: 0, note: note
      });
    }
  }
  showLoading("儲存中…");
  saveData(true);
  closeModal();  // 先關閉彈窗，確保一定執行
  clearDraft();  // 清除草稿（儲存成功後不再需要）
  showToast(editId ? "已更新！" : "已新增！","success");
  editId = null;
  // 後台重新渲染（即使報錯也不影響彈窗關閉）
  try { renderAll(); } catch(e) { console.error("renderAll error:", e); }
  try { renderOverview(); } catch(e) { console.error("renderOverview error:", e); }
  try { renderSummary(); } catch(e) { console.error("renderSummary error:", e); }
  setTimeout(hideLoading, 300);
}"""

new_saveForm = """// v10.0 B方案：使用 _fbKey 直接寫入 Firebase 個別路徑
function saveForm() {
  var date = document.getElementById("f-date").value;
  var type = document.getElementById("f-type").value;
  var agent = document.getElementById("f-agent").value.trim();
  var note = document.getElementById("f-note").value.trim();
  if (!date) { showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "交易")) return;
  if (!agent) { showToast("請選擇代理！","warning"); return; }
  var isEdit = !!editId;
  var fbKey = isEdit ? editId : _fbKey();

  if (type === "cash") {
    // 現金寄放：只需日期、代理、寄放金額、備註
    var cash = toNum(document.getElementById("f-cash").value);
    if (!cash) { showToast("請輸入寄放金額！","warning"); return; }
    var cashObj = {
      _fbKey: fbKey, id: isEdit ? (function(){for(var i=0;i<txs.length;i++)if(txs[i]._fbKey===fbKey)return txs[i].id; return nextId;})() : nextId++,
      date: date, dow: getDow(date), type: "cash",
      agent: agent, client: "", venue: "", volume: 0, rate: 0,
      comm: 0, bonus: 0, drawn: 0, undrawn: 0, fund: 0,
      cash: cash, note: note
    };
    if (isEdit) {
      for (var i = 0; i < txs.length; i++) {
        if (txs[i]._fbKey === editId) { txs[i] = cashObj; break; }
      }
    } else {
      txs.push(cashObj);
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
    var rollingObj = {
      _fbKey: fbKey, id: isEdit ? (function(){for(var i=0;i<txs.length;i++)if(txs[i]._fbKey===fbKey)return txs[i].id; return nextId;})() : nextId++,
      date: date, dow: getDow(date), type: "rolling",
      agent: agent, client: client, venue: venue,
      volume: vol, rate: rate, comm: comm, bonus: bonus,
      drawn: drawn, undrawn: undrawn, fund: fund, cash: 0, note: note
    };
    if (isEdit) {
      for (var i = 0; i < txs.length; i++) {
        if (txs[i]._fbKey === editId) { txs[i] = rollingObj; break; }
      }
    } else {
      txs.push(rollingObj);
    }
  }
  showLoading("儲存中…");
  // v10.0 B方案：直接寫入 Firebase 個別路徑（永不覆蓋其他記錄）
  if (db && fbKey) {
    var targetObj = null;
    for (var i = 0; i < txs.length; i++) { if (txs[i]._fbKey === fbKey) { targetObj = txs[i]; break; } }
    if (targetObj) db.ref('macau_data/txs/' + fbKey).set(targetObj);
  }
  saveData(true);
  closeModal();
  clearDraft();
  showToast(isEdit ? "已更新！" : "已新增！","success");
  editId = null;
  try { renderAll(); } catch(e) { console.error("renderAll error:", e); }
  try { renderOverview(); } catch(e) { console.error("renderOverview error:", e); }
  try { renderSummary(); } catch(e) { console.error("renderSummary error:", e); }
  setTimeout(hideLoading, 300);
}"""

replace(old_saveForm, new_saveForm)

# ============================================================
# Stage 6: renderAll() — 使用 _fbKey 在編輯/刪除按鈕
# ============================================================
print("\n=== Stage 6: renderAll() — 編輯/刪除按鈕 ===")

# 使用從檔案中精確讀取的字串進行替換
old_render_btns = '"<td><button class=\'btn-gold\' onclick=\'openModal(" + t.id + ")\'>編輯</button> <button class=\'btn-red\' data-del=\'" + t.id + "\'>刪除</button></td>";'
new_render_btns = '"<td><button class=\'btn-gold\' onclick=\'openModal(" + t.id + ")\' data-fbkey=\'" + t._fbKey + "\'>編輯</button> <button class=\'btn-red\' data-del=\'" + (t._fbKey || t.id) + "\'>刪除</button></td>";'
replace(old_render_btns, new_render_btns)

# ============================================================
# Stage 7: Event listener for delete — 使用 _fbKey
# ============================================================
print("\n=== Stage 7: 刪除事件監聽器 ===")

old_delete_event = """document.addEventListener("click", function(e) {
  var btn = e.target.closest("[data-del]");
  if (!btn) return;
  e.preventDefault();
  var id = parseInt(btn.getAttribute("data-del"));
  console.log('[Delete] 點擊刪除按鈕，ID:', id);
  deleteTx(id);
});"""

new_delete_event = """// v10.0 B方案：刪除事件監聽器，使用 _fbKey
document.addEventListener("click", function(e) {
  var btn = e.target.closest("[data-del]");
  if (!btn) return;
  e.preventDefault();
  var fbKey = btn.getAttribute("data-del");
  console.log('[Delete] 點擊刪除按鈕，fbKey:', fbKey);
  deleteTx(fbKey);
});"""

replace(old_delete_event, new_delete_event)

# ============================================================
# Stage 8: saveFundForm() — 使用 _fbKey
# ============================================================
print("\n=== Stage 8: saveFundForm() ===")

old_saveFund = """function saveFundForm() {
  // v7.7.5 防重複提交
  if (window._savingFund) return;
  window._savingFund = true;
  var date = document.getElementById("fund-date").value;
  var type = document.getElementById("fund-type").value;
  var amount = toNum(document.getElementById("fund-amount").value);
  var note = document.getElementById("fund-note").value.trim();
  if (!date) { window._savingFund = false; showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "公基金異動")) { window._savingFund = false; return; }
  if (!amount) { window._savingFund = false; showToast("請輸入金額！","warning"); return; }
  fundWithdrawals.push({ id: fundNextId++, date: date, type: type, amount: amount, note: note });
  saveFundData(true);
  closeFundModal();
  doQuery();
  updateTotalWalletUI();
  showToast("已儲存！","success");
  window._savingFund = false;
}"""

new_saveFund = """// v10.0 B方案：公基金使用 _fbKey
function saveFundForm() {
  if (window._savingFund) return;
  window._savingFund = true;
  var date = document.getElementById("fund-date").value;
  var type = document.getElementById("fund-type").value;
  var amount = toNum(document.getElementById("fund-amount").value);
  var note = document.getElementById("fund-note").value.trim();
  if (!date) { window._savingFund = false; showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "公基金異動")) { window._savingFund = false; return; }
  if (!amount) { window._savingFund = false; showToast("請輸入金額！","warning"); return; }
  var fbKey = _fbKey();
  var rec = { _fbKey: fbKey, id: fundNextId++, date: date, type: type, amount: amount, note: note };
  fundWithdrawals.push(rec);
  // v10.0 直接寫入 Firebase
  if (db && fbKey) db.ref('macau_data/fundWithdrawals/' + fbKey).set(rec);
  saveFundData(true);
  closeFundModal();
  doQuery();
  updateTotalWalletUI();
  showToast("已儲存！","success");
  window._savingFund = false;
}"""

replace(old_saveFund, new_saveFund)

# ============================================================
# Stage 9: deleteFund() — 使用 _fbKey
# ============================================================
print("\n=== Stage 9: deleteFund() ===")

old_deleteFund = """function deleteFund(id) {
  if (!confirm("確定刪除？")) return;
  var newArr = [];
  for (var i = 0; i < fundWithdrawals.length; i++) { if (fundWithdrawals[i].id !== id) newArr.push(fundWithdrawals[i]); }
  fundWithdrawals = newArr;
  saveFundData(true);
  doQuery();
  updateTotalWalletUI();
}"""

new_deleteFund = """// v10.0 B方案：使用 _fbKey 刪除公基金
function deleteFund(id) {
  if (!confirm("確定刪除？")) return;
  var fbKey = null;
  var newArr = [];
  for (var i = 0; i < fundWithdrawals.length; i++) {
    if (fundWithdrawals[i].id === id) { fbKey = fundWithdrawals[i]._fbKey; }
    else { newArr.push(fundWithdrawals[i]); }
  }
  fundWithdrawals = newArr;
  if (db && fbKey) db.ref('macau_data/fundWithdrawals/' + fbKey).set(null);
  saveFundData(true);
  doQuery();
  updateTotalWalletUI();
}"""

replace(old_deleteFund, new_deleteFund)

# ============================================================
# Stage 10: saveAgentWalletForm() — 使用 _fbKey
# ============================================================
print("\n=== Stage 10: saveAgentWalletForm() ===")

old_saveAW = """function saveAgentWalletForm() {
  var date = document.getElementById("aw-date").value;
  var type = document.getElementById("aw-type").value;
  var amount = toNum(document.getElementById("aw-amount").value);
  var note = document.getElementById("aw-note").value.trim();
  var agent = document.getElementById("agent-wallet-modal").getAttribute("data-agent");
  if (!date) { showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "代理錢包異動")) return;
  if (!amount) { showToast("請輸入金額！","warning"); return; }
  try {
    if (!agentWallets[agent]) agentWallets[agent] = [];
    agentWallets[agent].push({ id: agentWalletNextId++, date: date, type: type, amount: amount, note: note });
    saveAgentWallets(true);
    syncAgentDrawn(agent);
    closeAgentWalletModal();
    try { doQuery(); } catch(e2) { console.error("[saveAgentWalletForm] doQuery error:", e2); }
    showToast("已儲存！","success");
  } catch(e) {
    console.error("[saveAgentWalletForm] error:", e);
    showToast("儲存失敗：" + (e.message||e), "error");
    try { closeAgentWalletModal(); } catch(e2) {}
  }
}"""

new_saveAW = """// v10.0 B方案：代理錢包使用 _fbKey
function saveAgentWalletForm() {
  var date = document.getElementById("aw-date").value;
  var type = document.getElementById("aw-type").value;
  var amount = toNum(document.getElementById("aw-amount").value);
  var note = document.getElementById("aw-note").value.trim();
  var agent = document.getElementById("agent-wallet-modal").getAttribute("data-agent");
  if (!date) { showToast("請選擇日期！","warning"); return; }
  if (!validateMonthDate(date, "代理錢包異動")) return;
  if (!amount) { showToast("請輸入金額！","warning"); return; }
  try {
    if (!agentWallets[agent]) agentWallets[agent] = [];
    var fbKey = _fbKey();
    var rec = { _fbKey: fbKey, id: agentWalletNextId++, date: date, type: type, amount: amount, note: note };
    agentWallets[agent].push(rec);
    // v10.0 直接寫入 Firebase
    if (db && fbKey) db.ref('macau_data/agentWallets/' + agent + '/' + fbKey).set(rec);
    saveAgentWallets(true);
    syncAgentDrawn(agent);
    closeAgentWalletModal();
    try { doQuery(); } catch(e2) { console.error("[saveAgentWalletForm] doQuery error:", e2); }
    showToast("已儲存！","success");
  } catch(e) {
    console.error("[saveAgentWalletForm] error:", e);
    showToast("儲存失敗：" + (e.message||e), "error");
    try { closeAgentWalletModal(); } catch(e2) {}
  }
}"""

replace(old_saveAW, new_saveAW)

# ============================================================
# Stage 11: deleteAgentWallet() — 使用 _fbKey
# ============================================================
print("\n=== Stage 11: deleteAgentWallet() ===")

old_deleteAW = """function deleteAgentWallet(agent, id) {
  if (!confirm("確定刪除？")) return;
  var arr = agentWallets[agent] || [];
  var newArr = [];
  for (var i = 0; i < arr.length; i++) { if (arr[i].id !== id) newArr.push(arr[i]); }
  agentWallets[agent] = newArr;
  saveAgentWallets(true);
  syncAgentDrawn(agent);
  doQuery();
}"""

new_deleteAW = """// v10.0 B方案：使用 _fbKey 刪除代理錢包
function deleteAgentWallet(agent, id) {
  if (!confirm("確定刪除？")) return;
  var arr = agentWallets[agent] || [];
  var fbKey = null;
  var newArr = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].id === id) { fbKey = arr[i]._fbKey; }
    else { newArr.push(arr[i]); }
  }
  agentWallets[agent] = newArr;
  if (db && fbKey) db.ref('macau_data/agentWallets/' + agent + '/' + fbKey).set(null);
  saveAgentWallets(true);
  syncAgentDrawn(agent);
  doQuery();
}"""

replace(old_deleteAW, new_deleteAW)

# ============================================================
# Stage 12: syncUpload() — 完全重寫為分路徑個別寫入
# ============================================================
print("\n=== Stage 12: syncUpload() 完全重寫 ===")

old_syncUpload_block = """// ===== v9.3 B方案：transaction() 安全合併 =====

// 輔助函數：依 id 合併兩個陣列（本地優先，保留伺服器獨有記錄）
function _mergeById(arrA, arrB) {
  var map = {};
  // 先放入 arrA（伺服器資料）
  for (var i = 0; i < arrA.length; i++) {
    if (arrA[i] && arrA[i].id) map[String(arrA[i].id)] = arrA[i];
  }
  // 再用 arrB（本地資料）覆蓋，本地優先
  for (var i = 0; i < arrB.length; i++) {
    if (arrB[i] && arrB[i].id) map[String(arrB[i].id)] = arrB[i];
  }
  // 轉回陣列
  var result = [];
  var keys = Object.keys(map);
  for (var i = 0; i < keys.length; i++) result.push(map[keys[i]]);
  return result;
}

// 輔助函數：依 id 找陣列索引
function _findById(arr, id) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] && arr[i].id === id) return i;
  }
  return -1;
}

function syncUpload() {
  if (!db) { console.log('[Sync ↑] Firebase 未初始化'); return; }
  console.log('[Sync ↑] 開始 transaction 上傳...');

  // v9.3 B方案：對每個數據類型分別使用 transaction()，避免全量覆蓋衝突
  // 1. txs — 交易記錄
  db.ref('macau_data/txs').transaction(function(current) {
    if (current === null) return txs;
    if (!Array.isArray(current)) return txs;
    return _mergeById(current, txs);
  }, function(error, committed) {
    if (error) console.error('[Sync ↑] txs transaction 失敗', error);
    else if (committed) console.log('[Sync ↑] txs 同步成功');
  });

  // 2. fundWithdrawals — 公基金
  db.ref('macau_data/fundWithdrawals').transaction(function(current) {
    if (current === null) return fundWithdrawals;
    if (!Array.isArray(current)) return fundWithdrawals;
    return _mergeById(current, fundWithdrawals);
  }, function(error, committed) {
    if (error) console.error('[Sync ↑] fundWithdrawals transaction 失敗', error);
    else if (committed) console.log('[Sync ↑] fundWithdrawals 同步成功');
  });

  // 3. agentList
  db.ref('macau_data/agentList').transaction(function(current) {
    if (current === null) return agentList;
    if (!Array.isArray(current)) return agentList;
    // 合併兩個陣列（去除重複）
    var s = {}; for (var i = 0; i < current.length; i++) s[current[i]] = true;
    for (var i = 0; i < agentList.length; i++) s[agentList[i]] = true;
    return Object.keys(s);
  }, function(error, committed) {
    if (error) console.error('[Sync ↑] agentList transaction 失敗', error);
  });

  // 4. agentWallets
  db.ref('macau_data/agentWallets').transaction(function(current) {
    if (current === null) return agentWallets;
    if (typeof current !== 'object') return agentWallets;
    // 合併：本地優先，保留伺服器獨有代理
    var merged = {};
    var agents = Object.keys(current);
    for (var i = 0; i < agents.length; i++) merged[agents[i]] = current[agents[i]];
    agents = Object.keys(agentWallets);
    for (var i = 0; i < agents.length; i++) merged[agents[i]] = agentWallets[agents[i]];
    return merged;
  }, function(error, committed) {
    if (error) console.error('[Sync ↑] agentWallets transaction 失敗', error);
  });

  // 5. workingMonth
  if (workingMonth) {
    db.ref('macau_data/workingMonth').set(workingMonth);
  }

  // 6. rmBookings
  if (typeof RM !== 'undefined' && RM.bookings) {
    db.ref('macau_data/rmBookings').transaction(function(current) {
      if (current === null) return RM.bookings;
      if (!Array.isArray(current)) return RM.bookings;
      return _mergeById(current, RM.bookings);
    }, function(error, committed) {
      if (error) console.error('[Sync ↑] rmBookings transaction 失敗', error);
    });
  }

  // 7. archives（使用 set，衝突風險低）
  try {
    var archives = localStorage.getItem('macau_archives');
    if (archives) db.ref('macau_data/archives').set(JSON.parse(archives));
  } catch(e) {}

  console.log('[Sync ↑] transaction 已送出');
}"""

new_syncUpload_block = """// ===== v10.0 B方案：Firebase push() 鍵架構，個別路徑寫入 =====

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
    if (!arr.length) continue;
    result[agent] = {};
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
    if (Array.isArray(fb)) fb = _arrToObj(fb); // v10.0 遷移：舊格式陣列 → 物件
    var local = _arrToObj(txs);
    // 合併：本地記錄覆蓋伺服器同名 key，伺服器獨有記錄保留
    var keys = Object.keys(local);
    for (var i = 0; i < keys.length; i++) { fb[keys[i]] = local[keys[i]]; }
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
    var keys = Object.keys(local);
    for (var i = 0; i < keys.length; i++) { fb[keys[i]] = local[keys[i]]; }
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
  db.ref('macau_data/agentWallets').transaction(function(current) {
    var fb = current || {};
    var local = _awArrToObj(agentWallets);
    var agents = Object.keys(local);
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      if (!fb[a]) fb[a] = {};
      var keys = Object.keys(local[a]);
      for (var j = 0; j < keys.length; j++) { fb[a][keys[j]] = local[a][keys[j]]; }
    }
    return fb;
  });

  // 5. workingMonth
  if (workingMonth) db.ref('macau_data/workingMonth').set(workingMonth);

  // 6. rmBookings
  if (typeof RM !== 'undefined' && RM.bookings && RM.bookings.length) {
    db.ref('macau_data/rmBookings').transaction(function(current) {
      var fb = current || {};
      if (Array.isArray(fb)) fb = _arrToObj(fb);
      var local = _arrToObj(RM.bookings);
      var keys = Object.keys(local);
      for (var i = 0; i < keys.length; i++) { fb[keys[i]] = local[keys[i]]; }
      return fb;
    });
  }

  // 7. archives
  try { var a = localStorage.getItem('macau_archives'); if (a) db.ref('macau_data/archives').set(JSON.parse(a)); } catch(e) {}

  console.log('[Sync ↑] 已送出');
}"""

replace(old_syncUpload_block, new_syncUpload_block)

# ============================================================
# Stage 13: initSync() — 新格式監聽（物件 → 陣列轉換）
# ============================================================
print("\n=== Stage 13: initSync() — 完全重寫 ===")

old_initSync = """// v9.3 B方案：分路徑即時同步（transaction 安全架構）

function initSync() {
  if (!db) { console.log('[Sync] Firebase 未初始化'); return; }
  console.log('[Sync] v9.3 B方案：分路徑即時同步已啟動');

  // v9.3 B方案：每個數據類型獨立監聽，互不干擾，永不衝突

  // 1. txs：交易記錄
  db.ref('macau_data/txs').on('value', function(snapshot) {
    try {
      var d = snapshot.val() || [];
      if (!Array.isArray(d)) { console.error('[Sync ↓] txs 格式錯誤，預期陣列'); return; }
      txs = d;
      var maxId = 0;
      for (var i = 0; i < txs.length; i++) { if (txs[i] && txs[i].id > maxId) maxId = txs[i].id; }
      nextId = maxId + 1;
      // 存到 localStorage 作為快取
      try { localStorage.setItem("macau_data", encryptData(txs)); } catch(e) {}
      // 僅在對應頁面可見時才渲染
      var pa = document.getElementById("page-all");
      if (pa && pa.style.display === "block") renderAll();
      var po = document.getElementById("page-overview");
      if (po && po.style.display === "block") renderOverview();
      var ps = document.getElementById("page-summary");
      if (ps && ps.style.display === "block") renderSummary();
      try { updateTotalWalletUI(); } catch(e) {}
      console.log('[Sync ↓] txs 已同步，共 ' + txs.length + ' 筆');
    } catch(e) { console.error('[Sync ↓] txs 處理錯誤:', e); }
  });

  // 2. fundWithdrawals：公基金
  db.ref('macau_data/fundWithdrawals').on('value', function(snapshot) {
    try {
      var d = snapshot.val() || [];
      if (!Array.isArray(d)) { console.error('[Sync ↓] fundWithdrawals 格式錯誤'); return; }
      fundWithdrawals = d;
      var maxId = 0;
      for (var i = 0; i < fundWithdrawals.length; i++) { if (fundWithdrawals[i] && fundWithdrawals[i].id > maxId) maxId = fundWithdrawals[i].id; }
      fundNextId = maxId + 1;
      try { localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals)); } catch(e) {}
      var pq = document.getElementById("page-query");
      if (pq && pq.style.display === "block") try { doQuery(); } catch(e) {}
      try { updateTotalWalletUI(); } catch(e) {}
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

  // 4. agentWallets
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
        RM.bookings = snapshot.val() || [];
        RM.save();
        RM.render();
      }
    } catch(e) {}
  });

  // 7. archives（僅下載，不上傳）
  db.ref('macau_data/archives').on('value', function(snapshot) {
    try {
      var d = snapshot.val();
      if (d) localStorage.setItem('macau_archives', JSON.stringify(d));
    } catch(e) {}
  });

  console.log('[Sync] v9.3 B方案：所有監聽器已啟動');
}"""

new_initSync = """// v10.0 B方案：Firebase push() 鍵架構 — 物件格式即時監聽

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
    } catch(e) {}
  });

  // 5. workingMonth
  db.ref('macau_data/workingMonth').on('value', function(snapshot) {
    try { var d = snapshot.val(); if (d) workingMonth = d; } catch(e) {}
  });

  // 6. rmBookings
  db.ref('macau_data/rmBookings').on('value', function(snapshot) {
    try {
      if (typeof RM !== 'undefined') {
        var d = snapshot.val();
        if (!d) { RM.bookings = []; }
        else if (Array.isArray(d)) { RM.bookings = d; }
        else if (typeof d === 'object') { RM.bookings = _objToArray(d); }
        RM.save(); RM.render();
      }
    } catch(e) {}
  });

  // 7. archives
  db.ref('macau_data/archives').on('value', function(snapshot) {
    try { var d = snapshot.val(); if (d) localStorage.setItem('macau_archives', JSON.stringify(d)); } catch(e) {}
  });

  console.log('[Sync] v10.0 B方案：所有監聽器已啟動');
}"""

replace(old_initSync, new_initSync)

# ============================================================
# Stage 14: 關閉月結時同步
# ============================================================
print("\n=== Stage 14: closeCurrentMonth() ===")

# 不需要修改，因為 syncUpload() 已改寫。但確保它仍然呼叫 syncUpload()

# ============================================================
# Stage 15: saveData / saveFundData — 確保 syncUpload 仍被呼叫
# ============================================================
print("\n=== Stage 15: 驗證 saveData/saveFundData")

# saveData 和 saveFundData 不需要修改，因為它們調用 syncUpload()

# ============================================================
# 寫入檔案
# ============================================================
print(f"\n共完成 {changes_made} 次替換")
print("寫入檔案...")
with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ 檔案已寫入")
