// js/pages/room-misc.js - v11.0
// Non-overlapping extraction

function switchRoomTab(name, btn) {
  var tabs = document.querySelectorAll('.room-tab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  if (btn) btn.classList.add('active');
  var contents = document.querySelectorAll('.room-tab-content');
  for (var j = 0; j < contents.length; j++) contents[j].classList.remove('active');
  var content = document.getElementById('room-tab-' + name);
  if (content) content.classList.add('active');
  if (name === 'config' && typeof initHC === 'function') { initHC(); }
  if (name === 'booking') { try { RM.updateQuota(); RM.render(); } catch(e) {} }
}

// 工具函式：HTML 轉義
function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== 酒店設定預設數據 =====