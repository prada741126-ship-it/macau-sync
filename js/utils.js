// js/utils.js - v11.0
// Non-overlapping extraction

function getDow(ds) {
  if (!ds) return "";
  var d = new Date(ds);
  if (isNaN(d.getTime())) return "";
  var days = ["周日","周一","周二","周三","周四","周五","周六"];
  return days[d.getDay()];
}

function nowStr() {
  var d = new Date();
  var tz = new Date(d.getTime() + 480 * 60000);
  var y = tz.getUTCFullYear();
  var m = String(tz.getUTCMonth() + 1).padStart(2, "0");
  var day = String(tz.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function toNum(s) {
  if (typeof s === "number") return s;
  if (!s) return 0;
  s = String(s).replace(/,/g, "").replace(/\s/g, "");
  s = s.replace(/万/g, "");
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function fmt(n) {
  if (n === 0 || n === "0" || n === "") return "0";
  var s = String(Math.round(n));
  var parts = [];
  while (s.length > 3) {
    parts.unshift(s.slice(-3));
    s = s.slice(0, -3);
  }
  if (s) parts.unshift(s);
  return parts.join(",");
}

function calcComm(vol, rate) {
  return Math.ceil(vol * 10000 * rate / 100);
}

function calcFund(comm, bonus) {
  return comm - bonus;
}

// ===== AES 加密/解密（v4.9 安全強化）=====