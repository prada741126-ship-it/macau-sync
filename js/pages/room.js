// js/pages/room.js - v11.0
// Non-overlapping extraction

var RM = {
  bookings: [], lastId: 0, editingId: null,

  getHotelSettings: function() {
    // 優先使用 localStorage 的 HOTEL_CONFIG，如無則從 PRESET_CONFIG 生成
    var hc = (typeof HOTEL_CONFIG !== 'undefined' && HOTEL_CONFIG && HOTEL_CONFIG.length) ? HOTEL_CONFIG : [];
    if (!hc.length) { hc = (typeof PRESET_CONFIG !== 'undefined' && PRESET_CONFIG && PRESET_CONFIG.length) ? PRESET_CONFIG : []; }
    if (!hc.length) {
      return { "新濠天地摩柏斯":{ price:2000, threshold:80 }, "金沙":{ price:1900, threshold:70 } };
    }
    var s = {};
    for (var i = 0; i < HOTEL_CONFIG.length; i++) {
      var c = HOTEL_CONFIG[i];
      var key = c.casino + c.hotel;
      if (!s[key] || c.weekday > 0) {
        s[key] = { price: c.weekday || 0, threshold: c.threshold || 70 };
      }
    }
    return s;
  },

  populateHotelDropdown: function(casino) {
    var sel = document.getElementById("rm-f-hotel");
    if (!sel) return;
    sel.innerHTML = '<option value="">' + (casino ? '請選擇酒店' : '請先選擇體系') + '</option>';
    if (!casino) return;
    var config = (typeof PRESET_CONFIG !== 'undefined' && PRESET_CONFIG && PRESET_CONFIG.length) ? PRESET_CONFIG : [];
    if (!config.length) return;
    var hotels = {};
    for (var i = 0; i < config.length; i++) {
      if (config[i].casino !== casino) continue;
      var hn = config[i].hotel;
      if (!hotels[hn]) hotels[hn] = true;
    }
    var keys = Object.keys(hotels).sort(function(a, b) { return a.localeCompare(b, 'zh'); });
    for (var i = 0; i < keys.length; i++) {
      sel.innerHTML += '<option value="' + keys[i] + '">' + keys[i] + '</option>';
    }
  },

  populateRoomDropdown: function(casino, hotel) {
    var sel = document.getElementById("rm-f-room");
    if (!sel) return;
    sel.innerHTML = '<option value="">請選擇房型</option>';
    if (!casino || !hotel) return;
    var config = (typeof PRESET_CONFIG !== 'undefined' && PRESET_CONFIG && PRESET_CONFIG.length) ? PRESET_CONFIG : [];
    if (!config.length) return;
    var rooms = {};
    for (var i = 0; i < config.length; i++) {
      if (config[i].casino !== casino || config[i].hotel !== hotel) continue;
      var key = config[i].room;
      if (!rooms[key]) rooms[key] = { code: config[i].code, weekday: config[i].weekday, threshold: config[i].threshold };
    }
    var keys = Object.keys(rooms);
    for (var i = 0; i < keys.length; i++) {
      var r = rooms[keys[i]];
      sel.innerHTML += '<option value="' + keys[i] + '" data-code="' + r.code + '" data-price="' + r.weekday + '" data-threshold="' + r.threshold + '">' + keys[i] + ' (' + r.code + ')</option>';
    }
  },

  populateCasinoDropdown: function() {
    var sel = document.getElementById("rm-f-casino");
    if (!sel) return;
    sel.innerHTML = '<option value="">請選擇體系</option>';
    // 使用 PRESET_CONFIG 保持三級聯動數據一致（而非 HOTEL_CONFIG，後者可能來自 localStorage 舊快取）
    var config = (typeof PRESET_CONFIG !== 'undefined' && PRESET_CONFIG && PRESET_CONFIG.length) ? PRESET_CONFIG : [];
    var casinos = {};
    for (var i = 0; i < config.length; i++) {
      casinos[config[i].casino] = true;
    }
    var order = (typeof CASINO_ORDER !== 'undefined') ? CASINO_ORDER : ['新濠天地', '新濠影滙', '金沙', '銀河', '永利', '上葡京'];
    for (var i = 0; i < order.length; i++) {
      if (casinos[order[i]]) {
        sel.innerHTML += '<option value="' + order[i] + '">' + order[i] + '</option>';
      }
    }
  },

  onCasinoChange: function() {
    var casino = document.getElementById("rm-f-casino").value;
    // populateHotelDropdown 内部已处理「請先選擇體系」/「請選擇酒店」占位文字
    this.populateHotelDropdown(casino);
    // 清空房型和價格（酒店下拉由 populateHotelDropdown 控制）
    document.getElementById("rm-f-room").innerHTML = '<option value="">請先選擇酒店</option>';
    document.getElementById("rm-f-price").value = "";
    document.getElementById("rm-f-total").value = "";
    // 隱藏所需轉碼數顯示
    var thrRow = document.getElementById("rm-threshold-row");
    if (thrRow) thrRow.style.display = "none";
  },

  onHotelChange: function() {
    var casino = document.getElementById("rm-f-casino").value;
    var hotel = document.getElementById("rm-f-hotel").value;
    // populateRoomDropdown 内部已处理「請選擇房型」占位
    if (hotel) {
      this.populateRoomDropdown(casino, hotel);
    }
    // 清空價格（房型下拉由 populateRoomDropdown 控制）
    document.getElementById("rm-f-price").value = "";
    document.getElementById("rm-f-total").value = "";
    // 隱藏所需轉碼數顯示
    var thrRow = document.getElementById("rm-threshold-row");
    if (thrRow) thrRow.style.display = "none";
  },

  onRoomChange: function() {
    // 房型選擇後，自動填入價格、門檻、顯示所需轉碼數
    var sel = document.getElementById("rm-f-room");
    var opt = sel.options[sel.selectedIndex];
    var price = parseInt(opt.getAttribute("data-price"))||0;
    var threshold = parseInt(opt.getAttribute("data-threshold"))||70;
    document.getElementById("rm-f-price").value = price;
    // 保存當前選擇的門檻（供 saveForm 使用）
    this._currentThreshold = threshold;
    // 顯示所需轉碼數（連動顯示）
    var thrRow = document.getElementById("rm-threshold-row");
    var thrVal = document.getElementById("rm-threshold-val");
    if (thrRow && thrVal && sel.value) {
      thrRow.style.display = "flex";
      thrVal.textContent = threshold;
    }
    // 自動帶入狀態：選中代理有洗碼記錄預設免費，否則預設付費
    var now = this.nowStr().slice(0,7);
    var agent = document.getElementById("rm-f-agent").value;
    var hasRolling = false;
    for (var i=0;i<txs.length;i++) { if (txs[i].agent===agent && txs[i].date&&txs[i].date.slice(0,7)===now&&txs[i].type!=="cash") { hasRolling=true; break; } }
    var statusEl = document.getElementById("rm-f-status");
    if (statusEl) statusEl.value = hasRolling ? "免費" : "付費";
    this.calcTotal();
  },

  nowStr: function() {
    var d = new Date(); d = new Date(d.getTime() + 480*60000);
    return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");
  },
  fmt: function(n) { return Number(n||0).toLocaleString(); },

  load: function() {
    try {
      var d = localStorage.getItem("rm_bookings");
      if (d) this.bookings = JSON.parse(d);
      var l = localStorage.getItem("rm_last_id");
      if (l) this.lastId = parseInt(l)||0;
    } catch(e) { this.bookings = []; }
  },
  save: function() {
    localStorage.setItem("rm_bookings", JSON.stringify(this.bookings));
    localStorage.setItem("rm_last_id", this.lastId.toString());
    // 同步到 Firebase（延遲 300ms 確保本地資料先更新完）
    if (typeof syncUpload === 'function') setTimeout(syncUpload, 300);
  },

  populateAgentDropdown: function() {
    var sel = document.getElementById("rm-f-agent");
    if (!sel) return;
    sel.innerHTML = "<option value=''>請選擇代理</option>";
    for (var i=0; i<agentList.length; i++)
      sel.innerHTML += "<option value='"+agentList[i]+"'>"+agentList[i]+"</option>";
  },
  populateAgentFilter: function() {
    var sel = document.getElementById("rm-filter-agent");
    if (!sel) return;
    sel.innerHTML = "<option value=''>全部代理</option>";
    for (var i=0; i<agentList.length; i++)
      sel.innerHTML += "<option value='"+agentList[i]+"'>"+agentList[i]+"</option>";
  },

  populateDateSelects: function() {
    var mm1 = document.getElementById("rm-f-checkin-mm");
    var dd1 = document.getElementById("rm-f-checkin-dd");
    var mm2 = document.getElementById("rm-f-checkout-mm");
    var dd2 = document.getElementById("rm-f-checkout-dd");
    if (mm1 && mm1.options.length <= 1) {
      for (var m=1;m<=12;m++) { var o=document.createElement("option"); o.value=String(m).padStart(2,"0"); o.textContent=String(m).padStart(2,"0"); mm1.appendChild(o); }
    }
    if (dd1 && dd1.options.length <= 1) {
      for (var d=1;d<=31;d++) { var o=document.createElement("option"); o.value=String(d).padStart(2,"0"); o.textContent=String(d).padStart(2,"0"); dd1.appendChild(o); }
    }
    if (mm2 && mm2.options.length <= 1) {
      for (var m=1;m<=12;m++) { var o=document.createElement("option"); o.value=String(m).padStart(2,"0"); o.textContent=String(m).padStart(2,"0"); mm2.appendChild(o); }
    }
    if (dd2 && dd2.options.length <= 1) {
      for (var d=1;d<=31;d++) { var o=document.createElement("option"); o.value=String(d).padStart(2,"0"); o.textContent=String(d).padStart(2,"0"); dd2.appendChild(o); }
    }
  },
  openModal: function(id) {
    this.populateAgentDropdown();
    this.populateDateSelects();
    this.populateCasinoDropdown();
    this.editingId = id || null;
    // 每次開表單時隱藏轉碼數顯示（新增模式；編輯模式稍後會根據資料顯示）
    var thrRow = document.getElementById("rm-threshold-row");
    if (thrRow) thrRow.style.display = "none";
    document.getElementById("rm-modal-title").textContent = id ? "編輯訂房" : "新增訂房";
    if (id) {
      var b = this.bookings.find(function(x){ return x._fbKey===String(id) || x.id===id || x.id===parseInt(id); });
      if (!b) return;
      document.getElementById("rm-f-agent").value = b.agent;
      document.getElementById("rm-f-client").value = b.client;
      // 找出該酒店所屬的體系，並預選（從 PRESET_CONFIG 查找）
      var casino = "";
      var config = (typeof PRESET_CONFIG !== 'undefined' && PRESET_CONFIG && PRESET_CONFIG.length) ? PRESET_CONFIG : [];
      for (var i = 0; i < config.length; i++) {
        if (config[i].hotel === b.hotel) { casino = config[i].casino; break; }
      }
      // 三級聯動：體系 → 酒店 → 房型
      if (casino) {
        document.getElementById("rm-f-casino").value = casino;
        this.populateHotelDropdown(casino);
        document.getElementById("rm-f-hotel").value = b.hotel;
        this.populateRoomDropdown(casino, b.hotel);
      } else {
        this.populateHotelDropdown();
        this.populateRoomDropdown();
      }
      // 嘗試設定房型（兼容舊資料無 roomType 欄位）
      if (b.roomType) {
        try { document.getElementById("rm-f-room").value = b.roomType; } catch(e) {}
      }
      // 顯示所需轉碼數（從 PRESET_CONFIG 讀取對應門檻，或使用訂房紀錄中的值）
      if (b.roomType && casino && b.hotel) {
        var thrVal = b.threshold || 0;
        if (!thrVal) {
          for (var j = 0; j < config.length; j++) {
            if (config[j].casino === casino && config[j].hotel === b.hotel && config[j].room === b.roomType) {
              thrVal = config[j].threshold; break;
            }
          }
        }
        if (thrVal) {
          var thrRow = document.getElementById("rm-threshold-row");
          var thrValEl = document.getElementById("rm-threshold-val");
          if (thrRow) thrRow.style.display = "flex";
          if (thrValEl) thrValEl.textContent = thrVal;
          this._currentThreshold = thrVal;
        }
      }
      // 填入月日選擇方塊（不含年）
      var ciParts = (b.checkIn || b.date || "").split("-");
      if (ciParts.length >= 3) { document.getElementById("rm-f-checkin-mm").value = ciParts[1]; document.getElementById("rm-f-checkin-dd").value = ciParts[2]; }
      var coParts = (b.checkOut || b.checkout || "").split("-");
      if (coParts.length >= 3) { document.getElementById("rm-f-checkout-mm").value = coParts[1]; document.getElementById("rm-f-checkout-dd").value = coParts[2]; }
      document.getElementById("rm-f-nights").value = b.nights || "";
      document.getElementById("rm-f-price").value = b.pricePerNight;
      document.getElementById("rm-f-total").value = b.totalCost;
      document.getElementById("rm-f-status").value = b.status;
      document.getElementById("rm-f-note").value = b.note||"";
      // 恢復門檻（若舊資料無 threshold 則用房型預設）
      var th = b.threshold || 0;
      if (!th) {
        var rmSel = document.getElementById("rm-f-room");
        if (rmSel && rmSel.selectedIndex >= 0) {
          var o = rmSel.options[rmSel.selectedIndex];
          th = parseInt(o.getAttribute("data-threshold"))||70;
        }
      }
      this._editingThreshold = th;
    } else {
      document.getElementById("rm-f-agent").value = "";
      document.getElementById("rm-f-client").value = "";
      document.getElementById("rm-f-casino").value = "";
      document.getElementById("rm-f-hotel").innerHTML = '<option value="">請先選擇體系</option>';
      document.getElementById("rm-f-room").innerHTML = '<option value="">請先選擇酒店</option>';
      document.getElementById("rm-f-checkin-mm").value = "";
      document.getElementById("rm-f-checkin-dd").value = "";
      document.getElementById("rm-f-checkout-mm").value = "";
      document.getElementById("rm-f-checkout-dd").value = "";
      document.getElementById("rm-f-nights").value = "";
      document.getElementById("rm-f-price").value = "";
      document.getElementById("rm-f-total").value = "";
      document.getElementById("rm-f-status").value = "免費";
      document.getElementById("rm-f-note").value = "";
    }
    document.getElementById("rm-modal-bg").classList.add("active");
  },
  closeModal: function() {
    document.getElementById("rm-modal-bg").classList.remove("active");
    this.editingId = null;
  },

  updatePrice: function() {
    // 三級聯動模式下，價格由 onRoomChange() 自動填入
    // 此函式保留供舊邏輯相容，若已選房型則從房型讀取價格
    var roomSel = document.getElementById("rm-f-room");
    if (roomSel && roomSel.selectedIndex >= 0 && roomSel.value) {
      var opt = roomSel.options[roomSel.selectedIndex];
      document.getElementById("rm-f-price").value = opt.getAttribute("data-price")||0;
    }
    // 自動帶入狀態：選中代理有洗碼記錄預設免費，否則預設付費
    var now = this.nowStr().slice(0,7);
    var agent = document.getElementById("rm-f-agent").value;
    var hasRolling = false;
    for (var i=0;i<txs.length;i++) { if (txs[i].agent===agent && txs[i].date&&txs[i].date.slice(0,7)===now&&txs[i].type!=="cash") { hasRolling=true; break; } }
    var statusEl = document.getElementById("rm-f-status");
    if (statusEl) statusEl.value = hasRolling ? "免費" : "付費";
    this.calcTotal();
  },
  calcNights: function() {
    var cimm = document.getElementById("rm-f-checkin-mm").value;
    var cidd = document.getElementById("rm-f-checkin-dd").value;
    var comm = document.getElementById("rm-f-checkout-mm").value;
    var codd = document.getElementById("rm-f-checkout-dd").value;
    if (!cimm||!cidd||!comm||!codd) return;
    var yr = new Date().getFullYear();
    var ci = new Date(yr+"-"+cimm+"-"+cidd);
    var co = new Date(yr+"-"+comm+"-"+codd);
    if (co <= ci) co = new Date((yr+1)+"-"+comm+"-"+codd);
    var diff = Math.ceil((co-ci)/(1000*60*60*24));
    document.getElementById("rm-f-nights").value = diff>0?diff:0;
    this.calcTotal();
  },
  calcTotal: function() {
    var n = parseInt(document.getElementById("rm-f-nights").value)||0;
    var p = parseInt(document.getElementById("rm-f-price").value)||0;
    document.getElementById("rm-f-total").value = n*p;
  },

  saveForm: function() {
    var agent = document.getElementById("rm-f-agent").value;
    var client = document.getElementById("rm-f-client").value.trim();
    var casino = document.getElementById("rm-f-casino").value;
    var hotel = document.getElementById("rm-f-hotel").value;
    var roomType = document.getElementById("rm-f-room").value;
    var cimm = document.getElementById("rm-f-checkin-mm").value;
    var cidd = document.getElementById("rm-f-checkin-dd").value;
    var comm = document.getElementById("rm-f-checkout-mm").value;
    var codd = document.getElementById("rm-f-checkout-dd").value;
    if (!cimm||!cidd||!comm||!codd) { showToast("請選擇入住和退房月日","error"); return; }
    var yr = new Date().getFullYear();
    var checkIn = yr + "-" + cimm + "-" + cidd;
    var checkout = yr + "-" + comm + "-" + codd;
    var nights = parseInt(document.getElementById("rm-f-nights").value)||0;
    var price = parseInt(document.getElementById("rm-f-price").value)||0;
    var total = parseInt(document.getElementById("rm-f-total").value)||0;
    var status = document.getElementById("rm-f-status").value;
    var note = document.getElementById("rm-f-note").value.trim();
    var date = checkIn || this.nowStr();
    // 取得門檻：優先從房型下拉讀取，否則用 _currentThreshold，最後才用酒店下拉（兼容舊邏輯）
    var threshold = this._currentThreshold || 0;
    var roomSel = document.getElementById("rm-f-room");
    if (roomSel && roomSel.selectedIndex >= 0) {
      var ropt = roomSel.options[roomSel.selectedIndex];
      var t = parseInt(ropt.getAttribute("data-threshold"))||0;
      if (t) threshold = t;
    }
    if (!threshold) {
      var hoSel = document.getElementById("rm-f-hotel");
      if (hoSel && hoSel.selectedIndex >= 0) {
        var hopt = hoSel.options[hoSel.selectedIndex];
        threshold = parseInt(hopt.getAttribute("data-threshold"))||70;
      }
    }
    if (!agent||!client||!hotel||!checkIn||!checkout||nights<=0) {
      showToast("請填寫所有必填欄位（體系/酒店/房型）","error"); return;
    }
    var _k;
    if (this.editingId) {
      var idx = this.bookings.findIndex(function(x){ return x._fbKey===String(RM.editingId) || x.id===RM.editingId || x.id===parseInt(RM.editingId); });
      _k = (idx>=0 && this.bookings[idx] && this.bookings[idx]._fbKey) ? this.bookings[idx]._fbKey : _fbKey();
      if (idx>=0) this.bookings[idx] = { id:this.bookings[idx].id, _fbKey:_k, date:date, agent:agent, client:client, casino:casino, hotel:hotel, roomType:roomType, checkIn:checkIn, checkOut:checkout, nights:nights, pricePerNight:price, totalCost:total, status:status, threshold:threshold, month:date.substring(0,7), note:note };
      showToast("訂房已更新","success");
      setTimeout(function(){ showToast("同步中…", "info"); }, 350);
      setTimeout(function(){ showToast("同步成功", "success"); }, 950);
    } else {
      this.lastId++;
      _k = _fbKey();
      this.bookings.push({ id:this.lastId, _fbKey:_k, date:date, agent:agent, client:client, casino:casino, hotel:hotel, roomType:roomType, checkIn:checkIn, checkOut:checkout, nights:nights, pricePerNight:price, totalCost:total, status:status, threshold:threshold, month:date.substring(0,7), note:note });
      showToast("訂房已新增","success");
      setTimeout(function(){ showToast("同步中…", "info"); }, 350);
      setTimeout(function(){ showToast("同步成功", "success"); }, 950);
    }
    this.save();
    // v10.26 使用重試封裝直接寫入 Firebase 同步（確保即時同步）
    if (typeof db !== 'undefined' && db && _k) {
      try {
        var syncBooking = this.bookings.find(function(x){ return x._fbKey === _k; });
        if (syncBooking) _syncSet(db.ref('macau_data/rmBookings/' + _k), syncBooking);
      } catch(e) { console.error('[Sync] rmBookings set error:', e); }
    }
    this.closeModal();  // 先關閉彈窗，確保一定執行
    this.editingId = null;
    // 後台重新渲染（即使報錯也不影響彈窗關閉）
    try { this.render(); } catch(e) { console.error("RM.render error:", e); }
    try { this.updateQuota(); } catch(e) { console.error("RM.updateQuota error:", e); }
  },
  delete: function(id) {
    if (!confirm("確定要刪除這筆訂房紀錄嗎？")) return;
    var key = String(id);
    var fbKey = null;
    for (var i = 0; i < this.bookings.length; i++) {
      if (String(this.bookings[i]._fbKey)===key || this.bookings[i].id===id || this.bookings[i].id===parseInt(id)) {
        fbKey = this.bookings[i]._fbKey; break;
      }
    }
    this.bookings = this.bookings.filter(function(x){ return String(x._fbKey)!==key && x.id!==id && x.id!==parseInt(id); });
    this.save();
    // v10.26 重試封裝刪除 Firebase 記錄
    if (fbKey && typeof db !== 'undefined' && db) {
      _syncSet(db.ref('macau_data/rmBookings/' + fbKey), null);
    }
    this.render();
    this.updateQuota();
    showToast("訂房已刪除","success");
    setTimeout(function(){ showToast("同步中…", "info"); }, 350);
    setTimeout(function(){ showToast("同步成功", "success"); }, 950);
  },

  render: function() {
    var tbody = document.getElementById("rm-tbody");
    var empty = document.getElementById("rm-empty");
    if (!tbody) return;
    var month = document.getElementById("rm-filter-month").value;
    var agent = document.getElementById("rm-filter-agent").value;
    var filtered = this.bookings.slice();
    if (month) filtered = filtered.filter(function(x){ return x.month===month; });
    if (agent) filtered = filtered.filter(function(x){ return x.agent===agent; });
    filtered.sort(function(a,b){ return b.id-a.id; });
    if (!filtered.length) {
      tbody.innerHTML = "";
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";
    var html = "";
    for (var i=0; i<filtered.length; i++) {
      var b = filtered[i];
      var sc = b.status==="免費"?"free":"paid";
      html += "<tr>";
      html += "<td style='font-size:11px;color:var(--text-muted);'>"+b.date+"</td>";
      html += "<td style='color:var(--gold);font-weight:600;font-size:12px;'>"+b.agent+"</td>";
      html += "<td style='font-size:12px;'>"+b.client+"</td>";
      html += "<td style='font-size:12px;'>"+b.hotel+"</td>";
      html += "<td style='font-size:11px;color:var(--text-secondary);'>"+(b.roomType||"")+"</td>";
      html += "<td style='font-size:11px;color:var(--text-muted);'>"+b.checkIn+"</td>";
      html += "<td style='font-size:11px;color:var(--text-muted);'>"+(b.checkOut||b.checkout)+"</td>";
      html += "<td>"+b.nights+"晚</td>";
      var th = b.threshold||70;
      html += "<td style='font-family:monospace;color:var(--gold);'>"+this.fmt(b.nights * th)+"<span style='font-size:10px;color:var(--text-muted);'>萬</span></td>";
      html += "<td style='color:var(--gold);font-weight:600;font-family:monospace;'>"+this.fmt(b.totalCost)+"</td>";
      html += "<td><span class='rm-badge "+sc+"'>"+b.status+"</span></td>";
      html += "<td>";
      var btnKey = b._fbKey ? b._fbKey : b.id;
      html += "<button class='rm-btn-sm rm-btn-edit' onclick='RM.openModal(\""+btnKey+"\")'>編輯</button>";
      html += "<button class='rm-btn-sm rm-btn-del' onclick='RM.delete(\""+btnKey+"\")'>刪除</button>";
      html += "</td>";
      html += "</tr>";
    }
    tbody.innerHTML = html;
    // v10.26 檢查訂房表格滾動狀態
    setTimeout(checkTableScroll, 150);
  },
  updateQuota: function() {
    var monthEl = document.getElementById("rm-filter-month");
    if (!monthEl) return;
    var month = monthEl.value || this.nowStr().substring(0,7);
    var totalRolling = 0, now = month || this.nowStr().slice(0,7);
    for (var i = 0; i < txs.length; i++) { if (txs[i].date && txs[i].date.slice(0,7) === now && txs[i].type !== "cash") { totalRolling += (txs[i].volume || 0); } }
    // 從 hotel config 計算平均門檻（若尚未載入則用預設值 70）
    var avgThreshold = 70;
    if (typeof HOTEL_CONFIG !== 'undefined' && HOTEL_CONFIG && HOTEL_CONFIG.length > 0) {
      var sumTh = 0, cntTh = 0;
      for (var ti = 0; ti < HOTEL_CONFIG.length; ti++) { var dt = HOTEL_CONFIG[ti].threshold || 0; if (dt > 0) { sumTh += dt; cntTh++; } }
      if (cntTh > 0) avgThreshold = Math.round(sumTh / cntTh);
    }
    var totalQuota = Math.floor(totalRolling / avgThreshold);
    var usedQuota = 0;
    // 已使用免費額度：只計有洗碼記錄的代理的免費房晚
    var rmAgtRolling = {};
    for (var kk=0;kk<txs.length;kk++){ var tr=txs[kk]; if (tr.date&&tr.date.slice(0,7)===now&&tr.type!=="cash"&&tr.agent){ rmAgtRolling[tr.agent]=true; } }
    for (var i=0; i<this.bookings.length; i++)
      if (this.bookings[i].month===month && this.bookings[i].status==="免費" && rmAgtRolling[this.bookings[i].agent])
        usedQuota += (this.bookings[i].nights||0);
    // 已使用轉碼數（所有免費房晚 × 門檻）
    var rmUsedRolling = 0;
    for (var j=0; j<this.bookings.length; j++)
      if (this.bookings[j].month===month && this.bookings[j].status==="免費")
        rmUsedRolling += (this.bookings[j].nights||0) * (this.bookings[j].threshold||70);
    // 額度使用率 = 已用轉碼數 / 總洗碼量 × 100%
    var pct = totalRolling>0 ? Math.min(100, Math.round(rmUsedRolling/totalRolling*100)) : 0;

    var rollingEl = document.getElementById("rm-q-rolling");
    if (rollingEl) rollingEl.innerHTML = this.fmt(totalRolling)+"<span>萬</span>";
    var usedEl = document.getElementById("rm-q-used-hero");
    if (usedEl) usedEl.innerHTML = this.fmt(rmUsedRolling)+"<span>萬</span>";
    // 剩餘轉碼數 = 本月總洗碼量 - 已使用轉碼數（可為負數）
    var rmRemaining = totalRolling - rmUsedRolling;
    var rollingEl2 = document.getElementById("rm-q-used-rolling");
    if (rollingEl2) rollingEl2.innerHTML = this.fmt(rmRemaining)+"<span>萬</span>";

    var fill = document.getElementById("rm-progress");
    if (fill) {
      fill.style.width = pct+"%";
      fill.className = "rm-dash-bar-fill" + (pct>=90?" danger":pct>=70?" warn":"");
    }
    var pctEl = document.getElementById("rm-progress-pct");
    if (pctEl) pctEl.textContent = pct+"%";
    // 更新統計摘要
    var statTotal = 0;
    for (var si = 0; si < this.bookings.length; si++) {
      if (this.bookings[si].month === month) {
        statTotal++;
      }
    }
    var elTotal = document.getElementById("rm-stat-total");
    if (elTotal) elTotal.textContent = statTotal;
    // 更新每日訂房長條圖
    var chartEl = document.getElementById("rm-chart");
    if (chartEl) {
      var ym = month; // "2026-06"
      var daysInMonth = new Date(parseInt(ym.slice(0,4)), parseInt(ym.slice(5,7)), 0).getDate();
      var dayCounts = {};
      for (var di = 1; di <= daysInMonth; di++) dayCounts[di] = 0;
      for (var bi = 0; bi < this.bookings.length; bi++) {
        var b = this.bookings[bi];
        if (b.month !== month) continue;
        var parts = (b.checkIn || "").split("-");
        var day = parseInt(parts[1]) || 0;
        if (day >= 1 && day <= daysInMonth) dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
      var maxCount = 0;
      for (var di = 1; di <= daysInMonth; di++) maxCount = Math.max(maxCount, dayCounts[di]);
      if (maxCount === 0) maxCount = 1;
      var barHtml = "";
      for (var di = 1; di <= daysInMonth; di++) {
        var cnt = dayCounts[di] || 0;
        var h = Math.max(3, Math.round(cnt / maxCount * 60));
        barHtml += '<div class="rm-chart-bar" style="height:' + h + 'px;" title="' + di + '日: ' + cnt + '筆"></div>';
      }
      chartEl.innerHTML = barHtml;
      // 日期標籤
      var labelHtml = "";
      for (var di = 1; di <= daysInMonth; di++) {
        if (di === 1 || di === daysInMonth || di % 5 === 0) {
          labelHtml += '<span style="position:absolute;left:' + ((di-1)/daysInMonth*100) + '%;">' + di + '</span>';
        }
      }
      var parent = chartEl.parentNode;
      var oldLabel = parent.querySelector(".rm-chart-label");
      if (!oldLabel) {
        oldLabel = document.createElement("div");
        oldLabel.className = "rm-chart-label";
        parent.appendChild(oldLabel);
      }
      oldLabel.innerHTML = labelHtml;
    }
  },
  exportCSV: function() {
    var monthEl = document.getElementById("rm-filter-month");
    var month = monthEl ? monthEl.value : "";
    var filtered = this.bookings.slice();
    if (month) filtered = filtered.filter(function(x){ return x.month===month; });
    var csv = "\uFEFF日期,代理,客戶,體系,酒店,房型,入住日期,退房日期,天數,每晚單價,所需轉碼門檻,總費用,狀態,備註\n";
    for (var i=0; i<filtered.length; i++) {
      var b = filtered[i];
      csv += [b.date,b.agent,b.client,(b.casino||""),b.hotel,(b.roomType||""),b.checkIn,(b.checkOut||b.checkout),b.nights,b.pricePerNight,(b.threshold||70),b.totalCost,b.status,b.note].join(",")+"\n";
    }
    var blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "room_"+ (month||"all")+".csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV 已匯出","success");
  },
  importCSV: function() {
    var inp = document.getElementById("rm-file-input");
    if (inp) inp.click();
  },
  handleImport: function(e) {
    var file = e.target.files[0]; if (!file) return;
    var self = this;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var lines = ev.target.result.split("\n").filter(function(x){ return x.trim(); });
      if (lines.length<2) { showToast("CSV 無資料","error"); return; }
      // 檢測標頭是否包含「體系」或「房型」（新格式 v7.5+）
      var header = lines[0].trim();
      var hasNewFormat = header.indexOf("體系") >= 0 || header.indexOf("房型") >= 0;
      var imported = 0;
      for (var i=1; i<lines.length; i++) {
        var cols = lines[i].split(",");
        if (cols.length<10) continue;
        self.lastId++;
        if (hasNewFormat && cols.length >= 14) {
          // 新格式：日期,代理,客戶,體系,酒店,房型,入住,退房,天數,單價,門檻,總費用,狀態,備註
          self.bookings.push({ id:self.lastId, date:cols[0]||self.nowStr(), agent:cols[1]||"", client:cols[2]||"", casino:cols[3]||"", hotel:cols[4]||"", roomType:cols[5]||"", checkIn:cols[6]||"", checkOut:cols[7]||"", nights:parseInt(cols[8])||0, pricePerNight:parseInt(cols[9])||0, threshold:parseInt(cols[10])||70, totalCost:parseInt(cols[11])||0, status:cols[12]||"免費", month:(cols[0]||self.nowStr()).substring(0,7), note:cols[13]||"" });
        } else {
          // 舊格式：日期,代理,客戶,酒店,入住,退房,天數,單價,門檻,總費用,狀態,備註
          self.bookings.push({ id:self.lastId, date:cols[0]||self.nowStr(), agent:cols[1]||"", client:cols[2]||"", casino:"", hotel:cols[3]||"", roomType:"", checkIn:cols[4]||"", checkOut:cols[5]||"", nights:parseInt(cols[6])||0, pricePerNight:parseInt(cols[7])||0, threshold:parseInt(cols[8])||70, totalCost:parseInt(cols[9])||0, status:cols[10]||"免費", month:(cols[0]||self.nowStr()).substring(0,7), note:cols[11]||"" });
        }
        imported++;
      }
      self.save(); self.render(); self.updateQuota();
      showToast("已匯入 "+imported+" 筆","success");
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  },

  init: function() {
    this.load();
    this.populateAgentDropdown();
    this.populateAgentFilter();
    this.populateCasinoDropdown();
    var monthEl = document.getElementById("rm-filter-month");
    if (monthEl) monthEl.value = this.nowStr().substring(0,7);
    this.render();
    this.updateQuota();
  }
};

// 全域函式（供 HTML onclick 呼叫）
function rmOpenModal(id){ RM.openModal(id||null); }
function rmCloseModal(){ RM.closeModal(); }
function rmUpdatePrice(){ RM.updatePrice(); }
function rmOnCasinoChange(){ RM.onCasinoChange(); }
function rmOnHotelChange(){ RM.onHotelChange(); }
function rmOnRoomChange(){ RM.onRoomChange(); }
function rmCalcNights(){ RM.calcNights(); }
function rmOnDateChange(){ RM.calcNights(); }
function rmCalcTotal(){ RM.calcTotal(); }
function rmSaveForm(){ RM.saveForm(); }
function rmRender(){ RM.render(); }
function rmExportCSV(){ RM.exportCSV(); }
function rmImportCSV(){ RM.importCSV(); }
function rmHandleImport(e){ RM.handleImport(e); }

// 啟動房務系統
RM.init();

// ===== 房務頁籤切換 =====