// js/pages/query.js - v11.0
// Non-overlapping extraction

function toggleAdvFilter() {
  var el = document.getElementById("adv-filter");
  var btn = document.getElementById("btn-adv-filter");
  if (el.style.display === "none" || !el.style.display) {
    el.style.display = "block";
    if (btn) btn.classList.add("active");
  } else {
    el.style.display = "none";
    if (btn) btn.classList.remove("active");
  }
}

function saveCurrentFilter() {
  var name = prompt("請輸入篩選名稱（例如：新濠本月）：");
  if (!name) return;
  var filter = {
    agent: document.getElementById("q-agent").value,
    venue: document.getElementById("q-venue").value,
    month: document.getElementById("q-month").value,
    dateFrom: document.getElementById("q-date-from").value,
    dateTo: document.getElementById("q-date-to").value,
    volMin: document.getElementById("q-vol-min").value,
    volMax: document.getElementById("q-vol-max").value
  };
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("macau_saved_filters") || "{}"); } catch(e) {}
  saved[name] = filter;
  localStorage.setItem("macau_saved_filters", JSON.stringify(saved));
  showToast("篩選「" + name + "」已儲存！", "success");
}

function showSavedFilters() {
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("macau_saved_filters") || "{}"); } catch(e) {}
  var names = Object.keys(saved);
  if (!names.length) { showToast("尚無已儲存的篩選條件", "info"); return; }
  var bg = document.createElement("div");
  bg.className = "modal-bg show";
  bg.id = "filter-modal";
  bg.onclick = function(e) { if (e.target === bg) { document.body.removeChild(bg); unlockBody(); } };
  var inner = '<div class="modal"><h3>📌 已儲存的篩選條件</h3>';
  inner += '<div style="max-height:300px;overflow-y:auto;">';
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    var f = saved[n];
    var desc = (f.agent || "全部代理") + " / " + (f.month || "不限月份") + (f.venue ? " / " + f.venue : "");
    inner += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;margin:4px 0;background:rgba(255,255,255,0.03);border-radius:6px;">';
    inner += '<div><span style="font-size:13px;color:var(--gold-light);">' + n + '</span><br><span style="font-size:10px;color:#6e7681;">' + desc + '</span></div>';
    inner += '<div><button class="btn" style="padding:3px 8px;font-size:10px;min-height:26px;" onclick="closeFilterModal();loadSavedFilter(\'' + n.replace(/'/g, "\\'") + '\')">套用</button>';
    inner += ' <button class="btn btn-red" style="padding:3px 8px;font-size:10px;min-height:26px;" onclick="deleteSavedFilter(\'' + n.replace(/'/g, "\\'") + '\')">✕</button></div>';
    inner += '</div>';
  }
  inner += '</div>';
  inner += '<div style="margin-top:12px;text-align:right;"><button class="btn" onclick="closeFilterModal()">關閉</button></div></div>';
  bg.innerHTML = inner;
  document.body.appendChild(bg);
  lockBody();
}

function loadSavedFilter(name) {
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("macau_saved_filters") || "{}"); } catch(e) {}
  var f = saved[name];
  if (!f) return;
  document.getElementById("q-agent").value = f.agent || "";
  document.getElementById("q-venue").value = f.venue || "";
  document.getElementById("q-month").value = f.month || "";
  document.getElementById("q-date-from").value = f.dateFrom || "";
  document.getElementById("q-date-to").value = f.dateTo || "";
  document.getElementById("q-vol-min").value = f.volMin || "";
  document.getElementById("q-vol-max").value = f.volMax || "";
  doQuery();
}

function deleteSavedFilter(name) {
  if (!confirm("確定刪除篩選「" + name + "」？")) return;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("macau_saved_filters") || "{}"); } catch(e) {}
  delete saved[name];
  localStorage.setItem("macau_saved_filters", JSON.stringify(saved));
  closeFilterModal();
  showToast("篩選「" + name + "」已刪除", "success");
}

function closeFilterModal() {
  var el = document.getElementById("filter-modal");
  if (el && el.parentNode) el.parentNode.removeChild(el);
  unlockBody();
}

function populateVenueDropdown() {
  var sel = document.getElementById("q-venue");
  if (!sel) return;
  var venues = ["新濠(勵盈1)","新濠(勵盈2)","銀河(金門1)","銀河(金門8)","金沙(御匾會)","永利(永利會)","上葡京"];
  var h = "<option value=''>全部地點</option>";
  for (var i = 0; i < venues.length; i++) h += "<option value='" + venues[i] + "'>" + venues[i] + "</option>";
  sel.innerHTML = h;
}

function doQuery() {
  try {
  var agent = document.getElementById("q-agent").value;
  var month = document.getElementById("q-month").value.trim();
  var skipMonthFilter = (month === "__ALL__");
  if (!month) month = "__ALL__";  // v11.2.18 改為預設顯示全部月份
  // 公基金查询 - 分筆流水（含累計餘額）
  if (agent === "__FUND__") {
    var allFundTxs = [], preBalance = 0, totalFund = 0;
    for (var i = 0; i < txs.length; i++) {
      var fv = txs[i].fund || 0;
      totalFund += fv;
      if (fv > 0) allFundTxs.push({ date: txs[i].date, desc: (txs[i].agent||"") + " " + (txs[i].client||""), amount: fv, type: "入帳", source: "tx", id: txs[i].id, _fbKey: txs[i]._fbKey });
    }
    allFundTxs.sort(function(a,b){ return a.date.localeCompare(b.date); });
    var totalW = 0, totalD = 0, totalCD = 0;
    for (var i = 0; i < fundWithdrawals.length; i++) {
      var r = fundWithdrawals[i];
      if (r.type === "deposit") { totalD += (r.amount || 0); }
      else if (r.type === "cash_deposit") { totalCD += (r.amount || 0); }
      else { totalW += (r.amount || 0); }
      var typeLabel = r.type === "deposit" ? "存入" : (r.type === "cash_deposit" ? "自存現金" : "提領");
      allFundTxs.push({ date: r.date, desc: r.note||"", amount: r.amount, type: typeLabel, rawType: r.type, source: "fund", id: r.id, _fbKey: r._fbKey });
    }
    allFundTxs.sort(function(a,b){ return a.date.localeCompare(b.date); });
    // 計算上月累計（當月之前的餘額）— 非全部月份時才計算
    preBalance = 0;
    if (!skipMonthFilter) {
      for (var i = 0; i < allFundTxs.length; i++) {
        var e = allFundTxs[i];
        if (e.date < month + "-01") {
          if (e.type === "入帳" || e.type === "存入" || e.type === "自存現金") preBalance += e.amount;
          else preBalance -= e.amount;
        }
      }
    }
    var balance = Math.max(0, totalFund + totalD + totalCD - totalW);
    var running = preBalance;
    document.getElementById("query-kpi").innerHTML =
      "<div class='kpi-card'><div class='label'>公基金總額</div><div class='value'>" + fmt(totalFund) + "</div></div>" +
      (totalCD > 0 ? "<div class='kpi-card' style='background:#e67e22;'><div class='label'>自存現金</div><div class='value'>" + fmt(totalCD) + "</div></div>" : "") +
      "<div class='kpi-card'><div class='label'>已提領</div><div class='value'>" + fmt(totalW) + "</div></div>" +
      "<div class='kpi-card' style='background:#f0a500;'><div class='label'>可提餘額</div><div class='value'>" + fmt(balance) + "</div></div>" +
      "<button class='btn btn-primary' style='margin-left:10px;' onclick='openFundModal()'>＋ 提領</button>";
    var tbody = document.getElementById("query-body");
    tbody.innerHTML = "";
    // 上月累計行（非全部月份且 preBalance > 0 時才顯示）
    if (!skipMonthFilter && preBalance > 0) {
      var pr = document.createElement("tr");
      pr.style.cssText = "background:rgba(201,168,76,0.08);";
      pr.innerHTML = "<td>" + month + "-01</td><td style='color:var(--gold-light);font-weight:600;'>上月累計</td><td class='num'></td><td class='num'></td><td></td><td class='num' style='font-weight:700;color:var(--gold-light);'>" + fmt(preBalance) + "</td>";
      tbody.appendChild(pr);
    }
    var hr = document.createElement("tr");
    hr.innerHTML = "<th>日期</th><th>說明</th><th class='num'>入帳</th><th class='num'>提領</th><th>操作</th><th class='num'>基金餘額</th>";
    tbody.appendChild(hr);
    for (var i = 0; i < allFundTxs.length; i++) {
      var e = allFundTxs[i];
      if (!skipMonthFilter && e.date < month + "-01") continue;
      if (e.type === "入帳" || e.type === "存入" || e.type === "自存現金") running += e.amount;
      else running -= e.amount;
      var tr = document.createElement("tr");
      var delBtn = e.source === "fund" ? "<button class='btn-red' onclick='deleteFund(\"" + (e._fbKey||e.id) + "\")'>刪除</button>" : "<span style='color:#6e7681;font-size:11px;'>自動</span>";
      var inVal = (e.type === "入帳" || e.type === "存入" || e.type === "自存現金") ? fmt(e.amount) : "";
      var outVal = (e.type === "提領") ? fmt(e.amount) : "";
      var typeClr = e.type === "提領" ? "color:#f85149;font-weight:600;" : (e.type === "存入" ? "color:#58a6ff;" : (e.type === "自存現金" ? "color:#e67e22;font-weight:600;" : "color:var(--gold-light);"));
      tr.innerHTML = "<td>" + e.date + "</td><td style='" + typeClr + "'>" + e.desc + "</td><td class='num' style='color:var(--gold-light);'>" + inVal + "</td><td class='num' style='color:#f85149;'>" + outVal + "</td><td>" + delBtn + "</td><td class='num' style='font-weight:700;'>" + fmt(Math.max(0, running)) + "</td>";
      tbody.appendChild(tr);
    }
    // 合計行
    var totalRow = document.createElement("tr");
    totalRow.style.cssText = "background:rgba(22,27,34,0.8);font-weight:700;color:var(--gold-light);";
    totalRow.innerHTML = "<td></td><td style='color:#e6edf3;'>合計</td><td class='num' style='color:var(--gold-light);'></td><td class='num' style='color:#f85149;'></td><td></td><td class='num' style='font-size:15px;'>" + fmt(Math.max(0, running)) + "</td>";
    tbody.appendChild(totalRow);
    return;
  }
  var data = [];
  // 讀取進階篩選條件
  var venue = document.getElementById("q-venue").value;
  var dateFrom = document.getElementById("q-date-from").value;
  var dateTo = document.getElementById("q-date-to").value;
  var volMin = toNum(document.getElementById("q-vol-min").value) || 0;
  var volMax = toNum(document.getElementById("q-vol-max").value) || 0;
  for (var i = 0; i < txs.length; i++) {
    var t = txs[i];
    if (!skipMonthFilter && t.date && t.date.indexOf(month) !== 0) continue;
    if (agent && t.agent !== agent) continue;
    if (venue && t.venue !== venue) continue;
    if (dateFrom && t.date < dateFrom) continue;
    if (dateTo && t.date > dateTo) continue;
    var vol = toNum(t.volume) || 0;
    if (volMin && vol < volMin) continue;
    if (volMax && vol > volMax) continue;
    data.push(t);
  }
  var tv = 0, tc = 0, tb = 0, td = 0;
  for (var k = 0; k < data.length; k++) {
    tv += toNum(data[k].volume) || 0;
    tc += data[k].comm || 0;
    tb += data[k].bonus || 0;
    td += data[k].drawn || 0;
  }
  document.getElementById("query-kpi").innerHTML =
    "<div class='kpi-card'><div class='label'>洗碼總量</div><div class='value'>" + (tv >= 10000 ? (tv/10000).toFixed(1) + "萬" : tv.toLocaleString() + "萬") + "</div></div>" +
    "<div class='kpi-card'><div class='label'>佣金總額</div><div class='value'>" + fmt(tc) + "</div></div>" +
    "<div class='kpi-card'><div class='label'>碼糧總額</div><div class='value'>" + fmt(tb) + "</div></div>" +
    "<div class='kpi-card'><div class='label'>已提領</div><div class='value'>" + fmt(td) + "</div></div>" +
    "<div class='kpi-card' style='background:#f0a500;'><div class='label'>未提領</div><div class='value'>" + fmt(Math.max(0, tb - td)) + "</div></div>";
  var tbody = document.getElementById("query-body");
  tbody.innerHTML = "";
  for (var m = 0; m < data.length; m++) {
    var t = data[m];
    var tr = document.createElement("tr");
    if (t.type === "cash") {
      tr.innerHTML =
        "<td>" + t.date + "</td>" +
        "<td style='color:#e67e22;font-weight:600;'>現金寄放</td>" +
        "<td>" + (t.note || "") + "</td>" +
        "<td class='num'></td>" +
        "<td class='num' style='color:#e67e22;'>+" + fmt(t.cash || 0) + "</td>" +
        "<td class='num'></td>" +
        "<td class='num' style='color:#e67e22;'>" + fmt(t.cash || 0) + "</td>" +
        "<td>" + (t.note || "") + "</td>";
    } else {
      tr.innerHTML =
        "<td>" + t.date + "</td>" +
        "<td>" + (t.agent || "") + "</td>" +
        "<td>" + (t.venue || "") + "</td>" +
        "<td class='num'>" + (toNum(t.volume) > 0 ? toNum(t.volume).toLocaleString() + "萬" : "") + "</td>" +
        "<td class='num'>" + fmt(t.bonus) + "</td>" +
        "<td class='num'>" + fmt(t.drawn) + "</td>" +
        "<td class='num'>" + fmt(Math.max(0, (t.bonus||0) - (t.drawn||0))) + "</td>" +
        "<td>" + (t.note || "") + "</td>";
    }
    tbody.appendChild(tr);
  }
  // 代理錢包（選特定代理時顯示）- 分筆流水含累計餘額
  if (agent) {
    var awArr = agentWallets[agent] || [];
    // 計算全部碼糧總額（不分月份）含現金寄放
    var allBonus = 0, allCash = 0, allDrawn = 0;
    for (var n = 0; n < txs.length; n++) {
      if (txs[n].agent === agent) {
        allBonus += (txs[n].bonus || 0);
        allCash += (txs[n].cash || 0);
      }
    }
    for (var p = 0; p < awArr.length; p++) {
      var wt = awArr[p].type;
      if (!wt || wt === "withdraw") allDrawn += (awArr[p].amount || 0);
    }
    // 計算錢包存款總額
    var awDep = 0, awCDep = 0;
    for (var p = 0; p < awArr.length; p++) {
      var wt = awArr[p].type;
      if (wt === "deposit") awDep += (awArr[p].amount || 0);
      else if (wt === "cash_deposit") awCDep += (awArr[p].amount || 0);
    }
    var awBalance = Math.max(0, allBonus + allCash + awDep + awCDep - allDrawn);
    // 建立合併流水：全部交易 + 錢包提領（含現金寄放）
    var allLedger = [];
    for (var p = 0; p < txs.length; p++) {
      if (txs[p].agent !== agent) continue;
      var bv = txs[p].bonus || 0;
      var cv = txs[p].cash || 0;
      if (bv > 0) allLedger.push({ date: txs[p].date, venue: txs[p].venue||"", client: txs[p].client||"", volume: toNum(txs[p].volume)||0, bonus: bv, rowType: "rolling", type: "入帳", source: "tx", id: txs[p].id, _fbKey: txs[p]._fbKey });
      if (cv > 0) allLedger.push({ date: txs[p].date, venue: "現金寄放", client: txs[p].note||"", volume: 0, bonus: cv, rowType: "cash", type: "入帳", source: "tx", id: txs[p].id, _fbKey: txs[p]._fbKey });
    }
    for (var p = 0; p < awArr.length; p++) {
      var wt = awArr[p].type;
      if (wt === "deposit") {
        allLedger.push({ date: awArr[p].date, venue: "存入", client: "", volume: 0, bonus: (awArr[p].amount||0), amount: awArr[p].amount||0, rowType: "aw_deposit", type: "存入", source: "wallet", id: awArr[p].id, _fbKey: awArr[p]._fbKey, note: awArr[p].note||"" });
      } else if (wt === "cash_deposit") {
        allLedger.push({ date: awArr[p].date, venue: "自存現金", client: "", volume: 0, bonus: (awArr[p].amount||0), amount: awArr[p].amount||0, rowType: "aw_cash_dep", type: "自存現金", source: "wallet", id: awArr[p].id, _fbKey: awArr[p]._fbKey, note: awArr[p].note||"" });
      } else {
        allLedger.push({ date: awArr[p].date, venue: "提領", client: "", volume: 0, bonus: -(awArr[p].amount||0), amount: awArr[p].amount||0, rowType: "withdraw", type: "提領", source: "wallet", id: awArr[p].id, _fbKey: awArr[p]._fbKey, note: awArr[p].note||"" });
      }
    }
    allLedger.sort(function(a,b){ return a.date.localeCompare(b.date); });
    // 計算上月累計（非全部月份時才計算）
    var preRunning = 0;
    if (!skipMonthFilter) {
      for (var p = 0; p < allLedger.length; p++) {
        if (allLedger[p].date < month + "-01") {
          preRunning += allLedger[p].bonus;
        }
      }
    }
    var running = preRunning;
    // 顯示 KPI + 明細
    var sep = document.createElement("tr");
    sep.innerHTML = "<td colspan='7' style='padding:4px;border:none;'></td>";
    tbody.appendChild(sep);
    var titleRow = document.createElement("tr");
    titleRow.innerHTML = "<td colspan='7' style='padding:8px 0;font-weight:700;color:#c9a84c;font-size:16px;'>💼 " + agent + " 代理對帳單</td>";
    tbody.appendChild(titleRow);
    var kpiRow = document.createElement("tr");
    kpiRow.innerHTML = "<td colspan='7' style='padding:8px 0;border:none;'>" +
      "<div class='kpi-box' style='margin-bottom:8px;'>" +
        "<div class='kpi-card'><div class='label'>碼糧總額</div><div class='value'>" + fmt(allBonus) + "</div></div>" +
        (allCash > 0 ? "<div class='kpi-card' style='background:#e67e22;'><div class='label'>現金寄放</div><div class='value'>" + fmt(allCash) + "</div></div>" : "") +
        (awDep > 0 ? "<div class='kpi-card' style='background:#58a6ff;'><div class='label'>錢包存入</div><div class='value'>" + fmt(awDep) + "</div></div>" : "") +
        (awCDep > 0 ? "<div class='kpi-card' style='background:#e67e22;'><div class='label'>自存現金</div><div class='value'>" + fmt(awCDep) + "</div></div>" : "") +
        "<div class='kpi-card'><div class='label'>已提領</div><div class='value'>" + fmt(allDrawn) + "</div></div>" +
        "<div class='kpi-card' style='background:#f0a500;'><div class='label'>未提領</div><div class='value'>" + fmt(awBalance) + "</div></div>" +
        "<button class='btn btn-primary' onclick=\"openAgentWalletModal('" + agent + "')\">＋ 異動</button>" +
      "</div></td>";
    tbody.appendChild(kpiRow);
    // 上月累計行（非全部月份且 preRunning > 0 時才顯示）
    if (!skipMonthFilter && preRunning > 0) {
      var pr = document.createElement("tr");
      pr.style.cssText = "background:rgba(201,168,76,0.08);";
      pr.innerHTML = "<td>" + month + "-01</td><td style='color:var(--gold-light);font-weight:600;'>上月累計</td><td class='num'></td><td class='num'></td><td></td><td class='num' style='font-weight:700;color:var(--gold-light);'>" + fmt(preRunning) + "</td><td></td>";
      tbody.appendChild(pr);
    }
    var thRow = document.createElement("tr");
    thRow.innerHTML = "<th>日期</th><th>地點</th><th class='num'>轉碼數</th><th class='num'>碼糧</th><th>操作</th><th class='num'>未領餘額</th><th></th>";
    tbody.appendChild(thRow);
    for (var q = 0; q < allLedger.length; q++) {
      var e = allLedger[q];
      if (!skipMonthFilter && e.date < month + "-01") continue;
      running += e.bonus;
      var tr2 = document.createElement("tr");
      if (e.rowType === "withdraw") {
        // 提領行：日期 | 提領(紅) | | -金額(紅) | 刪除 | 累計餘額
        var val = (e._fbKey||e.id).toString();
        var delBtn = "<button class='btn-red' onclick=\"deleteAgentWallet('" + agent + "','" + val + "')\">刪除</button>";
        tr2.innerHTML = "<td>" + e.date + "</td><td style='color:#f85149;font-weight:700;'>提領" + (e.note?"："+e.note:"") + "</td><td class='num'></td><td class='num' style='color:#f85149;font-weight:700;'>-" + fmt(e.amount) + "</td><td>" + delBtn + "</td><td class='num' style='font-weight:700;'>" + fmt(Math.max(0, running)) + "</td><td></td>";
      } else if (e.rowType === "aw_deposit") {
        // 錢包存入行：日期 | 存入(藍) | | +金額(藍) | 刪除 | 累計餘額
        var val = (e._fbKey||e.id).toString();
        var delBtn = "<button class='btn-red' onclick=\"deleteAgentWallet('" + agent + "','" + val + "')\">刪除</button>";
        tr2.innerHTML = "<td>" + e.date + "</td><td style='color:#58a6ff;font-weight:700;'>存入" + (e.note?"："+e.note:"") + "</td><td class='num'></td><td class='num' style='color:#58a6ff;font-weight:700;'>+" + fmt(e.amount) + "</td><td>" + delBtn + "</td><td class='num' style='font-weight:700;'>" + fmt(Math.max(0, running)) + "</td><td></td>";
      } else if (e.rowType === "aw_cash_dep") {
        // 自存現金行：日期 | 自存現金(橙) | | +金額(橙) | 刪除 | 累計餘額
        var val = (e._fbKey||e.id).toString();
        var delBtn = "<button class='btn-red' onclick=\"deleteAgentWallet('" + agent + "','" + val + "')\">刪除</button>";
        tr2.innerHTML = "<td>" + e.date + "</td><td style='color:#e67e22;font-weight:700;'>自存現金" + (e.note?"："+e.note:"") + "</td><td class='num'></td><td class='num' style='color:#e67e22;font-weight:700;'>+" + fmt(e.amount) + "</td><td>" + delBtn + "</td><td class='num' style='font-weight:700;'>" + fmt(Math.max(0, running)) + "</td><td></td>";
      } else if (e.rowType === "cash") {
        // 現金寄放行：日期 | 現金寄放(橙) | | +金額(橙) | 自動 | 累計餘額
        tr2.innerHTML = "<td>" + e.date + "</td><td style='color:#e67e22;font-weight:700;'>現金寄放" + (e.client?"："+e.client:"") + "</td><td class='num'></td><td class='num' style='color:#e67e22;font-weight:700;'>+" + fmt(e.bonus) + "</td><td><span style='color:#6e7681;font-size:11px;'>自動</span></td><td class='num' style='font-weight:700;'>" + fmt(Math.max(0, running)) + "</td><td></td>";
      } else {
        // 入帳行：日期 | 地點(客戶) | 轉碼數 | 碼糧 | 自動 | 累計餘額
        var volStr = e.volume > 0 ? e.volume.toLocaleString() + "萬" : "";
        tr2.innerHTML = "<td>" + e.date + "</td><td>" + (e.venue||"") + "(" + (e.client||"") + ")</td><td class='num'>" + volStr + "</td><td class='num' style='color:var(--gold-light);'>" + fmt(e.bonus) + "</td><td><span style='color:#6e7681;font-size:11px;'>自動</span></td><td class='num' style='font-weight:700;'>" + fmt(Math.max(0, running)) + "</td><td></td>";
      }
      tbody.appendChild(tr2);
    }
    // 合計行
    var totalRow = document.createElement("tr");
    totalRow.style.cssText = "background:rgba(22,27,34,0.8);font-weight:700;color:var(--gold-light);";
    totalRow.innerHTML = "<td></td><td style='color:#e6edf3;'>合計</td><td class='num'></td><td class='num'></td><td></td><td class='num' style='font-size:15px;'>" + fmt(Math.max(0, running)) + "</td><td></td>";
    tbody.appendChild(totalRow);
  }
  } catch(e) {
    console.error('[doQuery] error:', e);
    showToast('查詢失敗：' + (e.message||e), 'error');
  }
}


function exportCSV() {
  var csv = "\uFEFF類型,日期,星期,代理,客戶,地點,洗碼量,碼佣率,佣金總額,代理碼糧,已提領,未提領,公基金,寄放金額,備註\n";
  for (var i = 0; i < txs.length; i++) {
    var t = txs[i];
    csv += [t.type||"rolling", t.date || "", t.dow || "", t.agent || "", t.client || "", t.venue || "", t.volume || 0, t.rate || 0, t.comm || 0, t.bonus || 0, t.drawn || 0, t.undrawn || 0, t.fund || 0, t.cash || 0, t.note || ""].join(",") + "\n";
  }
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "洗碼報表.csv";
  a.click();
}

function importCSV(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var lines = ev.target.result.split("\n").map(function(l) { return l.trim(); }).filter(function(l) { return l; });
      if (lines.length < 2) { showToast("無資料","info"); return; }
      var header = lines[0].split(",").map(function(h) { return h.replace(/\uFEFF/g, "").trim(); });
      function findIdx(names) {
        for (var n = 0; n < names.length; n++)
          for (var j = 0; j < header.length; j++)
            if (header[j].indexOf(names[n]) !== -1) return j;
        return -1;
      }
      var di = findIdx(["日期","date"]), ai = findIdx(["代理","agent"]), ci = findIdx(["客戶","client"]);
      var vi = findIdx(["洗碼量","volume","金額"]), ri = findIdx(["碼佣率","rate","％","%"]);
      var bi = findIdx(["代理碼糧","碼糧","bonus"]), dri = findIdx(["已提領","drawn"]);
      var ti = findIdx(["類型","type"]), cai = findIdx(["寄放金額","cash"]), noi = findIdx(["備註","note"]);
      var count = 0;
      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(",");
        if (cols.length < 2) continue;
        var type = ti !== -1 ? cols[ti].trim() : "rolling";
        var cashVal = cai !== -1 ? toNum(cols[cai]) : 0;
        var note = noi !== -1 ? cols[noi].trim() : "";
        if (type === "cash") {
          txs.push({
            id: nextId++, date: di !== -1 ? cols[di].trim() : nowStr(),
            dow: di !== -1 ? getDow(cols[di].trim()) : getDow(nowStr()),
            type: "cash", agent: ai !== -1 ? cols[ai].trim() : "",
            client: "", venue: "", volume: 0, rate: 0,
            comm: 0, bonus: 0, drawn: 0, undrawn: 0, fund: 0,
            cash: cashVal, note: note
          });
          count++;
          continue;
        }
        var vol = toNum(cols[vi !== -1 ? vi : 4]);
        var rate = ri !== -1 ? toNum(cols[ri]) : 1.24;
        if (rate > 10) rate = rate / 100;
        var comm = calcComm(vol, rate);
        var bonus = bi !== -1 ? toNum(cols[bi]) : comm;
        var drawn = dri !== -1 ? toNum(cols[dri]) : 0;
        txs.push({
          id: nextId++,
          date: di !== -1 ? cols[di].trim() : nowStr(),
          dow: di !== -1 ? getDow(cols[di].trim()) : getDow(nowStr()),
          type: "rolling",
          agent: ai !== -1 ? cols[ai].trim() : "",
          client: ci !== -1 ? cols[ci].trim() : "",
          venue: "",
          volume: vol,
          rate: rate,
          comm: comm,
          bonus: bonus,
          drawn: drawn,
          undrawn: Math.max(0, bonus - drawn),
          fund: calcFund(comm, bonus),
          cash: cashVal,
          note: note
        });
        count++;
      }
      saveData(true);
      renderAll();
      renderOverview();
      renderSummary();
      showToast("已匯入 " + count + " 筆！","success");
    } catch(err) { showToast("匯入失敗：" + err.message,"error"); }
  };
  reader.readAsText(file, "UTF-8");
  e.target.value = "";
}


// 筛选标签事件委托
document.addEventListener('click', function(e) {
  var tag = e.target.closest('.filter-tag');
  if (!tag) return;
  var venue = tag.getAttribute('data-venue');
  var action = tag.getAttribute('data-action');
  var agent = tag.getAttribute('data-agent');
  if (venue !== null && venue !== '') {
    filterByVenue(venue);
  } else if (action === 'wallet' && agent) {
    openAgentWalletModal(agent);
  }
});

var currentFilterTag = '';

function renderFilterTags() {
  var container = document.getElementById('filter-tags');
  if (!container) return;
  var agent = document.getElementById('q-agent').value;
  var html = '';
  if (!agent || agent === '__FUND__') {
    var venues = ['新濠(勵盈1)','新濠(勵盈2)','銀河(金門1)','銀河(金門8)','金沙(御匾會)','永利(永利會)','上葡京'];
    for (var i = 0; i < venues.length; i++) {
      var active = currentFilterTag === venues[i] ? ' active' : '';
      html += '<span class="filter-tag' + active + '" data-venue="' + venues[i] + '">' + venues[i] + '</span>';
    }
  } else {
    html += '<span class="filter-tag" data-action="wallet" data-agent="' + agent + '">💼 錢包異動</span>';
  }
  container.innerHTML = html;
}

function filterByVenue(venue) {
  if (currentFilterTag === venue) { currentFilterTag = ''; }
  else { currentFilterTag = venue; }
  renderFilterTags();
  doQuery();
}


// 首页 KPI 迷你卡片
function renderAllMiniKPI() {
  console.log('[KPI] renderAllMiniKPI called, txs.length=', txs.length);
  var el = document.getElementById('all-kpi-mini');
  if (!el) return;
  var now = nowStr().slice(0,7);
  var thisMonthTxs = txs.filter(function(t) { return (t.date||'').indexOf(now) === 0; });
  var totalVol = 0, totalBonus = 0, totalUndrawn = 0;
  for (var i = 0; i < thisMonthTxs.length; i++) {
    totalVol += toNum(thisMonthTxs[i].volume) || 0;
    totalBonus += thisMonthTxs[i].bonus || 0;
    totalUndrawn += Math.max(0, (thisMonthTxs[i].bonus||0) - (thisMonthTxs[i].drawn||0) + (thisMonthTxs[i].cash||0));
  }
  var totalBonusAll = 0;
  for (var i = 0; i < txs.length; i++) totalBonusAll += (txs[i].bonus||0);
  el.innerHTML =
    '<div class="kpi-mini"><div class="label">📅 本月笔数</div><div class="value" style="color:#58a6ff;">' + thisMonthTxs.length + ' 笔</div></div>' +
    '<div class="kpi-mini"><div class="label">📊 本月洗码量</div><div class="value">' + (totalVol >= 10000 ? (totalVol/10000).toFixed(1) + '億' : totalVol.toLocaleString()) + '万</div></div>' +
    '<div class="kpi-mini"><div class="label">💰 本月码粮</div><div class="value" style="color:#2dd4a0;">' + fmt(totalBonus) + '</div></div>' +
    '<div class="kpi-mini"><div class="label">⚠️ 本月未提</div><div class="value" style="color:#e67e22;">' + fmt(totalUndrawn) + '</div></div>' +
    '<div class="kpi-mini"><div class="label">📁 全部码粮</div><div class="value" style="color:var(--gold-light);">' + fmt(totalBonusAll) + '</div></div>';
}


// 状态标签
function getStatusTags(t) {
  var tags = '';
  var now = nowStr();
  var month = now.slice(0,7);
  if ((t.date||'').indexOf(month) === 0) {
    tags += '<span class="status-tag status-new">🆕 本月</span> ';
  }
  var undrawn = Math.max(0, (t.bonus||0) - (t.drawn||0) + (t.cash||0));
  if (undrawn > 0 && t.date) {
    var d = new Date(t.date);
    var n = new Date(now);
    var diff = (n - d) / (1000*60*60*24);
    if (diff > 30) {
      tags += '<span class="status-tag status-overdue">⚠️ 逾期</span> ';
    }
  }
  return tags;
}


// ===== 代理管理函数（v2.6 恢复）=====
// ===== 動態填入月份下拉選單（v11.2.3）=====
function populateMonthDropdown() {
  var sel = document.getElementById("q-month");
  if (!sel) return;
  // 保留第一個選項（全部月份）
  var first = sel.options[0];
  sel.innerHTML = "";
  sel.appendChild(first);
  // 從 txs 中取得不重複的月份
  var months = {};
  for (var i = 0; i < txs.length; i++) {
    var m = (txs[i].date || "").slice(0, 7);
    if (m) months[m] = true;
  }
  // 依月份排序（新到舊）
  var monthArr = Object.keys(months).sort().reverse();
  for (var i = 0; i < monthArr.length; i++) {
    var opt = document.createElement("option");
    opt.value = monthArr[i];
    opt.textContent = monthArr[i];
    sel.appendChild(opt);
  }
}
