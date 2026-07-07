self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // 如果快取有，就回傳快取
            if (cachedResponse) return cachedResponse;
            // 如果快取沒有，才去網路撈
            return fetch(e.request).catch(() => {
                // 如果網路也斷了，就不回傳任何東西（或回傳預設的 offline.html）
                return null; 
            });
        })
    );
});