// all.js — 全部交易页面渲染（基于正式版 v10.21 移植）
// v11.2.19 修复：从正式版移植 renderAll() 函数

function renderAll() {
  var tbody = document.getElementById("all-body");
  if (!tbody) return;  // 页面不存在时直接返回
  tbody.innerHTML = "";
  var tbl = document.getElementById("all-table");
  var msg = document.getElementById("all-msg");
  // 搜索过滤
  var keyword = "";
  var searchEl = document.getElementById("search-all");
  if (searchEl) keyword = searchEl.value.trim().toLowerCase();
  var filtered = window.txs;
  if (keyword) {
    filtered = window.txs.filter(function(t) {
      return (t.agent||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.client||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.venue||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.note||"").toLowerCase().indexOf(keyword) >= 0 ||
        (t.date||"").indexOf(keyword) >= 0;
    });
  }
  // 排序
  filtered = sortTxs(filtered.slice());
  // 先更新 KPI 卡片
  if (typeof renderAllMiniKPI === 'function') renderAllMiniKPI();
  if (!filtered.length) {
    if (tbl) tbl.style.display = "none";
    if (msg) {
      msg.style.display = "block";
      msg.innerHTML = keyword
        ? '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">无符合搜索结果</div><div class="empty-desc">请尝试其他关键字或清除搜索</div></div>'
        : '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">尚无交易纪录</div><div class="empty-desc">点击上方「＋ 新增」开始第一笔交易</div><button class="empty-action" onclick="openModal()">＋ 新增交易</button></div>';
    }
    var txCount = document.getElementById("tx-count");
    if (txCount) txCount.textContent = "";
    return;
  }
  if (tbl) tbl.style.display = "table";
  if (msg) msg.style.display = "none";
  var txCount = document.getElementById("tx-count");
  if (txCount) txCount.textContent = "共 " + filtered.length + " 笔";
  for (var i = 0; i < filtered.length; i++) {
    var t = filtered[i];
    var tags = getStatusTags(t);
    var tr = document.createElement("tr");
    var isCash = t.type === "cash";
    var typeLabel = isCash ? "<span style='color:#e67e22;font-weight:600;'>现金寄放</span>" : "洗码";
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
      "<td class='num'>" + (vol > 0 ? vol.toLocaleString() + "万" : "") + "</td>" +
      "<td class='num'>" + commFmt + "</td>" +
      "<td class='num'>" + bonusFmt + "</td>" +
      "<td class='num'>" + drawnFmt + "</td>" +
      "<td class='num'>" + undrawnFmt + "</td>" +
      "<td>" + (t.note || "") + "</td>" +
      "<td><button class='btn-gold' onclick='openModal(\"" + (t._fbKey||t.id) + "\")'>编辑</button> <button class='btn-red' onclick='deleteTx(\"" + (t._fbKey||t.id) + "\")'>删除</button></td>";
    tbody.appendChild(tr);
  }
  if (typeof fillAgent === 'function') fillAgent();
  if (typeof populateVenueDropdown === 'function') populateVenueDropdown();
}
