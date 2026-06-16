/**
 * 🛒 購物車管理核心
 */
// 1. 匯入「鑰匙」(來自 app.js 的連線通道)
import { app, auth, db, provider, getHasSeatingStatus } from './app.js';

// 2. [執行區]：確認資源載入後，立即執行邏輯來除錯或開始工作
console.log("資料庫連線狀況：", db); 
const isSeating = getHasSeatingStatus();
console.log("目前座位狀態：", isSeating);

// --- 1. 資料處理區 ---
export function getCartData() {
    try {
        const raw = localStorage.getItem('pacetake_cart');
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

// --- 2. UI 渲染區 ---
export function refreshTotalCartUI() {
    const localCartData = getCartData();
    let totalQty = 0;
    let totalPrice = 0;

    localCartData.forEach(item => {
        totalQty += item.qty;
        totalPrice += (item.price * item.qty);
    });

    const badge = document.querySelector('.order-badge-count');
    if (badge) badge.innerText = `($${totalPrice})`;

    const cartSummaryText = document.querySelector('.cart-summary-text') || document.getElementById('cartSummaryText');
    if (cartSummaryText) {
        cartSummaryText.innerHTML = `🛒 已加入 ${totalQty} 項 · 總計 $${totalPrice}`;
    }
}

// --- 3. 業務邏輯區 ---
export async function checkoutToFirebase(buyerPhone, sellerUid) {
    const localCartData = getCartData();
    if (localCartData.length === 0) return alert("購物車是空的");

    const totalAmount = localCartData.reduce((sum, item) => sum + (item.price * item.qty), 0);

    try {
        await addDoc(collection(db, "orders"), {
            items: localCartData,
            buyerPhone: buyerPhone,
            sellerUid: sellerUid,
            totalAmount: totalAmount,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        localStorage.removeItem('pacetake_cart');
        refreshTotalCartUI();
        alert("訂單已送出！");
    } catch (e) {
        console.error("訂單送出失敗: ", e);
    }
}

// 這是你現在使用的唯一更新函式
export function updateLocalStorageData(itemId, itemName, itemPrice, currentStoreId, qtyDisplay, noteInput, card) {
    let localCartData = getCartData();
    const currentQty = parseInt(qtyDisplay.innerText, 10);
    const currentNote = noteInput ? noteInput.value.trim() : "";
    const uniqueId = `${currentStoreId}|||${itemId}`;

    if (localCartData.length > 0 && String(localCartData[0].storeId).trim() !== String(currentStoreId).trim()) {
        if (confirm("⚠️ 購物車內已有其他店家的商品，加入此商品將會清空前店清單，確定繼續嗎？")) {
            localCartData = [];
        } else {
            const originalItem = localCartData.find(i => i.id === uniqueId);
            qtyDisplay.innerText = originalItem ? originalItem.qty : 0;
            return;
        }
    }

    localCartData = localCartData.filter(i => i.id !== uniqueId);

    if (currentQty > 0) {
        localCartData.push({
            id: uniqueId,
            name: itemName,
            price: itemPrice,
            qty: currentQty,
            note: currentNote,
            storeId: currentStoreId,
            size: card.querySelector('input[type="radio"]:checked')?.value || null
        });
    }

    localStorage.setItem('pacetake_cart', JSON.stringify(localCartData));
    refreshTotalCartUI();
}

export function initCartDOMState() {
    const cartItems = getCartData();
    const currentStoreId = document.body.getAttribute('data-store-id');
    if (!cartItems || cartItems.length === 0) return;

    cartItems.forEach(item => {
        if (String(item.storeId || "").trim() !== String(currentStoreId || "").trim()) return;

        const parts = item.id.split('|||');
        const rawItemId = parts[1];
        const card = document.querySelector(`.food-card[data-id="${rawItemId}"]`);

        if (card) {
            const qtyDisplay = card.querySelector('.qty-number');
            const noteInput = card.querySelector('.item-note-input');
            if (qtyDisplay) qtyDisplay.innerText = item.qty;
            if (noteInput) noteInput.value = item.note;

            if (item.size) {
                const radioToSelect = card.querySelector(`input[value="${item.size}"]`);
                if (radioToSelect) radioToSelect.checked = true;
            }
        }
    });
}