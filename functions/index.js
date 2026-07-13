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
// 💡 藍新解密專用函式
function decryptTradeInfo(tradeInfo, hashKey, hashIV) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', hashKey, hashIV);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(tradeInfo, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // 移除藍新填充的特殊字元並轉為物件
    const result = JSON.parse(decrypted.replace(/[\x00-\x1F\x7F]/g, ''));
    return result;
}

exports.newebpayNotify = onRequest({ cors: true }, async (req, res) => {
    const db = admin.firestore();

    try {
        if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

        const { MerchantID, TradeInfo } = req.body;
        if (!TradeInfo) return res.status(400).send('Missing TradeInfo');

        // 1. 從 Firestore 撈出該店家的 HashKey 和 HashIV
        const storesQuery = await db.collection('stores')
            .where('MerchantID', '==', MerchantID) // 用欄位比對
            .limit(1)
            .get();

        if (storesQuery.empty) {
            console.error(`❌ 找不到該 MerchantID 的店家設定: ${MerchantID}`);
            return res.status(404).send('Merchant Not Found');
        }
        const storeData = storesQuery.docs[0].data();
        const { HashKey, HashIV } = storeData;

        // 2. 使用 AES-256-CBC 解密
        const decryptedData = decryptTradeInfo(TradeInfo, HashKey, HashIV);
        const { Status, Result } = decryptedData;

        // 3. 檢查解密後的 Status 是否為 "SUCCESS"
        if (Status !== 'SUCCESS') {
            console.error(`❌ 付款失敗: ${Result.Message}`);
            return res.status(200).send('FAIL'); // 回傳給藍新
        }

        // 4. 抓出解密後的 MerchantOrderNo
        const orderId = Result.MerchantOrderNo;
        console.log(`🎯 收到有效付款通知，單號: ${orderId}`);

        // 5. 去 Firestore 搜尋並更新訂單
        const orderQuery = await db.collection('orders').where('orderId', '==', orderId).limit(1).get();
        if (orderQuery.empty) {
            console.error(`❌ 找不到訂單: ${orderId}`);
            return res.status(404).send('Order Not Found');
        }

        await orderQuery.docs[0].ref.update({
            paymentStatus: "PAID",
            status: "PREPARING",
            paidAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ 訂單 ${orderId} 狀態已成功更新！`);
        return res.status(200).send('SUCCESS'); // 🚨 必須回傳 SUCCESS 給藍新

    } catch (error) {
        console.error("🚨 藍新 Webhook 錯誤:", error);
        return res.status(500).send('Internal Server Error');
    }
});