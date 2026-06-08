// js/navigation.js - v11.0
// Non-overlapping extraction

function toggleSidebar() {
  var sb = document.getElementById("sidebar");
  if (!sb) return;
  sb.classList.toggle("collapsed");
  var icon = document.getElementById("sb-toggle-icon");
  if (icon) icon.textContent = sb.classList.contains("collapsed") ? "▶" : "◀";
}
function toggleMobileSidebar() {
  console.log('toggleMobileSidebar called, mobile=<828>');
  var sb = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  if (!sb) { console.log('sidebar not found'); return; }
  sb.classList.toggle("mobile-hidden");
  console.log('mobile-hidden present: <828>', sb.classList.contains("mobile-hidden"));
  // 控制遮罩層顯示/隱藏
  if (overlay) {
    if (sb.classList.contains("mobile-hidden")) {
      overlay.classList.remove("active");
      setTimeout(function() { overlay.style.display = "none"; }, 250);
    } else {
      overlay.style.display = "block";
      overlay.offsetHeight;
      overlay.classList.add("active");
    }
  }
}

function toggleTypeFields() {
  var type = document.getElementById("f-type").value;
  var isRolling = (type === "rolling");
  document.getElementById("fg-client").style.display = isRolling ? "" : "none";
  document.getElementById("fg-rolling").style.display = isRolling ? "" : "none";
  document.getElementById("fg-rolling-2").style.display = isRolling ? "" : "none";
  document.getElementById("fg-rolling-3").style.display = isRolling ? "" : "none";
  document.getElementById("fg-rolling-4").style.display = isRolling ? "" : "none";
  document.getElementById("fg-cash").style.display = isRolling ? "none" : "";
}

function validateMonthDate(dateStr, label) {
  if (!workingMonth) return true;
  var m = (dateStr || "").slice(0, 7);
  if (m !== workingMonth) {
    showToast(label + "日期必須在當月（" + workingMonth + "）！", "warning");
    return false;
  }
  return true;
}

// v10.0 B方案：openModal 接受 _fbKey（字串）或數字 id（向後兼容）
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
    document.getElementById("modal-title").textContent = "編輯交易";
    populateAgentDropdown();
    document.getElementById("f-date").value = tx.date || nowStr();
    document.getElementById("f-dow").value = getDow(tx.date || nowStr());
    document.getElementById("f-type").value = tx.type || "rolling";
    toggleTypeFields();
    document.getElementById("f-agent").value = tx.agent || "";
    document.getElementById("f-client").value = tx.client || "";
    document.getElementById("f-venue").value = tx.venue || "";
    document.getElementById("f-vol").value = tx.volume || "";
    document.getElementById("f-rate").value = tx.rate || "1.24";
    document.getElementById("f-bonus").value = tx.bonus || "";
    document.getElementById("f-drawn").value = tx.drawn || "0";
    document.getElementById("f-cash").value = tx.cash || "";
    document.getElementById("f-note").value = tx.note || "";
    calc();
    document.getElementById("modal").classList.add("show");
    lockBody();
    return;
  }
  // 新增模式（原有邏輯）
  editId = null;
  document.getElementById("modal-title").textContent = "新增交易";
  populateAgentDropdown();
  // 檢查是否有未完成的草稿（自動恢復，不彈 confirm 打斷操作）
  var draft = loadDraft();
  if (draft && !draft.editId) {
    // 靜默恢復草稿資料
    document.getElementById("f-date").value = draft.date || nowStr();
    document.getElementById("f-dow").value = getDow(draft.date || nowStr());
    document.getElementById("f-type").value = draft.type || "rolling";
    toggleTypeFields();
    document.getElementById("f-agent").value = draft.agent || "";
    document.getElementById("f-client").value = draft.client || "";
    document.getElementById("f-venue").value = draft.venue || "";
    document.getElementById("f-vol").value = draft.vol || "";
    document.getElementById("f-rate").value = draft.rate || "1.24";
    document.getElementById("f-bonus").value = draft.bonus || "";
    document.getElementById("f-drawn").value = draft.drawn || "0";
    document.getElementById("f-cash").value = draft.cash || "";
    document.getElementById("f-note").value = draft.note || "";
    calc();
    clearDraft();
    showToast("已恢復草稿，編輯後按儲存", "info");
  } else {
    clearDraft();
    _resetFormFields();
  }
  document.getElementById("modal").classList.add("show");
  lockBody();
}
function _resetFormFields() {
  document.getElementById("f-date").value = nowStr();
  document.getElementById("f-dow").value = getDow(nowStr());
  document.getElementById("f-type").value = "rolling";
  toggleTypeFields();
  document.getElementById("f-client").value = "";
  document.getElementById("f-venue").value = "";
  document.getElementById("f-vol").value = "";
  document.getElementById("f-rate").value = "1.24";
  document.getElementById("f-comm").value = "";
  document.getElementById("f-bonus").value = "";
  document.getElementById("f-fund").value = "";
  document.getElementById("f-drawn").value = "0";
  document.getElementById("f-undrawn").value = "";
  document.getElementById("f-cash").value = "";
  document.getElementById("f-note").value = "";
}

function closeModal() {
  saveDraft();  // 關閉前儲存草稿
  document.getElementById("modal").classList.remove("show");
  unlockBody();
}

function calc() {
  var vol = toNum(document.getElementById("f-vol").value);
  var rate = toNum(document.getElementById("f-rate").value);
  var comm = calcComm(vol, rate);
  var bonus = toNum(document.getElementById("f-bonus").value);
  document.getElementById("f-comm").value = comm > 0 ? comm : "";
  document.getElementById("f-fund").value = calcFund(comm, bonus);
  var drawn = toNum(document.getElementById("f-drawn").value);
  document.getElementById("f-undrawn").value = Math.max(0, bonus - drawn);
}

// v10.0 B方案：使用 _fbKey 直接寫入 Firebase 個別路徑
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
  // v10.26 B方案：使用重試封裝寫入 Firebase 個別路徑
  if (db && fbKey) {
    var targetObj = null;
    for (var i = 0; i < txs.length; i++) { if (txs[i]._fbKey === fbKey) { targetObj = txs[i]; break; } }
    if (targetObj) _syncSet(db.ref('macau_data/txs/' + fbKey), targetObj);
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
}

// ===== 自動儲存草稿功能 =====