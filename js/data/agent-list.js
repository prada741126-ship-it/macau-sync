// js/data/agent-list.js - v11.0
// Non-overlapping extraction

function loadAgentList() {
  try { agentList = JSON.parse(localStorage.getItem('macau_agent_list')) || []; }
  catch(e) { agentList = []; }
}

function saveAgentList() {
  agentList.sort();
  localStorage.setItem('macau_agent_list', JSON.stringify(agentList));
  if (typeof syncUpload === 'function') syncUpload();
}

function populateAgentDropdown() {
  var sel = document.getElementById('f-agent');
  if (!sel) return;
  var val = sel.value;
  sel.innerHTML = '<option value="">請選擇代理</option>';
  for (var i = 0; i < agentList.length; i++) {
    sel.innerHTML += '<option value="' + agentList[i] + '">' + agentList[i] + '</option>';
  }
  if (val) sel.value = val;
}

function openAgentMgr() {
  loadAgentList();
  renderAgentMgr();
  document.getElementById('agent-mgr-modal').style.display = 'flex';
  lockBody();
}

function closeAgentMgr() {
  document.getElementById('agent-mgr-modal').style.display = 'none';
  populateAgentDropdown();
  fillAgent();
  populateVenueDropdown();
  unlockBody();
}

function renderAgentMgr() {
  var container = document.getElementById('agent-mgr-list');
  if (!container) return;
  var html = '';
  for (var i = 0; i < agentList.length; i++) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(212,175,55,0.1);">' +
      '<span>' + agentList[i] + '</span>' +
      '<button class="btn-red" data-agent-del="' + agentList[i] + '">刪除</button>' +
      '</div>';
  }
  container.innerHTML = html || '<div style="color:#999;text-align:center;padding:20px;">尚無代理，請新增</div>';
}

function addAgentFromMgr() {
  var inp = document.getElementById('agent-mgr-new');
  var name = inp.value.trim();
  if (!name) { showToast('請輸入代理名稱！', 'warning'); return; }
  if (agentList.indexOf(name) >= 0) { showToast('該代理已存在！', 'warning'); return; }
  agentList.push(name);
  agentList.sort();
  saveAgentList();
  inp.value = '';
  renderAgentMgr();
  showToast('已新增代理：' + name, 'success');
}

// 代理管理事件委托（刪除按鈕）
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-agent-del]');
  if (!btn) return;
  var name = btn.getAttribute('data-agent-del');
  if (!confirm('確定刪除代理「' + name + '」？')) return;
  agentList = agentList.filter(function(a) { return a !== name; });
  saveAgentList();
  renderAgentMgr();
  showToast('已刪除代理：' + name, 'success');
});

// 快捷键：ESC 關閉代理管理彈窗
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var modal = document.getElementById('agent-mgr-modal');
    if (modal && modal.style.display === 'flex') closeAgentMgr();
  }
});

// ✅ 自動登入檢查（兩通道 — 同頁 F5 刷新 / 伺服器模式）
// 通道1：sessionStorage（F5 刷新，file:// 單頁有效）
// 通道2：localStorage（Web 伺服器模式，跨頁有效）
(function autoLogin() {
  var authOk = false;
  var pw = "";

  // 通道1：sessionStorage（同頁刷新）
  if (sessionStorage.getItem("macau_auth") === "1") {
    authOk = true;
    pw = sessionStorage.getItem("_pw") || "macau888";
  }

  // 通道2：localStorage（伺服器模式）
  if (!authOk && localStorage.getItem("macau_auth") === "1") {
    authOk = true;
    pw = localStorage.getItem("_pw") || "macau888";
  }

  if (authOk) {
    document.getElementById("pw-overlay").style.display = "none";
    setSessionPw(pw);
    sessionStorage.setItem("macau_auth", "1");
    sessionStorage.setItem("_pw", pw);
    resetSession();
  }
})();

loadAgentList();
loadFundData();
loadAgentWallets();
// 從 localStorage 加載工作日誌月份
(function(){ try { var wm = localStorage.getItem("macau_working_month"); if (wm) workingMonth = wm; } catch(e) {} })();
// 從 localStorage 加載酒店設定（防止 syncUpload 覆蓋 Firebase 資料）
(function(){ try { loadHCConfig(); } catch(e) { console.error('loadHCConfig error:', e); } })();
populateAgentDropdown();
renderAll();
renderOverview();
updateTotalWalletUI();
initSync();

// ===== 總覽頁渲染 =====