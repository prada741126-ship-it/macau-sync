// js/crypto.js - v11.0
// Non-overlapping extraction

function getSessionPw() {
  // 從 sessionStorage 讀取密碼（記憶體，關閉瀏覽器後清除）
  return sessionStorage.getItem('_pw') || '';
}
function setSessionPw(pw) {
  sessionStorage.setItem('_pw', pw);
  SYNC_PASSWORD = pw;  // 同步到全域變數
}
function clearSessionPw() {
  sessionStorage.removeItem('_pw');
  SYNC_PASSWORD = '';
}
function encryptData(obj) {
  var pw = getSessionPw();
  if (!pw) return JSON.stringify(obj);  // 無密碼時不加密（向下相容）
  try {
    var json = JSON.stringify(obj);
    var encrypted = CryptoJS.AES.encrypt(json, pw).toString();
    return 'ENC:' + encrypted;
  } catch(e) { console.error('加密失敗', e); return JSON.stringify(obj); }
}
function decryptData(str) {
  if (!str) return [];
  // 向下相容：如果不是 ENC: 開頭，視為舊版未加密資料
  if (str.indexOf('ENC:') !== 0) {
    try { return JSON.parse(str); } catch(e) { return []; }
  }
  var pw = getSessionPw();
  if (!pw) { console.error('無密碼，無法解密'); return []; }
  try {
    var decrypted = CryptoJS.AES.decrypt(str.substring(4), pw).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch(e) { console.error('解密失敗', e); showToast('密碼錯誤或資料損毀', 'error'); return []; }
}
function encryptWallets(obj) {
  var pw = getSessionPw();
  if (!pw) return JSON.stringify(obj);
  try {
    var json = JSON.stringify(obj);
    var encrypted = CryptoJS.AES.encrypt(json, pw).toString();
    return 'ENC:' + encrypted;
  } catch(e) { return JSON.stringify(obj); }
}
function decryptWallets(str) {
  if (!str) return {};
  if (str.indexOf('ENC:') !== 0) {
    try { return JSON.parse(str); } catch(e) { return {}; }
  }
  var pw = getSessionPw();
  if (!pw) { console.error('無密碼，無法解密'); return {}; }
  try {
    var decrypted = CryptoJS.AES.decrypt(str.substring(4), pw).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch(e) { return {}; }
}
// ===== 手機彈窗滾動鎖定 =====