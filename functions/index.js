const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { onCall } = require("firebase-functions/v2/https");
const { HttpsError } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const NEWEBPAY_BASE_URL = 'https://ccore.newebpay.com'; // 正式環境，測試請改 ccore.newebpay.com
const REGION = "asia-east1";
exports.autoUpdateStoreStatus = onSchedule({
    schedule: "every 10 minutes",
    region: REGION
}, async (event) => {
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

exports.newebpayNotify = onRequest({
    cors: true,
    region: REGION
}, async (req, res) => {
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
        const { Status, Result } = decryptedData;
        if (Status !== 'SUCCESS') {
            return res.status(200).send('FAIL');
        }
        // 4. 更新訂單狀態
        const orderId = Result.MerchantOrderNo;
        if (!orderId) return res.status(400).send('Missing Order ID');
        const orderQuery = await db.collection('orders')
            .where('orderId', '==', orderId)
            .limit(1)
            .get();
        if (orderQuery.empty) {
            console.error(`❌ 找不到訂單: ${orderId}`);
            return res.status(404).send('Order Not Found');
        }
        const orderDoc = orderQuery.docs[0];
        const order = orderDoc.data();
        // 🌟 重點保護：如果已經是 PAID，就不要再重複更新
        if (order.paymentStatus === 'PAID') {
            console.log(`📌 訂單 ${orderId} 已經是 PAID 狀態，跳過更新`);
            return res.status(200).send('SUCCESS');
        }
        await orderDoc.ref.update({
            paymentStatus: "PAID",
            status: "PREPARING",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            confirmedBy: "newebpay",           // 新增：標記是由金流確認
            newebpayTradeNo: Result.TradeNo,
            paymentType: Result.PaymentType,
            amount: Result.Amt
        });
        console.log(`✅ 訂單 ${orderId} 已更新為已付款！`);
        return res.status(200).send('SUCCESS');
    } catch (error) {
        console.error("🚨 藍新 Webhook 錯誤:", error);
        return res.status(200).send('FAIL');
    }
});

function encryptAES(plainText, key, iv) {
    const cryptoKey = Buffer.from(key, 'utf8');
    const cryptoIv = Buffer.from(iv, 'utf8');
    const cipher = crypto.createCipheriv('aes-256-cbc', cryptoKey, cryptoIv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
// ====================== 商家退款 Function ======================
exports.newebpayRefund = onCall({
    region: REGION,
    timeoutSeconds: 60,
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', '請先登入');
    }
    const { orderId, refundAmount, reason = '商家取消訂單' } = request.data || {};
    if (!orderId || !refundAmount || refundAmount <= 0) {
        throw new HttpsError('invalid-argument', '參數錯誤');
    }
    try {
        const db = admin.firestore();
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new HttpsError('not-found', '找不到訂單');
        }
        const order = orderDoc.data();
        if (order.paymentStatus !== 'PAID') {
            throw new HttpsError('failed-precondition', '此訂單尚未付款，無法退款');
        }
        if (!order.storeId) {
            throw new HttpsError('permission-denied', '訂單資料不完整');
        }
        const storeDoc = await db.collection('stores').doc(order.storeId).get();
        if (!storeDoc.exists) {
            throw new HttpsError('not-found', '找不到商店資料');
        }
        const store = storeDoc.data();
        if (store.sellerUid !== uid) {
            throw new HttpsError('permission-denied', '你沒有權限操作此商店的退款');
        }
        const { MerchantID, HashKey, HashIV } = store;
        if (!HashKey || !HashIV || !MerchantID) {
            throw new HttpsError('internal', '商店金流設定不完整');
        }
        const timestamp = Math.floor(Date.now() / 1000);
        let result;
        const paymentType = (order.paymentType || '').toUpperCase();
        const isCredit = ['CREDIT', 'ANDROIDPAY', 'SAMPAY'].includes(paymentType);
        if (isCredit) {
            const postData = {
                RespondType: "JSON",
                Version: "1.1",
                Amt: Math.round(refundAmount),
                MerchantOrderNo: order.orderId || orderId,
                TimeStamp: timestamp,
                IndexType: 1,
                CloseType: 2,
            };
            const aesString = encryptAES(JSON.stringify(postData), HashKey, HashIV);
            console.log("準備呼叫藍新信用卡退款...");
            console.log("MerchantID:", MerchantID);
            console.log("PostData 長度:", aesString.length);
            const res = await axios.post(`${NEWEBPAY_BASE_URL}/API/CreditCard/Close`,
                `MerchantID_=${MerchantID}&PostData_=${aesString}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            result = res.data;
        } else {
            if (!order.newebpayTradeNo) {
                throw new HttpsError('invalid-argument', '此訂單缺少 newebpayTradeNo');
            }
            const postData = {
                RespondType: "JSON",
                Version: "1.0",
                TimeStamp: timestamp,
                TradeNo: order.newebpayTradeNo,
                MerchantOrderNo: order.orderId || orderId,
                Amt: Math.round(refundAmount),
            };
            const aesString = encryptAES(JSON.stringify(postData), HashKey, HashIV);
            const res = await axios.post(`${NEWEBPAY_BASE_URL}/API/EWallet/Refund`,
                `MerchantID_=${MerchantID}&PostData_=${aesString}`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            result = res.data;
        }

        if (result.Status === 'SUCCESS' || result.Status === '1000') {
            await orderDoc.ref.update({
                refundStatus: "REFUNDED",
                refundAmount: admin.firestore.FieldValue.increment(Math.round(refundAmount)),
                refundedAt: admin.firestore.FieldValue.serverTimestamp(),
                refundReason: reason,
                status: "CANCELLED",
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                cancelReason: reason,
            });
            return { success: true, message: "退款申請成功" };
        } else {
            console.log('藍新退款完整回應:', JSON.stringify(result, null, 2));
            console.log('藍新回傳 Status:', result.Status);
            console.log('藍新回傳 Message:', result.Message);
            throw new HttpsError('aborted', result.Message || '退款失敗');
        }
    } catch (error) {
        console.error('=== 退款完整錯誤 ===');
        console.error('錯誤名稱:', error.name);
        console.error('錯誤訊息:', error.message);
        if (error.response) {
            console.error('藍新回應狀態:', error.response.status);
            console.error('藍新回應內容:', error.response.data);
        } else if (error.request) {
            console.error('沒有收到藍新回應:', error.request);
        } else {
            console.error('錯誤訊息:', error.message);
        }

        throw new HttpsError('internal', error.message || '退款處理失敗');
    }
});