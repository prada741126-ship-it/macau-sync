// 自殺式 Service Worker — 讓瀏覽器自動解除註冊
// v10.20：此檔案存在只是為了讓已註冊的 SW 自動解除
self.addEventListener('install', function() {
  self.skipWaiting();
  self.registration.unregister().then(function() {
    return self.clients.matchAll({ type: 'window' });
  }).then(function(clients) {
    clients.forEach(function(client) { client.navigate(client.url); });
  });
});
