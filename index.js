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
    try {
        const encrypted = Buffer.from(tradeInfo, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-cbc', hashKey, hashIV);
        decipher.setAutoPadding(false);   // 自己處理 padding 較穩定

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        // 移除 PKCS7 padding
        const paddingLength = decrypted[decrypted.length - 1];
        decrypted = decrypted.slice(0, decrypted.length - paddingLength);

        const decryptedStr = decrypted.toString('utf8').trim();

        return JSON.parse(decryptedStr);
    } catch (err) {
        console.error('❌ 解密過程失敗:', err.message);
        throw new Error(`解密失敗: ${err.message}`);
    }
}

exports.newebpayNotify = onRequest({ cors: true }, async (req, res) => {
    const db = admin.firestore();

    try {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { MerchantID, TradeInfo, TradeSha } = req.body;

        if (!MerchantID || !TradeInfo || !TradeSha) {
            console.error('❌ 缺少必要參數:', { MerchantID, hasTradeInfo: !!TradeInfo, hasTradeSha: !!TradeSha });
            return res.status(400).send('Missing required parameters');
        }

        // 1. 從 Firestore 取得商店設定
        const storesQuery = await db.collection('stores')
            .where('MerchantID', '==', MerchantID)
            .limit(1)
            .get();

        if (storesQuery.empty) {
            console.error(`❌ 找不到 MerchantID: ${MerchantID}`);
            return res.status(404).send('Merchant Not Found');
        }

        const storeDoc = storesQuery.docs[0];
        const storeData = storeDoc.data();
        const { HashKey, HashIV } = storeData;

        if (!HashKey || !HashIV) {
            console.error(`❌ 商店 ${MerchantID} 未設定 HashKey 或 HashIV`);
            return res.status(500).send('Merchant configuration error');
        }

        // 2. 驗證 TradeSha（防止偽造請求）
        const expectedSha = crypto
            .createHash('sha256')
            .update(`HashKey=${HashKey}&${TradeInfo}&HashIV=${HashIV}`)
            .digest('hex')
            .toUpperCase();

        if (expectedSha !== TradeSha) {
            console.error('❌ TradeSha 驗證失敗！可能有安全風險');
            return res.status(403).send('Invalid TradeSha');
        }

        // 3. 解密 TradeInfo
        const decryptedData = decryptTradeInfo(TradeInfo, HashKey, HashIV);

        const { Status, Message, Result } = decryptedData;

        console.log(`🔐 解密成功 - Status: ${Status}, Order: ${Result?.MerchantOrderNo}`);

        if (Status !== 'SUCCESS') {
            console.error(`❌ 付款未成功: ${Message || 'Unknown error'}`);
            return res.status(200).send('FAIL'); // 藍新要求回傳 200
        }

        // 4. 更新訂單狀態
        const orderId = Result.MerchantOrderNo;
        if (!orderId) {
            console.error('❌ 解密後缺少 MerchantOrderNo');
            return res.status(400).send('Missing Order ID');
        }

        const orderQuery = await db.collection('orders')
            .where('orderId', '==', orderId)
            .limit(1)
            .get();

        if (orderQuery.empty) {
            console.error(`❌ 找不到對應訂單: ${orderId}`);
            return res.status(404).send('Order Not Found');
        }

        await orderQuery.docs[0].ref.update({
            paymentStatus: "PAID",
            status: "PREPARING",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            // 可選：記錄更多藍新資訊
            newebpayTradeNo: Result.TradeNo,
            paymentType: Result.PaymentType,
            amount: Result.Amt
        });

        console.log(`✅ 訂單 ${orderId} 已更新為已付款！`);
        return res.status(200).send('SUCCESS'); // 必須回傳 SUCCESS 給藍新

    } catch (error) {
        console.error("🚨 藍新 Webhook 錯誤:", error);

        // 建議在正式環境不要把詳細錯誤回傳給藍新
        return res.status(200).send('FAIL');
    }
});