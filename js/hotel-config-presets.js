// js/hotel-config-presets.js - v11.0
// Non-overlapping extraction

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