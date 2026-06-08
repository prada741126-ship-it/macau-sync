// data/transactions.js - v11.0 交易 CRUD
// Merged: delete + form + monthly-close

function sortTable(tableId, thEl) {
  var col = thEl.getAttribute("data-sort");
  if (!col) return;
  if (sortState.table === tableId && sortState.col === col) {
    sortState.asc = !sortState.asc;
  } else {
    sortState.table = tableId;
    sortState.col = col;
    sortState.asc = true;
  }
  // Clear all sort indicators in this table group
  var table = document.getElementById(tableId === "all" ? "all-table" : tableId);
  var headers = table.querySelectorAll("th.sortable");
  for (var i = 0; i < headers.length; i++) {
    headers[i].classList.remove("sort-asc", "sort-desc");
  }
  thEl.classList.add(sortState.asc ? "sort-asc" : "sort-desc");
  if (tableId === "all") renderAll();
}

function sortTxs(arr) {
  if (sortState.table !== "all" || !sortState.col) return arr;
  var col = sortState.col;
  var asc = sortState.asc ? 1 : -1;
  return arr.sort(function(a, b) {
    var va, vb;
    if (col === "volume") { va = toNum(a.volume) || 0; vb = toNum(b.volume) || 0; }
    else if (col === "comm") { va = a.comm || 0; vb = b.comm || 0; }
    else if (col === "bonus") { va = a.bonus || 0; vb = b.bonus || 0; }
    else if (col === "date") { va = a.date || ""; vb = b.date || ""; }
    else { va = String(a[col] || "").toLowerCase(); vb = String(b[col] || "").toLowerCase(); }
    if (va < vb) return -1 * asc;
    if (va > vb) return 1 * asc;
    return 0;
  });
}

// ===== 鍵盤快捷鍵 (v6.0 強化版) =====

var _draftTimer = null;

function saveDraft() {
  var d = {
    date: document.getElementById("f-date").value,
    type: document.getElementById("f-type").value,
    agent: document.getElementById("f-agent").value,
    client: document.getElementById("f-client").value,
    venue: document.getElementById("f-venue").value,
    vol: document.getElementById("f-vol").value,
    rate: document.getElementById("f-rate").value,
    bonus: document.getElementById("f-bonus").value,
    drawn: document.getElementById("f-drawn").value,
    cash: document.getElementById("f-cash").value,
    note: document.getElementById("f-note").value,
    editId: editId,
    ts: Date.now()
  };
  // 只有表單有內容時才儲存
  var hasContent = d.agent || d.client || d.vol || d.cash || d.note;
  if (hasContent) {
    localStorage.setItem("macau_draft", JSON.stringify(d));
    var el = document.getElementById("draft-indicator");
    if (el) { el.style.display = "block"; el.style.opacity = "1"; }
  }
}

function loadDraft() {
  var raw = localStorage.getItem("macau_draft");
  if (!raw) return null;
  try {
    var d = JSON.parse(raw);
    // 超過 2 小時的草稿視為過期
    if (Date.now() - d.ts > 7200000) { clearDraft(); return null; }
    return d;
  } catch(e) { clearDraft(); return null; }
}

function clearDraft() {
  localStorage.removeItem("macau_draft");
  var el = document.getElementById("draft-indicator");
  if (el) { el.style.display = "none"; el.style.opacity = "0"; }
}

// 監聽表單欄位變更，自動儲存草稿（防抖 2 秒）
function _setupDraftAutoSave() {
  var fields = ["f-date","f-type","f-agent","f-client","f-venue","f-vol","f-rate","f-bonus","f-drawn","f-cash","f-note"];
  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById(fields[i]);
    if (el) {
      el.addEventListener("input", function() {
        clearTimeout(_draftTimer);
        _draftTimer = setTimeout(saveDraft, 2000);
      });
      el.addEventListener("change", function() {
        clearTimeout(_draftTimer);
        _draftTimer = setTimeout(saveDraft, 2000);
      });
    }
  }
}
// 登入頁粒子動畫（中國風金塵 + 螢火蟲）
var _pwParticlesAnimId = null, _pwParticles = [];
function _startLoginParticles() {
  try {
    var cv = document.getElementById("pw-particles");
    if (!cv) return;
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    _pwParticles = [];
    // 金色塵埃
    for (var i = 0; i < 40; i++) {
      _pwParticles.push({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        r: Math.random() * 2 + 0.8,
        speed: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.45 + 0.1,
        hue: Math.random() < 0.3 ? 25 + Math.random() * 10 : 38 + Math.random() * 12,
        sway: Math.random() * 0.5 - 0.25
      });
    }
    // 螢火蟲（較大較亮）
    for (var i = 0; i < 8; i++) {
      _pwParticles.push({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        r: Math.random() * 3 + 2,
        speed: Math.random() * 0.25 + 0.05,
        opacity: Math.random() * 0.7 + 0.2,
        hue: 40 + Math.random() * 10,
        sway: Math.random() * 0.8 - 0.4,
        firefly: true
      });
    }
    function _anim() {
      if (!cv || !ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < _pwParticles.length; i++) {
        var p = _pwParticles[i];
        p.y -= p.speed;
        p.x += p.sway;
        if (p.y < -20) { p.y = cv.height + 20; p.x = Math.random() * cv.width; }
        if (p.x < -10) p.x = cv.width + 10;
        if (p.x > cv.width + 10) p.x = -10;
        var alpha = p.opacity;
        if (p.firefly) alpha = p.opacity * (0.5 + 0.5 * Math.sin(Date.now() / 1500 + i));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + p.hue + ", 80%, 70%, " + alpha + ")";
        ctx.fill();
        if (p.firefly) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "hsla(" + p.hue + ", 80%, 70%, " + (alpha * 0.12) + ")";
          ctx.fill();
        }
      }
      _pwParticlesAnimId = requestAnimationFrame(_anim);
    }
    _anim();
  } catch(e) { console.error("Login particles error:", e); }
}
function _stopLoginParticles() {
  if (_pwParticlesAnimId) { cancelAnimationFrame(_pwParticlesAnimId); _pwParticlesAnimId = null; }
  _pwParticles = [];
}
// 頁面載入後設定草稿自動儲存監聽 + 自動備份檢查 + PWA 註冊
document.addEventListener("DOMContentLoaded", function() {
  _setupDraftAutoSave();
  _autoBackupCheck();
  _startLoginParticles();
  // v10.20 不再註冊 Service Worker（避免快取導致版本無法更新）
  // PWA 相關功能已停用
  // v10.22 顯示版本號於登入頁面
  var pv = document.getElementById('pw-version');
  if (pv) pv.textContent = window.APP_VERSION || '';
});

// ===== 7 天自動備份功能 =====

function closeCurrentMonth() {
  var now = nowStr().slice(0, 7);
  if (workingMonth === now) { showToast('本月已結算過了', 'warning'); return; }
  if (!confirm('確定執行 ' + now + ' 月末結算？\n\n結算後將鎖定本月資料，無法再登錄新交易。')) return;
  workingMonth = now;
  localStorage.setItem('macau_working_month', now);
  if (typeof syncUpload === 'function') syncUpload();
  document.getElementById('month-badge').textContent = now;
  document.getElementById('month-status').textContent = '已鎖定';
  document.getElementById('month-status').style.color = '#e74c3c';
  document.getElementById('btn-close-month').disabled = true;
  showToast('月末結算完成，' + now + ' 已鎖定', 'success');
}

// ===== v10.0 B方案：Firebase push() 鍵架構，個別路徑寫入 =====
