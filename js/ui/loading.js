// js/ui/loading.js - v11.0 module
// Extracted from monolithic index.html

function showLoading(msg) {
  var el = document.getElementById("loading-overlay");
  if (el) {
    el.querySelector(".loading-text").textContent = msg || "處理中…";
    el.classList.add("show");
  }
}
function hideLoading() {
  var el = document.getElementById("loading-overlay");
  if (el) el.classList.remove("show");
}

function openFundModal() {
  document.getElementById("fund-date").value = nowStr();
  document.getElementById("fund-type").value = "withdraw";
  document.getElementById("fund-amount").value = "";
  document.getElementById("fund-note").value = "";
  var totalF = 0;
  for (var i = 0; i < txs.length; i++) { totalF += (txs[i].fund || 0); }
  var totalW = 0, totalD = 0, totalCD = 0;
  for (var i = 0; i < fundWithdrawals.length; i++) {
    if (fundWithdrawals[i].type === "deposit") { totalD += (fundWithdrawals[i].amount || 0); }
    else if (fundWithdrawals[i].type === "cash_deposit") { totalCD += (fundWithdrawals[i].amount || 0); }
    else { totalW += (fundWithdrawals[i].amount || 0); }
  }
  document.getElementById("fund-balance").value = fmt(Math.max(0, totalF + totalD + totalCD - totalW));
  document.getElementById("fund-modal").classList.add("show");
  lockBody();
}
function closeFundModal() {
  document.getElementById("fund-modal").classList.remove("show");
  unlockBody();
}
// v10.0 B方案：公基金使用 _fbKey
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
  // v10.26 重試封裝寫入 Firebase
  if (db && fbKey) _syncSet(db.ref('macau_data/fundWithdrawals/' + fbKey), rec);
  saveFundData(true);
  closeFundModal();
  doQuery();
  updateTotalWalletUI();
  showToast("已儲存！","success");
  window._savingFund = false;
}
// v10.0 B方案：使用 _fbKey 刪除公基金
function deleteFund(id) {
  try {
  if (!confirm("確定刪除？")) return;
  var key = String(id);
  var fbKey = null;
  var newArr = [];
  for (var i = 0; i < fundWithdrawals.length; i++) {
    if (fundWithdrawals[i]._fbKey === key || fundWithdrawals[i].id === id || fundWithdrawals[i].id === parseInt(id)) {
      fbKey = fundWithdrawals[i]._fbKey;
    } else {
      newArr.push(fundWithdrawals[i]);
    }
  }
  fundWithdrawals = newArr;
  if (db && fbKey) {
    _syncSet(db.ref('macau_data/fundWithdrawals/' + fbKey), null);
  }
  saveFundData(true);
  doQuery();
  updateTotalWalletUI();
  } catch(e) {
    console.error('[deleteFund] 錯誤:', e);
    showToast("刪除失敗：" + (e.message||e), "error");
  }
}
function saveFundData(silent) {
  localStorage.setItem("macau_fund_data", encryptData(fundWithdrawals));
  // v8.0 移除全局锁，改用 deviceId 回音过滤
  if (typeof syncUpload === 'function') syncUpload();
}
// v10.0 B方案：載入時自動補 _fbKey
function loadFundData(silent) {
  var d = localStorage.getItem("macau_fund_data");
  if (!d) return;
  fundWithdrawals = decryptData(d);
  var maxId = 0;
  for (var i = 0; i < fundWithdrawals.length; i++) {
    if (!fundWithdrawals[i]._fbKey) fundWithdrawals[i]._fbKey = _fbKey();  // v10.0 補 _fbKey
    if (fundWithdrawals[i].id > maxId) maxId = fundWithdrawals[i].id;
  }
  fundNextId = maxId + 1;
}

// ===== 代理錢包 =====