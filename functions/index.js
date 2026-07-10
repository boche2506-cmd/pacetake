const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
admin.initializeApp();

exports.autoUpdateStoreStatus = onSchedule("every 5 minutes", async (event) => {
    const db = admin.firestore();
    const storesSnapshot = await db.collection('stores').get();

    // 取得台灣時間 (UTC+8)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const taipeiTime = new Date(utc + (3600000 * 8));

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[taipeiTime.getDay()];
    const currentTimeMinutes = taipeiTime.getHours() * 60 + taipeiTime.getMinutes();

    console.log(`執行時間: ${taipeiTime.toLocaleString()}, 星期: ${currentDay}, 分鐘: ${currentTimeMinutes}`);

    for (const doc of storesSnapshot.docs) {
        const store = doc.data();
        // 如果 isAutoMode 明確設定為 false，機器人直接跳過這間店
        if (store.isAutoMode === false) {
            console.log(`商店 ${doc.id} 為手動模式，跳過自動更新。`);
            continue;
        }
        const hours = store.businessHours ? store.businessHours[currentDay] : null;

        if (hours && hours.isOpen) {
            const [openH, openM] = hours.open.split(':').map(Number);
            const [closeH, closeM] = hours.close.split(':').map(Number);
            const openTime = openH * 60 + openM;
            const closeTime = closeH * 60 + closeM;

            const shouldBeOnline = currentTimeMinutes >= openTime && currentTimeMinutes < closeTime;
            const newStatus = shouldBeOnline ? 'online' : 'offline';

            if (store.status !== newStatus) {
                await doc.ref.update({ status: newStatus });
                console.log(`商店 ${doc.id} 狀態更新為: ${newStatus}`);
            }
        }
    }
});