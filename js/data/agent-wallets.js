// js/data/agent-wallets.js - v11.0
// Non-overlapping extraction

function openAgentWalletModal(agentName) {
  document.getElementById("aw-date").value = nowStr();
  document.getElementById("aw-amount").value = "";
  document.getElementById("aw-note").value = "";
  document.getElementById("aw-type").value = "withdraw";
  document.getElementById("agent-wallet-title").textContent = "代理錢包 — " + agentName;
  document.getElementById("agent-wallet-modal").setAttribute("data-agent", agentName);
  var totalB = 0, totalC = 0, txDrawn = 0;
  for (var i = 0; i < txs.length; i++) {
    if (txs[i].agent === agentName) { totalB += (txs[i].bonus || 0); totalC += (txs[i].cash || 0); txDrawn += (txs[i].drawn || 0); }
  }
  var awArr = agentWallets[agentName] || [];
  var awDeposit = 0, awCashDep = 0, awWithdraw = 0;
  for (var i = 0; i < awArr.length; i++) {
    var t = awArr[i].type;
    if (t === "deposit") awDeposit += (awArr[i].amount || 0);
    else if (t === "cash_deposit") awCashDep += (awArr[i].amount || 0);
    else awWithdraw += (awArr[i].amount || 0);
  }
  var effectiveDrawn = Math.max(awWithdraw, txDrawn);
  document.getElementById("aw-balance").value = fmt(Math.max(0, totalB + totalC + awDeposit + awCashDep - effectiveDrawn));
  document.getElementById("agent-wallet-modal").classList.add("show");
  lockBody();
}
function closeAgentWalletModal() {
  document.getElementById("agent-wallet-modal").classList.remove("show");
  unlockBody();
}
// v10.0 B方案：代理錢包使用 _fbKey
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
}
// v10.12 代理錢包刪除：簡化邏輯，統一走 syncUpload transaction
function deleteAgentWallet(agent, id) {
  console.log('[deleteAgentWallet] === 開始 === agent=' + agent + ' id=' + id);
  if (!confirm("確定刪除？")) { console.log('[deleteAgentWallet] 使用者取消'); return; }
  var arr = agentWallets[agent] || [];
  var key = String(id);
  var newArr = [];
  var found = false;
  var targetFbKey = null;
  console.log('[deleteAgentWallet] 代理 ' + agent + ' 原有 ' + arr.length + ' 筆記錄');
  for (var i = 0; i < arr.length; i++) {
    var t = arr[i];
    if (!t) continue;
    var matched = (String(t._fbKey) === key || String(t.id) === key || t.id === parseInt(id));
    if (matched) { found = true; targetFbKey = t._fbKey; console.log('[deleteAgentWallet] 找到要刪除的記錄: _fbKey=' + t._fbKey + ' id=' + t.id); continue; }
    newArr.push(t);
  }
  if (!found) { showToast("找不到該筆記錄","warning"); console.log('[deleteAgentWallet] 找不到記錄 agent=' + agent + ' id=' + id); return; }
  console.log('[deleteAgentWallet] 刪除後剩餘 ' + newArr.length + ' 筆');
  agentWallets[agent] = newArr;
  saveAgentWalletsLocalOnly();
  console.log('[deleteAgentWallet] 已儲存到 localStorage');

  // v10.16 簡化策略：繞過 transaction，直接 set Firebase
  if (db) {
    try {
      if (newArr.length === 0) {
        // 全部刪完了 → 直接把整個代理節點設為 null（刪除）
        console.log('[deleteAgentWallet] 代理 ' + agent + ' 已無記錄，直接刪除 Firebase 節點');
        db.ref('macau_data/agentWallets/' + agent).set(null, function(err) {
          if (err) console.error('[deleteAgentWallet] 刪除代理節點失敗:', err);
          else console.log('[deleteAgentWallet] 代理節點已刪除 (Firebase)');
        });
      } else {
        // 還有記錄 → 直接寫入正確的物件
        var obj = {};
        for (var j = 0; j < newArr.length; j++) {
          var item = newArr[j];
          if (!item._fbKey) item._fbKey = _fbKey();
          obj[item._fbKey] = item;
        }
        console.log('[deleteAgentWallet] 直接寫入 Firebase，keys=' + JSON.stringify(Object.keys(obj)));
        db.ref('macau_data/agentWallets/' + agent).set(obj, function(err) {
          if (err) console.error('[deleteAgentWallet] 寫入失敗:', err);
          else console.log('[deleteAgentWallet] 寫入成功 (Firebase)');
        });
      }
    } catch(e) { console.error('[deleteAgentWallet] Firebase 直接寫入錯誤:', e); }
  }

  // 安全網：同時也呼叫 syncUpload（備援）
  console.log('[deleteAgentWallet] 同時呼叫 syncUpload() 作為備援');
  syncUpload();

  syncAgentDrawn(agent);
  try { doQuery(); } catch(e) { console.error('[deleteAgentWallet] doQuery 錯誤:', e); }
  showToast("代理錢包已刪除，同步中…", "success");
  console.log("[deleteAgentWallet] === 完成 ===");
}
function syncAgentDrawn(agent) {
  try {
  var awArr = agentWallets[agent] || [];
  var awTotal = 0;
  for (var i = 0; i < awArr.length; i++) {
    var t = awArr[i].type;
    if (!t || t === "withdraw") awTotal += (awArr[i].amount || 0);
  }
  for (var i = 0; i < txs.length; i++) {
    if (txs[i].agent === agent) txs[i].drawn = awTotal;
  }
  saveData(true);
  try { renderAll(); } catch(e1) { console.error("[syncAgentDrawn] renderAll error:", e1); }
  try { renderOverview(); } catch(e2) { console.error("[syncAgentDrawn] renderOverview error:", e2); }
  try { renderSummary(); } catch(e3) { console.error("[syncAgentDrawn] renderSummary error:", e3); }
  } catch(e) {
    console.error("[syncAgentDrawn] fatal error:", e);
    showToast("同步代理提領失敗：" + (e.message||e), "error");
  }
}
function saveAgentWallets(silent) {
  localStorage.setItem("macau_agent_wallets", encryptWallets(agentWallets));
  if (typeof syncUpload === 'function') setTimeout(syncUpload, 300);
}
// v10.8 僅存本地（不觸發 syncUpload）
function saveAgentWalletsLocalOnly() {
  localStorage.setItem("macau_agent_wallets", encryptWallets(agentWallets));
}
// v10.0 B方案：載入時自動補 _fbKey
function loadAgentWallets(silent) {
  var d = localStorage.getItem("macau_agent_wallets");
  if (!d) return;
  agentWallets = decryptWallets(d);
  var maxId = 0;
  var agents = Object.keys(agentWallets);
  for (var i = 0; i < agents.length; i++) {
    var arr = agentWallets[agents[i]];
    for (var j = 0; j < arr.length; j++) {
      if (!arr[j]._fbKey) arr[j]._fbKey = _fbKey();  // v10.0 補 _fbKey
      if (arr[j].id > maxId) maxId = arr[j].id;
    }
  }
  agentWalletNextId = maxId + 1;
}

function saveData(silent) {
  console.log('[saveData] 函數被調用，silent=', silent, '，交易數量：', txs.length);
  try {
    var encrypted = encryptData(txs);
    localStorage.setItem("macau_data", encrypted);
    console.log('[saveData] 已保存到 localStorage（加密）');
    if (typeof syncUpload === 'function') { console.log('[saveData] 準備呼叫 syncUpload()'); syncUpload(); }
    if (!silent) showToast("已儲存 " + txs.length + " 筆","success");
  } catch(e) {
    console.error('saveData error:', e);
    // 如果加密或保存失敗，嘗試直接保存（不加密）
    try {
      localStorage.setItem("macau_data", JSON.stringify(txs));
      if (!silent) showToast("已儲存（未加密）","warning");
    } catch(e2) {
      console.error('saveData fallback error:', e2);
      if (!silent) showToast("儲存失敗！localStorage 可能已滿","error");
    }
  }
}

// v10.0 B方案：載入時自動補 _fbKey
function loadData(silent) {
  var d = localStorage.getItem("macau_data");
  if (!d) { if (!silent) showToast("無資料","info"); return; }
  txs = decryptData(d);
  var maxId = 0;
  for (var i = 0; i < txs.length; i++) {
    if (!txs[i]._fbKey) txs[i]._fbKey = _fbKey();  // v10.0 補 _fbKey
    if (txs[i].id > maxId) maxId = txs[i].id;
  }
  nextId = maxId + 1;
  renderAll();
  renderOverview();
  renderSummary();
  if (!silent) showToast("已讀取 " + txs.length + " 筆","success");
}

// v10.0 B方案：刪除事件監聽器，使用 _fbKey
document.addEventListener("click", function(e) {
  var btn = e.target.closest("[data-del]");
  if (!btn) return;
  e.preventDefault();
  var fbKey = btn.getAttribute("data-del");
  console.log('[Delete] 點擊刪除按鈕，fbKey:', fbKey);
  deleteTx(fbKey);
});

function renderAll() {
  var tbody = document.getElementById("all-body");
  tbody.innerHTML = "";
  var tbl = document.getElementById("all-table");
  var msg = document.getElementById("all-msg");
  // 搜尋過濾
  var keyword = "";
  var searchEl = document.getElementById("search-all");
  if (searchEl) keyword = searchEl.value.trim().toLowerCase();
  var filtered = txs;
  if (keyword) {
    filtered = txs.filter(function(t) {
      return (t.agent||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.client||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.venue||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.note||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.date||"").indexOf(keyword) >= 0;
    });
  }
  // 排序
  filtered = sortTxs(filtered.slice());
  // ✅ 修正：先更新 KPI 卡片（即使沒有資料也要歸零）
  renderAllMiniKPI();
  if (!filtered.length) {
    tbl.style.display = "none";
    msg.style.display = "block";
    msg.innerHTML = keyword
      ? '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">無符合搜尋結果</div><div class="empty-desc">請嘗試其他關鍵字或清除搜尋</div></div>'
      : '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">尚無交易紀錄</div><div class="empty-desc">點擊上方「＋ 新增」開始第一筆交易</div><button class="empty-action" onclick="openModal()">＋ 新增交易</button></div>';
    document.getElementById("tx-count").textContent = "";
    return;
  }
  tbl.style.display = "table";
  msg.style.display = "none";
  document.getElementById("tx-count").textContent = "共 " + filtered.length + " 筆";
  for (var i = 0; i < filtered.length; i++) {
    var t = filtered[i];
    var tags = getStatusTags(t);
    var tr = document.createElement("tr");
    var isCash = t.type === "cash";
    var typeLabel = isCash ? "<span style='color:#e67e22;font-weight:600;'>現金寄放</span>" : "洗碼";
    var vol = isCash ? 0 : (toNum(t.volume) || 0);
    var undrawn = isCash ? (t.cash || 0) : Math.max(0, (t.bonus || 0) - (t.drawn || 0));
    var commFmt = isCash ? "" : fmt(t.comm);
    var bonusFmt = isCash ? "" : fmt(t.bonus);
    var drawnFmt = isCash ? "" : fmt(t.drawn);
    var undrawnFmt = isCash ? fmt(t.cash) : fmt(undrawn);
    tr.innerHTML =
      "<td>" + (tags ? tags + "<br>" : "") + typeLabel + "</td>" +
      "<td>" + (t.date || "") + "</td>" +
      "<td>" + (t.agent || "") + "</td>" +
      "<td>" + (isCash ? "" : (t.client || "")) + "</td>" +
      "<td>" + (isCash ? "" : (t.venue || "")) + "</td>" +
      "<td class='num'>" + (vol > 0 ? vol.toLocaleString() + "萬" : "") + "</td>" +
      "<td class='num'>" + commFmt + "</td>" +
      "<td class='num'>" + bonusFmt + "</td>" +
      "<td class='num'>" + drawnFmt + "</td>" +
      "<td class='num'>" + undrawnFmt + "</td>" +
      "<td>" + (t.note || "") + "</td>" +
      "<td><button class='btn-gold' onclick='openModal(\"" + (t._fbKey||t.id) + "\")'>編輯</button> <button class='btn-red' onclick='deleteTx(\"" + (t._fbKey||t.id) + "\")'>刪除</button></td>";
    tbody.appendChild(tr);
  }
  fillAgent();
  populateVenueDropdown();
  // v10.26 檢查表格滾動狀態
  setTimeout(checkTableScroll, 150);
}

function calcTotalWallet() {
  // 計算所有代理錢包餘額（v4.9 修復）
  var agentSet = {};
  var agentTxDrawn = {};  // 每位代理的 tx.drawn（因 syncAgentDrawn 全部設成一樣，只需取一次）
  for (var i = 0; i < txs.length; i++) {
    var a = txs[i].agent || "";
    if (!a) continue;
    if (!agentSet[a]) agentSet[a] = { bonus: 0, cash: 0 };
    agentSet[a].bonus += (txs[i].bonus || 0);
    agentSet[a].cash += (txs[i].cash || 0);
    // 記錄此代理的 drawn（因 syncAgentDrawn 設全部交易一樣，取第一次即可）
    if (!agentTxDrawn[a] && txs[i].drawn > 0) agentTxDrawn[a] = txs[i].drawn;
  }
  var totalAgent = 0;
  var agents = Object.keys(agentSet);
  for (var j = 0; j < agents.length; j++) {
    var a = agents[j];
    var awArr = agentWallets[a] || [];
    var awDep = 0, awCDep = 0, awWithdraw = 0;
    for (var k = 0; k < awArr.length; k++) {
      var t = awArr[k].type;
      if (t === "deposit") awDep += (awArr[k].amount || 0);
      else if (t === "cash_deposit") awCDep += (awArr[k].amount || 0);
      else awWithdraw += (awArr[k].amount || 0);
    }
    var txDrawn = agentTxDrawn[a] || 0;
    var effectiveDrawn = Math.max(awWithdraw, txDrawn);
    var bal = Math.max(0, agentSet[a].bonus + agentSet[a].cash + awDep + awCDep - effectiveDrawn);
    totalAgent += bal;
  }
  // 計算公基金餘額
  var totalFund = 0;
  for (var i = 0; i < txs.length; i++) { totalFund += (txs[i].fund || 0); }
  var fwDep = 0, fwCDep = 0, fwWithdraw = 0;
  for (var i = 0; i < fundWithdrawals.length; i++) {
    var ft = fundWithdrawals[i].type;
    if (ft === "deposit") fwDep += (fundWithdrawals[i].amount || 0);
    else if (ft === "cash_deposit") fwCDep += (fundWithdrawals[i].amount || 0);
    else fwWithdraw += (fundWithdrawals[i].amount || 0);
  }
  var fundBal = Math.max(0, totalFund + fwDep + fwCDep - fwWithdraw);
  return totalAgent + fundBal;
}

function updateTotalWalletUI() {
  var tw = calcTotalWallet();
  document.getElementById("tw-value").textContent = "¥" + fmt(tw);
}


// ===== 月末结算（v4.1 修復）=====