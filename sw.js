self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // 如果快取有，就回傳快取
            if (cachedResponse) return cachedResponse;

            // 如果快取沒有，去網路撈
            return fetch(e.request).catch(() => {
                // 如果網路也斷了，回傳一個自訂的 Response
                // status: 503 表示服務暫時無法使用
                return new Response('<h1>目前離線中，請檢查網路連線</h1>', {
                    status: 503,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            });
        })
    );
});