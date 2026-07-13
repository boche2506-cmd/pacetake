const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const crypto = require('crypto'); // 🌟 新增：藍新解密需要用到內建的 crypto 模組
if (admin.apps.length === 0) {
    admin.initializeApp();
}

exports.autoUpdateStoreStatus = onSchedule("every 10 minutes", async (event) => {
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
            const newStatus = shouldBeOnline;

            if (store.status !== newStatus) {
                await doc.ref.update({ status: newStatus });
                console.log(`商店 ${doc.id} 狀態更新為: ${newStatus ? '營業中' : '休息中'}`);
            }
        }
    }
});
// ============================================================
// 🌐 2. 新增：接收藍新付款成功通知的 HTTP 網址 (Webhook)
// ============================================================
exports.newebpayNotify = onRequest({ cors: true }, async (req, res) => {
    const db = admin.firestore();

    try {
        // 藍新會用 POST 把資料傳過來
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { MerchantID, TradeInfo, TradeSha } = req.body;

        if (!TradeInfo) {
            console.error("❌ 收到空的回傳資料");
            return res.status(400).send('Missing TradeInfo');
        }

        console.log(`🎯 收到藍新金流通知！商店 ID: ${MerchantID}`);

        // --------------------------------------------------------
        // 💡 提示：這裡之後要塞入你的「藍新解密演算法」
        // 流程：
        // 1. 用 MerchantID 去 Firestore 撈出該店家的 HashKey 和 HashIV
        // 2. 用 AES-256-CBC 解密 TradeInfo 得到 JSON 物件
        // 3. 檢查解密後的 Status 是否為 "SUCCESS"
        // 4. 抓出解密後的 MerchantOrderNo (例如: PACE_1718123456)
        // --------------------------------------------------------

        // 模擬解密後的假資料（測試用，之後要換成你解密出來的真實單號）
        // const orderId = decryptedData.Result.MerchantOrderNo;
        // const isSuccess = decryptedData.Status === 'SUCCESS';

        // 假設我們已經拿到單號，且付款成功了：
        const mockOrderId = "PACE_123456789"; // 實作時請置換為解密單號

        console.log(`🛒 準備更新訂單狀態，單號: ${mockOrderId}`);

        // 去 Firestore 搜尋該筆訂單
        const orderQuery = await db.collection('orders')
            .where('orderId', '==', mockOrderId)
            .limit(1)
            .get();

        if (orderQuery.empty) {
            console.error(`❌ 找不到這筆訂單: ${mockOrderId}`);
            return res.status(404).send('Order Not Found');
        }

        const orderDoc = orderQuery.docs[0];

        // 🔥 關鍵核心：把訂單從未付款改成「已付款」，狀態改成「準備中」
        await orderDoc.ref.update({
            paymentStatus: "PAID",       // 亮綠燈！
            status: "PREPARING",         // 讓廚房看到！
            paidAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ 訂單 ${mockOrderId} 狀態已成功更新為已付款！`);

        // 🚨 藍新規定：收到通知後，必須回覆給藍新伺服器，不然藍新會以為你沒收到，每隔一段時間就會狂傳一次
        return res.status(200).send('SUCCESS');

    } catch (error) {
        console.error("🚨 藍新 Webhook 處理發生嚴重錯誤:", error);
        return res.status(500).send('Internal Server Error');
    }
});
