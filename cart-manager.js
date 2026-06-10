// cart-manager.js - 購物車中央管理系統

// 1. 讀取購物車資料 (全域共用)
function getCartData() {
    return JSON.parse(localStorage.getItem('pacetake_cart')) || [];
}

// 2. 更新上方按鈕 Badge 與 購物車文字 (全域共用)
function refreshTotalCartUI() {
    const localCartData = getCartData();
    let totalQty = 0;
    let totalPrice = 0;

    localCartData.forEach(item => {
        totalQty += item.qty;
        totalPrice += (item.price * item.qty);
    });

    // 更新 Badge
    const badge = document.querySelector('.order-badge-count');
    if (badge) {
        badge.innerText = `($${totalPrice})`;
    }

    // 更新頁面內的購物車總計文字 (若存在的話)
    const cartSummaryText = document.querySelector('.cart-summary-text');
    if (cartSummaryText) {
        cartSummaryText.innerText = `🛒 已加入 ${totalQty} 項 · 總計 $${totalPrice}`;
    }
}

// 3. 處理更新資料與跨店警告 (核心邏輯)
function updateLocalStorageData(itemId, itemName, itemPrice, currentStoreId, qtyDisplay, noteInput) {
    let localCartData = getCartData();
    const currentQty = parseInt(qtyDisplay.innerText, 10);
    const currentNote = noteInput ? noteInput.value.trim() : "";

    // 跨店檢查
    if (localCartData.length > 0 && localCartData[0].storeId !== currentStoreId) {
        if (confirm("您目前的購物車已有其他店家的商品，加入此商品將會清空前店清單，確定繼續嗎？")) {
            localCartData = []; 
        } else {
            qtyDisplay.innerText = 0; // 取消則歸零
            return; 
        }
    }

    // 更新該商品狀態
    localCartData = localCartData.filter(i => i.id !== itemId);
    if (currentQty > 0) {
        localCartData.push({ id: itemId, name: itemName, price: itemPrice, qty: currentQty, note: currentNote, storeId: currentStoreId });
    }
    
    localStorage.setItem('pacetake_cart', JSON.stringify(localCartData));
    refreshTotalCartUI();
}

// 頁面載入時自動執行一次同步
document.addEventListener('DOMContentLoaded', refreshTotalCartUI);

// 在 cart-manager.js 的最後一行加上：
window.refreshTotalCartUI = refreshTotalCartUI;
window.updateLocalStorageData = updateLocalStorageData;
window.getCartData = getCartData;