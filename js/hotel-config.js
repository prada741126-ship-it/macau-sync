// js/hotel-config.js - v11.0 module
// Extracted from monolithic index.html

var PRESET_CONFIG = [
  // ===== 新濠天地 =====
  { casino:"新濠天地", hotel:"摩珀斯", code:"MPPK", room:"摩珀斯客房(大床)", weekday:1500, weekend:1800, special:2700, threshold:80 },
  { casino:"新濠天地", hotel:"摩珀斯", code:"MPPK", room:"摩珀斯套房(雙床)", weekday:1500, weekend:1800, special:2700, threshold:80 },
  { casino:"新濠天地", hotel:"摩珀斯", code:"MPT",  room:"摩珀斯豪華套房", weekday:2700, weekend:3000, special:4200, threshold:150 },
  { casino:"新濠天地", hotel:"摩珀斯", code:"MCPT", room:"摩珀斯2房奢房", weekday:4200, weekend:4500, special:6000, threshold:350 },
  { casino:"新濠天地", hotel:"摩珀斯", code:"MPS",  room:"摩珀斯3房奢房", weekday:6000, weekend:6500, special:8000, threshold:1000 },
  { casino:"新濠天地", hotel:"摩珀斯", code:"MES",  room:"摩珀斯總統套房", weekday:10000, weekend:11000, special:13000, threshold:3000 },
  { casino:"新濠天地", hotel:"頣居", code:"NPX",  room:"頣居客房(大床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"新濠天地", hotel:"頣居", code:"NPXV", room:"頣居套房(樓床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"新濠天地", hotel:"頣居", code:"NPQV", room:"頣居豪華套房", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"新濠天地", hotel:"頣居", code:"NDS",  room:"頣居套房", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"新濠天地", hotel:"頣居", code:"NCDS", room:"頣居豪華套房", weekday:3000, weekend:3300, special:4500, threshold:300 },
  { casino:"新濠天地", hotel:"頣居", code:"NPS",  room:"頣居2房奢房", weekday:6000, weekend:6500, special:8000, threshold:3000 },
  { casino:"新濠天地", hotel:"頣居", code:"NPSV", room:"頣居2房套間", weekday:8000, weekend:8500, special:10000, threshold:3000 },
  { casino:"新濠天地", hotel:"君悅", code:"KING",  room:"君悅客房(大床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"新濠天地", hotel:"君悅", code:"TWIN",  room:"君悅客房(雙床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"新濠天地", hotel:"君悅", code:"DLXX",  room:"君悅豪華套房(大床)", weekday:1890, weekend:2000, special:3900, threshold:180 },
  { casino:"新濠天地", hotel:"君悅", code:"DLXT",  room:"君悅豪華套房(雙床)", weekday:1850, weekend:2000, special:3900, threshold:150 },
  { casino:"新濠天地", hotel:"君悅", code:"CLDK",  room:"君悅套房(大床)", weekday:3000, weekend:3200, special:4500, threshold:300 },
  { casino:"新濠天地", hotel:"君悅", code:"CLDT",  room:"君悅套房(雙床)", weekday:3000, weekend:3200, special:4500, threshold:300 },
  { casino:"新濠天地", hotel:"君悅", code:"GRSK",  room:"君悅行政奢房", weekday:4500, weekend:5000, special:6550, threshold:1000 },
  { casino:"新濠天地", hotel:"君悅", code:"QRXS",  room:"君悅行政套房", weekday:6000, weekend:6500, special:8000, threshold:3000 },
  { casino:"新濠天地", hotel:"君悅", code:"PREM",  room:"君悅總統套房", weekday:10000, weekend:11000, special:13000, threshold:3000 },
  { casino:"新濠天地", hotel:"君悅", code:"DIPL",  room:"君悅外交官奢房", weekday:15000, weekend:16000, special:18000, threshold:3000 },
  { casino:"新濠天地", hotel:"君悅", code:"PRES",  room:"君悅總統奢房", weekday:20000, weekend:22000, special:26000, threshold:3000 },
  { casino:"新濠天地", hotel:"君悅", code:"CHHN",  room:"君悅主席套房", weekday:30000, weekend:32000, special:35000, threshold:3000 },
  // ===== 新濠影滙 =====
  { casino:"新濠影滙", hotel:"明星滙", code:"CRX", room:"明星滙客房", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"新濠影滙", hotel:"明星滙", code:"CRT", room:"明星滙套房(大床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"新濠影滙", hotel:"明星滙", code:"CDX", room:"明星滙豪華套房", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"新濠影滙", hotel:"明星滙", code:"CDT", room:"明星滙豪華套房(雙床)", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"新濠影滙", hotel:"明星滙", code:"CSS", room:"明星滙奢房", weekday:3000, weekend:3200, special:4500, threshold:300 },
  { casino:"新濠影滙", hotel:"明星滙", code:"SDX", room:"明星滙豪華奢房", weekday:4500, weekend:5000, special:6500, threshold:1000 },
  { casino:"新濠影滙", hotel:"巨星滙", code:"STGD", room:"巨星滙客房", weekday:1500, weekend:1800, special:2700, threshold:80 },
  { casino:"新濠影滙", hotel:"巨星滙", code:"STGT", room:"巨星滙套房", weekday:1500, weekend:1800, special:2700, threshold:80 },
  { casino:"新濠影滙", hotel:"巨星滙", code:"SGDL", room:"巨星滙豪華套房", weekday:2700, weekend:3000, special:4200, threshold:150 },
  { casino:"新濠影滙", hotel:"巨星滙", code:"SGDT", room:"巨星滙豪華套房(雙床)", weekday:2700, weekend:3000, special:4200, threshold:150 },
  { casino:"新濠影滙", hotel:"巨星滙", code:"SGSS", room:"巨星滙奢房", weekday:4200, weekend:4500, special:6000, threshold:350 },
  { casino:"新濠影滙", hotel:"巨星滙", code:"SGXS", room:"巨星滙豪華奢房", weekday:6000, weekend:6500, special:8000, threshold:1000 },
  { casino:"新濠影滙", hotel:"映星滙", code:"ESHK", room:"映星滙客房(大床)", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"新濠影滙", hotel:"映星滙", code:"ESHT", room:"映星滙客房(雙床)", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"新濠影滙", hotel:"映星滙", code:"ESDL", room:"映星滙豪華套房", weekday:3000, weekend:3200, special:4500, threshold:300 },
  { casino:"新濠影滙", hotel:"映星滙", code:"ESDT", room:"映星滙豪華套房(雙床)", weekday:3000, weekend:3200, special:4500, threshold:300 },
  { casino:"新濠影滙", hotel:"映星滙", code:"ESXS", room:"映星滙奢房", weekday:4500, weekend:5000, special:6500, threshold:1000 },
  { casino:"新濠影滙", hotel:"映星滙", code:"ESPS", room:"映星滙總統套房", weekday:10000, weekend:11000, special:13000, threshold:3000 },
  // ===== 金沙 =====
  { casino:"金沙", hotel:"御園", code:"GYK", room:"御園客房(大床)", weekday:2000, weekend:2300, special:3500, threshold:200 },
  { casino:"金沙", hotel:"御園", code:"GYDL", room:"御園豪華套房", weekday:3500, weekend:3800, special:5000, threshold:350 },
  { casino:"金沙", hotel:"倫敦人", code:"LNK", room:"倫敦人客房(大床)", weekday:1500, weekend:1800, special:2700, threshold:80 },
  { casino:"金沙", hotel:"倫敦人", code:"LNDL", room:"倫敦人豪華套房", weekday:2700, weekend:3000, special:4200, threshold:150 },
  { casino:"金沙", hotel:"倫敦人名滙", code:"LNHK", room:"倫敦人名滙客房(大床)", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"金沙", hotel:"倫敦人名滙", code:"LNHD", room:"倫敦人名滙豪華套房", weekday:3000, weekend:3200, special:4500, threshold:300 },
  // ===== 銀河 =====
  { casino:"銀河", hotel:"銀河酒店", code:"GXK", room:"銀河客房(大床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"銀河", hotel:"銀河酒店", code:"GXT", room:"銀河客房(雙床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"銀河", hotel:"銀河酒店", code:"GXDL", room:"銀河豪華套房", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"銀河", hotel:"JW萬豪", code:"JWK", room:"JW萬豪客房(大床)", weekday:1500, weekend:1800, special:2700, threshold:80 },
  { casino:"銀河", hotel:"JW萬豪", code:"JWDL", room:"JW萬豪豪華套房", weekday:2700, weekend:3000, special:4200, threshold:150 },
  { casino:"銀河", hotel:"麗思卡爾頓", code:"RCK", room:"麗思卡爾頓客房", weekday:2000, weekend:2300, special:3500, threshold:200 },
  { casino:"銀河", hotel:"麗思卡爾頓", code:"RCDL", room:"麗思卡爾頓豪華套房", weekday:3500, weekend:3800, special:5000, threshold:350 },
  { casino:"銀河", hotel:"麗思卡爾頓", code:"RCPS", room:"麗思卡爾頓總統套房", weekday:15000, weekend:16000, special:18000, threshold:200 },
  // ===== 永利 =====
  { casino:"永利", hotel:"永利澳門", code:"WYK", room:"永利客房(大床)", weekday:1500, weekend:1800, special:2700, threshold:80 },
  { casino:"永利", hotel:"永利澳門", code:"WYDL", room:"永利豪華套房", weekday:2700, weekend:3000, special:4200, threshold:150 },
  { casino:"永利", hotel:"永利皇宮", code:"WPK", room:"永利皇宮客房(大床)", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"永利", hotel:"永利皇宮", code:"WPDL", room:"永利皇宮豪華套房", weekday:3000, weekend:3200, special:4500, threshold:300 },
  // ===== 上葡京 =====
  { casino:"上葡京", hotel:"上葡京酒店", code:"GPK", room:"上葡京客房(大床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"上葡京", hotel:"上葡京酒店", code:"GPT", room:"上葡京客房(雙床)", weekday:1200, weekend:1500, special:2200, threshold:80 },
  { casino:"上葡京", hotel:"上葡京酒店", code:"GPDL", room:"上葡京豪華套房", weekday:1800, weekend:2000, special:3000, threshold:180 },
  { casino:"上葡京", hotel:"老佛爺", code:"KLK", room:"老佛爺客房(大床)", weekday:2000, weekend:2300, special:3500, threshold:200 },
  { casino:"上葡京", hotel:"老佛爺", code:"KLDL", room:"老佛爺豪華套房", weekday:3500, weekend:3800, special:5000, threshold:350 }
];

var CASINO_ORDER = ['新濠天地', '新濠影滙', '金沙', '銀河', '永利', '上葡京'];

// ===== 酒店設定全局狀態 =====
var HOTEL_CONFIG = [];
var hcEditIdx = -1;
var hcPendingQuick = null;
var hcInitDone = false;

function initHC() {
  if (hcInitDone) {
    // 已初始化過，只刷新表格
    hcPopulateFilters();
    hcRenderTable();
    return;
  }
  hcInitDone = true;
  loadHCConfig();
  hcPopulateFilters();
  hcRenderTable();
}

function loadHCConfig() {
  try {
    var saved = localStorage.getItem('macau_hotel_config_v7');
    if (saved) {
      HOTEL_CONFIG = JSON.parse(saved);
      for (var i = 0; i < HOTEL_CONFIG.length; i++) {
        var c = HOTEL_CONFIG[i];
        if (c.code === undefined) c.code = '';
        if (c.weekday === undefined) c.weekday = 0;
        if (c.weekend === undefined) c.weekend = 0;
        if (c.special === undefined) c.special = 0;
      }
    }
  } catch(e) {}
  if (!HOTEL_CONFIG || HOTEL_CONFIG.length === 0) {
    HOTEL_CONFIG = JSON.parse(JSON.stringify(PRESET_CONFIG));
    saveHCConfig();
  }
}

function saveHCConfig() {
  localStorage.setItem('macau_hotel_config_v7', JSON.stringify(HOTEL_CONFIG));
  // 同步到 Firebase
  if (typeof syncUpload === 'function') setTimeout(syncUpload, 300);
}

function hcGetCasinos() {
  var set = {};
  for (var i = 0; i < HOTEL_CONFIG.length; i++) set[HOTEL_CONFIG[i].casino] = true;
  return Object.keys(set).sort(function(a, b) {
    var ia = CASINO_ORDER.indexOf(a), ib = CASINO_ORDER.indexOf(b);
    if (ia === -1) ia = 999; if (ib === -1) ib = 999;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b, 'zh');
  });
}

function hcGetHotels(casino) {
  var set = {};
  for (var i = 0; i < HOTEL_CONFIG.length; i++) {
    if (!casino || HOTEL_CONFIG[i].casino === casino) set[HOTEL_CONFIG[i].hotel] = true;
  }
  return Object.keys(set).sort();
}

function hcPopulateFilters() {
  var casinos = hcGetCasinos();
  var sel1 = document.getElementById('hc-filter-casino');
  if (!sel1) return;
  sel1.innerHTML = '<option value="">全部體系</option>';
  for (var i = 0; i < casinos.length; i++) sel1.innerHTML += '<option value="' + casinos[i] + '">' + casinos[i] + '</option>';
  var hotels = hcGetHotels();
  var sel2 = document.getElementById('hc-filter-hotel');
  if (!sel2) return;
  sel2.innerHTML = '<option value="">全部酒店</option>';
  for (var i = 0; i < hotels.length; i++) sel2.innerHTML += '<option value="' + hotels[i] + '">' + hotels[i] + '</option>';
}

function hcFilter() {
  var casino = document.getElementById('hc-filter-casino').value;
  var hotel = document.getElementById('hc-filter-hotel').value;
  // 更新酒店下拉選單
  if (casino) {
    var hotels = hcGetHotels(casino);
    var sel2 = document.getElementById('hc-filter-hotel');
    sel2.innerHTML = '<option value="">全部酒店</option>';
    for (var i = 0; i < hotels.length; i++) sel2.innerHTML += '<option value="' + hotels[i] + '">' + hotels[i] + '</option>';
  }
  hcRenderTable(casino || null, hotel || null);
}

function hcRenderTable(filterCasino, filterHotel) {
  var tbody = document.getElementById('hc-tbody');
  if (!tbody) return;
  var searchText = '';
  try { searchText = (document.getElementById('hc-search').value || '').trim().toLowerCase(); } catch(e) {}
  var filtered = [];
  for (var j = 0; j < HOTEL_CONFIG.length; j++) {
    var c = HOTEL_CONFIG[j];
    if (filterCasino && c.casino !== filterCasino) continue;
    if (filterHotel && c.hotel !== filterHotel) continue;
    if (searchText) {
      var hay = (c.casino + ' ' + c.hotel + ' ' + c.room + ' ' + (c.code||'')).toLowerCase();
      if (hay.indexOf(searchText) === -1) continue;
    }
    filtered.push({ c: c, idx: j });
  }
  filtered.sort(function(a, b) {
    var ca = a.c, cb = b.c;
    if (ca.casino !== cb.casino) {
      var ia = CASINO_ORDER.indexOf(ca.casino), ib = CASINO_ORDER.indexOf(cb.casino);
      if (ia === -1) ia = 999; if (ib === -1) ib = 999;
      if (ia !== ib) return ia - ib;
      return ca.casino.localeCompare(cb.casino, 'zh');
    }
    if (ca.hotel !== cb.hotel) return ca.hotel.localeCompare(cb.hotel, 'zh');
    return ca.room.localeCompare(cb.room, 'zh');
  });
  var countEl = document.getElementById('hc-count');
  if (countEl) countEl.textContent = '共 ' + filtered.length + ' 項';
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">尚無配置，請點「＋ 新增房型」或「🔄 重置」</td></tr>';
  } else {
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i].c, idx = filtered[i].idx;
      html += '<tr>' +
        '<td>' + escHtml(c.casino || '') + '</td>' +
        '<td>' + escHtml(c.hotel || '') + '</td>' +
        '<td class="hc-code">' + escHtml(c.code || '') + '</td>' +
        '<td>' + escHtml(c.room || '') + '</td>' +
        '<td style="white-space:nowrap;text-align:center;">' +
          '<button class="btn btn-gold btn-sm" onclick="hcOpenModal(' + idx + ')">編輯</button> ' +
          '<button class="btn btn-red btn-sm" onclick="hcDelete(' + idx + ')">✕</button>' +
        '</td></tr>';
    }
    tbody.innerHTML = html;
  }
}

function hcOpenModal(idx) {
  hcEditIdx = (idx !== undefined && idx >= 0) ? idx : -1;
  var sel1 = document.getElementById('hc-em-casino');
  var casinos = hcGetCasinos();
  sel1.innerHTML = '<option value="">請選擇體系</option>';
  for (var i = 0; i < casinos.length; i++) sel1.innerHTML += '<option value="' + casinos[i] + '">' + casinos[i] + '</option>';
  var sel2 = document.getElementById('hc-em-hotel');
  sel2.innerHTML = '<option value="">請先選體系</option>';
  var title = document.getElementById('hc-modal-title');
  if (hcEditIdx >= 0) {
    title.textContent = '編輯房型';
    var c = HOTEL_CONFIG[hcEditIdx];
    if (!c) return;
    sel1.value = c.casino || '';
    hcOnCasinoChange();
    document.getElementById('hc-em-hotel').value = c.hotel || '';
    document.getElementById('hc-em-code').value = c.code || '';
    document.getElementById('hc-em-room').value = c.room || '';
    document.getElementById('hc-em-weekday').value = c.weekday || '';
    document.getElementById('hc-em-weekend').value = c.weekend || '';
    document.getElementById('hc-em-special').value = c.special || '';
    document.getElementById('hc-em-threshold').value = c.threshold || '';
  } else {
    title.textContent = '新增房型';
    document.getElementById('hc-em-code').value = '';
    document.getElementById('hc-em-room').value = '';
    document.getElementById('hc-em-weekday').value = '';
    document.getElementById('hc-em-weekend').value = '';
    document.getElementById('hc-em-special').value = '';
    document.getElementById('hc-em-threshold').value = '';
  }
  document.getElementById('hc-modal-bg').classList.add('active');
}

function hcOnCasinoChange() {
  var casinoVal = document.getElementById('hc-em-casino').value;
  var sel = document.getElementById('hc-em-hotel');
  if (!casinoVal) { sel.innerHTML = '<option value="">請先選體系</option>'; return; }
  var hotels = hcGetHotels(casinoVal);
  sel.innerHTML = '<option value="">請選擇酒店</option>';
  for (var i = 0; i < hotels.length; i++) sel.innerHTML += '<option value="' + hotels[i] + '">' + hotels[i] + '</option>';
}

function hcCloseModal() {
  document.getElementById('hc-modal-bg').classList.remove('active');
  hcEditIdx = -1;
}

function hcSaveModal() {
  var casino = document.getElementById('hc-em-casino').value;
  var hotel = document.getElementById('hc-em-hotel').value;
  var code = document.getElementById('hc-em-code').value.trim();
  var room = document.getElementById('hc-em-room').value.trim();
  var weekday = parseFloat(document.getElementById('hc-em-weekday').value) || 0;
  var weekend = parseFloat(document.getElementById('hc-em-weekend').value) || 0;
  var special = parseFloat(document.getElementById('hc-em-special').value) || 0;
  var threshold = parseFloat(document.getElementById('hc-em-threshold').value) || 0;
  if (!casino || !hotel || !room) { showToast('請填寫體系、酒店、房型', 'error'); return; }
  var item = { casino: casino, hotel: hotel, code: code, room: room, weekday: weekday, weekend: weekend, special: special, threshold: threshold };
  if (hcEditIdx >= 0) {
    HOTEL_CONFIG[hcEditIdx] = item;
  } else {
    HOTEL_CONFIG.push(item);
  }
  saveHCConfig();
  hcPopulateFilters();
  hcRenderTable();
  hcCloseModal();
  showToast(hcEditIdx >= 0 ? '已更新' : '已新增', 'success');
}

function hcDelete(idx) {
  var c = HOTEL_CONFIG[idx];
  if (!c) return;
  if (!confirm('確定刪除 ' + c.casino + ' / ' + c.hotel + ' / ' + c.room + ' ？')) return;
  HOTEL_CONFIG.splice(idx, 1);
  saveHCConfig();
  hcPopulateFilters();
  hcRenderTable();
  showToast('已刪除', 'info');
}

function hcReset() {
  if (!confirm('確定要重置酒店配置嗎？\n手動新增的項目會被保留（不重複），但修改過的門檻會恢復預設值。')) return;
  var presetMap = {};
  for (var i = 0; i < PRESET_CONFIG.length; i++) {
    var p = PRESET_CONFIG[i];
    presetMap[p.casino + '|' + p.hotel + '|' + p.room] = p;
  }
  var newConfig = [], userAdded = [], usedPreset = {};
  for (var i = 0; i < HOTEL_CONFIG.length; i++) {
    var c = HOTEL_CONFIG[i], key = c.casino + '|' + c.hotel + '|' + c.room;
    if (presetMap[key] && !usedPreset[key]) {
      newConfig.push(JSON.parse(JSON.stringify(presetMap[key])));
      usedPreset[key] = true;
    } else if (!presetMap[key]) {
      userAdded.push(c);
    }
  }
  for (var k in presetMap) {
    if (presetMap.hasOwnProperty(k) && !usedPreset[k]) {
      newConfig.push(JSON.parse(JSON.stringify(presetMap[k])));
    }
  }
  HOTEL_CONFIG = newConfig.concat(userAdded);
  saveHCConfig();
  hcPopulateFilters();
  hcRenderTable();
  showToast('已重置！保留 ' + userAdded.length + ' 項自訂', 'success');
}

function hcAddCasino() {
  document.getElementById('hc-quick-title').textContent = '＋ 新增體系';
  document.getElementById('hc-qa-label1').textContent = '體系名稱';
  document.getElementById('hc-qa-input1').value = '';
  document.getElementById('hc-qa-label2').textContent = '第一間酒店名稱';
  document.getElementById('hc-qa-input2').value = '';
  document.getElementById('hc-qa-threshold-row').style.display = 'block';
  document.getElementById('hc-qa-threshold').value = '80';
  hcPendingQuick = { type: 'casino' };
  document.getElementById('hc-quick-bg').classList.add('active');
}

function hcAddHotel() {
  var casino = document.getElementById('hc-filter-casino').value;
  if (!casino) {
    document.getElementById('hc-quick-title').textContent = '＋ 新增酒店（請先選擇體系）';
    document.getElementById('hc-qa-label1').textContent = '體系名稱';
    document.getElementById('hc-qa-input1').value = '';
    document.getElementById('hc-qa-label2').textContent = '酒店名稱';
    document.getElementById('hc-qa-input2').value = '';
    document.getElementById('hc-qa-threshold-row').style.display = 'none';
    hcPendingQuick = { type: 'hotel_casino' };
  } else {
    document.getElementById('hc-quick-title').textContent = '＋ 新增酒店 — ' + casino;
    document.getElementById('hc-qa-label1').textContent = '酒店名稱';
    document.getElementById('hc-qa-input1').value = '';
    document.getElementById('hc-qa-label2').textContent = '第一個房型名稱（選填）';
    document.getElementById('hc-qa-input2').value = '';
    document.getElementById('hc-qa-threshold-row').style.display = 'block';
    document.getElementById('hc-qa-threshold').value = '80';
    hcPendingQuick = { type: 'hotel', casino: casino };
  }
  document.getElementById('hc-quick-bg').classList.add('active');
}

function hcConfirmQuick() {
  if (!hcPendingQuick) return;
  var type = hcPendingQuick.type;
  var v1 = document.getElementById('hc-qa-input1').value.trim();
  var v2 = document.getElementById('hc-qa-input2').value.trim();
  var threshold = parseInt(document.getElementById('hc-qa-threshold').value) || 80;

  if (type === 'casino') {
    if (!v1 || !v2) { showToast('請填寫體系和酒店名稱', 'error'); return; }
    for (var i = 0; i < HOTEL_CONFIG.length; i++) {
      if (HOTEL_CONFIG[i].casino === v1 && HOTEL_CONFIG[i].hotel === v2) { showToast('此體系＋酒店已存在', 'error'); return; }
    }
    HOTEL_CONFIG.push({ casino: v1, hotel: v2, code: '', room: v2 + ' 客房', weekday: 0, weekend: 0, special: 0, threshold: threshold });
  }
  else if (type === 'hotel_casino') {
    if (!v1 || !v2) { showToast('請填寫體系和酒店名稱', 'error'); return; }
    for (var i = 0; i < HOTEL_CONFIG.length; i++) {
      if (HOTEL_CONFIG[i].casino === v1 && HOTEL_CONFIG[i].hotel === v2) { showToast('此體系＋酒店已存在', 'error'); return; }
    }
    HOTEL_CONFIG.push({ casino: v1, hotel: v2, code: '', room: v2 + ' 客房', weekday: 0, weekend: 0, special: 0, threshold: 80 });
  }
  else if (type === 'hotel') {
    if (!v1) { showToast('請輸入酒店名稱', 'error'); return; }
    for (var i = 0; i < HOTEL_CONFIG.length; i++) {
      if (HOTEL_CONFIG[i].casino === hcPendingQuick.casino && HOTEL_CONFIG[i].hotel === v1 &&
          HOTEL_CONFIG[i].room === (v2 || v1 + ' 客房')) { showToast('此酒店＋房型已存在', 'error'); return; }
    }
    HOTEL_CONFIG.push({ casino: hcPendingQuick.casino, hotel: v1, code: '', room: v2 || v1 + ' 客房', weekday: 0, weekend: 0, special: 0, threshold: threshold });
  }
  saveHCConfig();
  hcPopulateFilters();
  hcRenderTable();
  document.getElementById('hc-quick-bg').classList.remove('active');
  hcPendingQuick = null;
  showToast('已新增', 'success');
}

// ESC 關閉酒店設定彈窗
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var qb = document.getElementById('hc-quick-bg');
    if (qb && qb.classList.contains('active')) { qb.classList.remove('active'); hcPendingQuick = null; return; }
    var mb = document.getElementById('hc-modal-bg');
    if (mb && mb.classList.contains('active')) { hcCloseModal(); return; }
    var hb = document.getElementById('hc-help-bg');
    if (hb && hb.classList.contains('active')) { hb.classList.remove('active'); return; }
  }
});

// ===== 手機版側邊欄初始化（預設隱藏）=====