// 這個檔案必須獨立存在！它是瀏覽器判斷是否允許捷徑開啟的關鍵。
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => console.log('PWA 啟動'));
// 攔截請求放行，Chrome / Android 才能順利執行捷徑
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request)));
