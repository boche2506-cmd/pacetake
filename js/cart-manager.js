/**
 * 🛒 購物車管理核心 (合併版)
 * 整合了單一商品更新、跨店檢查以及全頁面批次同步功能
 */

// 1. 讀取購物車資料 (從 LocalStorage 取得陣列)
function getCartData() {
    try {
        const data = localStorage.getItem('pacetake_cart');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("讀取購物車資料失敗", e);
        return [];
    }
}

// 2. 更新 UI 介面 (Badge 與 總計文字)
function refreshTotalCartUI() {
    const localCartData = getCartData();
    let totalQty = 0;
    let totalPrice = 0;

    localCartData.forEach(item => {
        totalQty += item.qty;
        totalPrice += (item.price * item.qty);
    });

    // 更新導覽列或按鈕上的金額 Badge
    const badge = document.querySelector('.order-badge-count');
    if (badge) {
        badge.innerText = `($${totalPrice})`;
    }

    // 更新頁面內的購物車摘要文字 (例如：🛒 已加入 2 項 · 總計 $200)
    const cartSummaryText = document.querySelector('.cart-summary-text') || document.getElementById('cartSummaryText');
    if (cartSummaryText) {
        // 支援兩種顯示格式
        if (cartSummaryText.id === 'cartSummaryText') {
            cartSummaryText.innerHTML = `🛒 購物車已加入<br> ${totalQty} 項商品 · 總計 $${totalPrice}`;
        } else {
            cartSummaryText.innerText = `🛒 已加入 ${totalQty} 項 · 總計 $${totalPrice}`;
        }
    }
}

// 3. 處理單一商品更新與跨店警告
function updateLocalStorageData(itemId, itemName, itemPrice, currentStoreId, qtyDisplay, noteInput) {
    let localCartData = getCartData();
    const currentQty = parseInt(qtyDisplay.innerText, 10);
    const currentNote = noteInput ? noteInput.value.trim() : "";

    // 跨店檢查：若購物車已有其他店家的商品，提示使用者
    if (localCartData.length > 0 && localCartData[0].storeId !== currentStoreId) {
        if (confirm("您目前的購物車已有其他店家的商品，加入此商品將會清空前店清單，確定繼續嗎？")) {
            localCartData = []; 
        } else {
            qtyDisplay.innerText = 0; // 使用者取消則將數量歸零
            return; 
        }
    }

    // 更新該商品在陣列中的狀態
    localCartData = localCartData.filter(i => i.id !== itemId);
    if (currentQty > 0) {
        localCartData.push({ 
            id: itemId, 
            name: itemName, 
            price: itemPrice, 
            qty: currentQty, 
            note: currentNote, 
            storeId: currentStoreId 
        });
    }
    
    localStorage.setItem('pacetake_cart', JSON.stringify(localCartData));
    refreshTotalCartUI();
}

// 4. 批次同步：抓取頁面上所有的餐點卡片並更新 (原第一段邏輯)
window.syncCartFromDOM = function() {
    const cards = document.querySelectorAll('.food-card');
    const newCartData = [];
    
    cards.forEach(card => {
        const qtyElement = card.querySelector('.qty-number');
        if (!qtyElement) return;
        
        const qty = parseInt(qtyElement.innerText, 10);
        
        if (qty > 0) {
            const id = card.getAttribute('data-id');
            const price = parseInt(card.getAttribute('data-price'), 10);
            const name = card.getAttribute('data-name');
            const storeId = card.getAttribute('data-store-id'); // 建議在 HTML 加入此屬性
            
            const noteInput = card.querySelector('.item-note-input');
            const note = noteInput ? noteInput.value : '';
            
            newCartData.push({ id, name, price, qty, note, storeId });
        }
    });

    localStorage.setItem('pacetake_cart', JSON.stringify(newCartData));
    refreshTotalCartUI();
};

// 5. 頁面載入時：將 LocalStorage 的資料「回填」到 DOM 上 (新增這個函式)
function initCartDOMState() {
    const localCartData = getCartData();
    
    localCartData.forEach(item => {
        // 尋找對應的卡片 (透過 data-id)
        const card = document.querySelector(`.food-card[data-id="${item.id}"]`);
        if (card) {
            // 找到該卡片的數量顯示區
            const qtyDisplay = card.querySelector('.qty-number');
            const noteInput = card.querySelector('.item-note-input');
            
            if (qtyDisplay) {
                qtyDisplay.innerText = item.qty;
            }
            if (noteInput) {
                noteInput.value = item.note || "";
            }
        }
    });
}

// 頁面載入時自動執行 UI 同步
document.addEventListener('DOMContentLoaded', () => {
    initCartDOMState();   // 1. 先把數量填回 DOM
    refreshTotalCartUI(); // 2. 再計算總金額
});

// 全域導出方法，方便外部調用
window.getCartData = getCartData;
window.refreshTotalCartUI = refreshTotalCartUI;
window.updateLocalStorageData = updateLocalStorageData;
// 保留舊有名稱相容性，或指向新邏輯
window.updateLocalStorageFromDOM = window.syncCartFromDOM;
