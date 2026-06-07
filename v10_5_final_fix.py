#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v10.5 最終完整修復：
1. RM.render() 刪除/編輯按鈕使用 b._fbKey || b.id
2. RM.delete() 同時支援 _fbKey 和 id
3. RM.openModal() 同時支援 _fbKey 和 id
4. 確保 RM.saveForm() 為新增值產生 _fbKey
5. 確保 RM.delete() 立即從 Firebase 刪除（不只等 syncUpload）
"""

import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = ''.join(lines)
modified = False

# ============================================================
# 修復 1: RM.render() 刪除按鈕和編輯按鈕
# ============================================================
old_render_btns = "<button class='rm-btn-sm rm-btn-edit' onclick='RM.openModal("+b.id+")'>編輯</button> <button class='rm-btn-sm rm-btn-del' onclick='RM.delete("+b.id+")'>刪除</button>"

new_render_btns = "<button class='rm-btn-sm rm-btn-edit' onclick='RM.openModal("+(b._fbKey||b.id)+")'>編輯</button> <button class='rm-btn-sm rm-btn-del' onclick='RM.delete("+(b._fbKey||b.id)+")'>刪除</button>"

if old_render_btns in content:
    content = content.replace(old_render_btns, new_render_btns, 1)
    print('✅ 修復 RM.render() 按鈕：改用 b._fbKey || b.id')
    modified = True
else:
    print('⚠️  找不到 RM.render() 按鈕程式碼（可能已修復）')

# ============================================================
# 修復 2: RM.delete() 同時支援 _fbKey 和 id
# ============================================================
old_delete = """  delete: function(id) {
    if (!confirm("確定要刪除這筆訂房紀錄嗎？")) return;
    this.bookings = this.bookings.filter(function(x){ return x.id!==id; });
    this.save();
    this.render();
    this.updateQuota();
    showToast("訂房已刪除","success");
  },"""

new_delete = """  delete: function(id) {
    if (!confirm("確定要刪除這筆訂房紀錄嗎？")) return;
    // v10.5 同時支援 _fbKey（字串）和 id（數字）
    var fbKey = null;
    var newArr = [];
    for (var i = 0; i < this.bookings.length; i++) {
      var b = this.bookings[i];
      if (b._fbKey === id || String(b.id) === String(id)) {
        fbKey = b._fbKey;  // 取得 Firebase 鍵
      } else {
        newArr.push(b);
      }
    }
    this.bookings = newArr;
    // v10.5 立即從 Firebase 刪除（不只等 syncUpload）
    if (db && fbKey) {
      db.ref('macau_data/rmBookings/' + fbKey).set(null);
    }
    this.save();
    this.render();
    this.updateQuota();
    showToast("訂房已刪除","success");
  },"""

if old_delete in content:
    content = content.replace(old_delete, new_delete, 1)
    print('✅ 修復 RM.delete()：同時支援 _fbKey 和 id，立即從 Firebase 刪除')
    modified = True
else:
    print('⚠️  找不到 RM.delete() 的原始程式碼')
    # 嘗試找到當前版本並修復
    pattern = r'delete:\s*function\s*\(id\)\s*\{[^}]*this\.bookings\s*=\s*this\.bookings\.filter[^}]*\}[^}]*\}'
    match = re.search(pattern, content)
    if match:
        print('   找到 RM.delete() 當前版本，需要手動修復')
    else:
        print('   找不到 RM.delete() 定義')

# ============================================================
# 修復 3: RM.openModal() 同時支援 _fbKey 和 id
# ============================================================
old_openModal = "    var b = this.bookings.find(function(x){ return x.id===id; });"
new_openModal = """    // v10.5 先按 _fbKey 查找，再按 id 查找（向後相容）
    var b = null;
    for (var i = 0; i < this.bookings.length; i++) {
      if (this.bookings[i]._fbKey === id || this.bookings[i].id === id) { b = this.bookings[i]; break; }
    }"""

if old_openModal in content:
    content = content.replace(old_openModal, new_openModal, 1)
    print('✅ 修復 RM.openModal()：同時支援 _fbKey 和 id')
    modified = True
else:
    print('⚠️  找不到 RM.openModal() 的查找程式碼')

# ============================================================
# 修復 4: 確保 RM.saveForm() 為新增值產生 _fbKey
# ============================================================
# 檢查 RM.saveForm() 中是否有產生 _fbKey
if 'var _k = _fbKey();' in content and 'this.lastId++;' in content:
    # 檢查是否在 push() 前產生 _fbKey
    pattern = r"(this\.lastId\+\+;\s*\n\s*)this\.bookings\.push\(\{)"
    replacement = r"\1      var _k = _fbKey();\n      this.bookings.push({ _fbKey:_k,"
    new_content = re.sub(pattern, replacement, content)
    if new_content != content:
        content = new_content
        print('✅ 修復 RM.saveForm()：為新增值產生 _fbKey')
        modified = True
    else:
        print('⚠️  RM.saveForm() 可能已有 _fbKey（需要人工檢查）')
else:
    print('⚠️  無法判斷 RM.saveForm() 的 _fbKey 狀態')

# ============================================================
# 寫回檔案
# ============================================================
if modified:
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('\n✅ 所有修復完成，已寫回 index.html')
else:
    print('\n⚠️  沒有進行任何修改（可能已全部修復）')

print('\n請執行 JS 語法檢查：')
print('  node -e "var fs=require(\'fs\'); var html=fs.readFileSync(\'index.html\',\'utf8\'); var m=html.match(/<script>([\\s\\S]*?)<\\/script>/); if(m){try{new Function(m[1]);console.log(\'JS OK\');}catch(e){console.error(e);}}"')
