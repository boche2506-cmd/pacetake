/**
 * 🛒 購物車管理核心
 */
import { db } from './app.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- 1. 資料處理區 ---
export function getCartData() {
    try {
        const data = localStorage.getItem('pacetake_cart');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("讀取購物車資料失敗", e);
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
        cartSummaryText.innerHTML = cartSummaryText.id === 'cartSummaryText' 
            ? `🛒 購物車已加入<br> ${totalQty} 項商品 · 總計 $${totalPrice}`
            : `🛒 已加入 ${totalQty} 項 · 總計 $${totalPrice}`;
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

export function syncCartFromDOM() {
    const cards = document.querySelectorAll('.food-card');
    const newCartData = [];
    cards.forEach(card => {
        const qtyElement = card.querySelector('.qty-number');
        if (!qtyElement) return;
        const qty = parseInt(qtyElement.innerText, 10);
        if (qty > 0) {
            newCartData.push({
                id: card.getAttribute('data-id'),
                name: card.getAttribute('data-name'),
                price: parseInt(card.getAttribute('data-price'), 10),
                qty: qty,
                note: card.querySelector('.item-note-input')?.value || '',
                storeId: card.getAttribute('data-store-id')
            });
        }
    });
    localStorage.setItem('pacetake_cart', JSON.stringify(newCartData));
    refreshTotalCartUI();
}

export function updateLocalStorageData(itemId, itemName, itemPrice, currentStoreId, qtyDisplay, noteInput) {
    let localCartData = getCartData();
    const currentQty = parseInt(qtyDisplay.innerText, 10);
    const currentNote = noteInput ? noteInput.value.trim() : "";

    if (localCartData.length > 0 && localCartData[0].storeId !== currentStoreId) {
        if (confirm("⚠️ 您的購物車內已有其他店家的商品，加入此商品將會清空前店清單，確定要繼續嗎？")) {
            localCartData = [];
        } else {
            const originalItem = localCartData.find(i => i.id === itemId);
            qtyDisplay.innerText = originalItem ? originalItem.qty : 0;
            return;
        }
    }

    localCartData = localCartData.filter(i => i.id !== itemId);
    if (currentQty > 0) {
        localCartData.push({ id: itemId, name: itemName, price: itemPrice, qty: currentQty, note: currentNote, storeId: currentStoreId });
    }
    localStorage.setItem('pacetake_cart', JSON.stringify(localCartData));
    refreshTotalCartUI();
}

export function initCartDOMState() {
    const localCartData = getCartData();
    const currentStoreId = document.body.getAttribute('data-store-id');
    localCartData.forEach(item => {
        if (item.storeId !== currentStoreId) return;
        const card = document.querySelector(`.food-card[data-id="${item.id}"]`);
        if (card) {
            const qtyDisplay = card.querySelector('.qty-number');
            const noteInput = card.querySelector('.item-note-input');
            if (qtyDisplay) qtyDisplay.innerText = item.qty;
            if (noteInput) noteInput.value = item.note || "";
        }
    });
}

// --- 4. 初始化與全域掛載 ---
//document.addEventListener('DOMContentLoaded', () => {
//    initCartDOMState();
//    refreshTotalCartUI();
//});

window.getCartData = getCartData;
window.refreshTotalCartUI = refreshTotalCartUI;
window.checkoutToFirebase = checkoutToFirebase;
window.syncCartFromDOM = syncCartFromDOM;
window.updateLocalStorageData = updateLocalStorageData;
window.updateLocalStorageFromDOM = syncCartFromDOM;