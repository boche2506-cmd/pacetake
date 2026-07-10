const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
admin.initializeApp();

exports.autoUpdateStoreStatus = onSchedule("every 1 minutes", async (event) => {
    const db = admin.firestore();
    const storesSnapshot = await db.collection('stores').get();

    // 強制轉換為台灣時間 (UTC+8)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const taipeiTime = new Date(utc + (3600000 * 8));

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[taipeiTime.getDay()];
    const currentTimeMinutes = taipeiTime.getHours() * 60 + taipeiTime.getMinutes();

    for (const doc of storesSnapshot.docs) {
        const store = doc.data();
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