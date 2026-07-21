import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, collection, getDocs, doc, onSnapshot, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp, orderBy, limit, } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
const firebaseConfig = {
    apiKey: "AIzaSyCkAiZCJ6L950KfYJEqubWGi1M8D03OuJI",
    authDomain: "pacetake-c6e1e.firebaseapp.com",
    projectId: "pacetake-c6e1e",
    storageBucket: "pacetake-c6e1e.firebasestorage.app",
    messagingSenderId: "1052980235056",
    appId: "1:1052980235056:web:6a06e4ac9b48f1e74896f5",
    measurementId: "G-888XL8JTHW",
};
export { getStorage, ref, uploadBytes, getDownloadURL, signInAnonymously, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, collection, getDocs, doc, onSnapshot, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp, orderBy, limit };
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});
export const currentStoreInfo = {
    id: null,
    name: null
};
export const areaData = {
    "臺北市": ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
    "新北市": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "土城區", "蘆洲區", "汐止區", "樹林區", "鶯歌區", "三峽區", "淡水區", "瑞芳區", "五股區", "泰山區", "林口區", "深坑區", "石碇區", "坪林區", "三芝區", "石門區", "八里區", "平溪區", "雙溪區", "貢寮區", "金山區", "萬里區", "烏來區"],
    "基隆市": ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
    "桃園市": ["桃園區", "中壢區", "大溪區", "楊梅區", "蘆竹區", "大園區", "龜山區", "八德區", "龍潭區", "平鎮區", "新屋區", "觀音區", "復興區"],
    "新竹市": ["東區", "北區", "香山區"],
    "新竹縣": ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "芎林鄉", "橫山鄉", "北埔鄉", "寶山鄉", "峨眉鄉", "尖石鄉", "五峰鄉"],
    "苗栗縣": ["苗栗市", "頭份市", "竹南鎮", "後龍鎮", "通霄鎮", "苑裡鎮", "卓蘭鎮", "造橋鄉", "西湖鄉", "頭屋鄉", "公館鄉", "銅鑼鄉", "三義鄉", "大湖鄉", "獅潭鄉", "三灣鄉", "南庄鄉", "泰安鄉"],
    "台中市": ["中區", "東區", "南區", "西區", "北區", "西屯區", "南屯區", "北屯區", "豐原區", "東勢區", "大甲區", "清水區", "沙鹿區", "梧棲區", "后里區", "神岡區", "潭子區", "大雅區", "新社區", "石岡區", "外埔區", "大安區", "烏日區", "大肚區", "龍井區", "霧峰區", "太平區", "大里區", "和平區"],
    "彰化縣": ["彰化市", "員林市", "鹿港鎮", "和美鎮", "北斗鎮", "溪湖鎮", "田中鎮", "二林鎮", "線西鄉", "伸港鄉", "福興鄉", "秀水鄉", "花壇鄉", "芬園鄉", "大村鄉", "埔鹽鄉", "埔心鄉", "永靖鄉", "社頭鄉", "二水鄉", "田尾鄉", "埤頭鄉", "芳苑鄉", "大城鄉", "竹塘鄉", "溪州鄉"],
    "南投縣": ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "中寮鄉", "魚池鄉", "國姓鄉", "水里鄉", "信義鄉", "仁愛鄉"],
    "雲林縣": ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "古坑鄉", "大埤鄉", "莿桐鄉", "林內鄉", "二崙鄉", "崙背鄉", "麥寮鄉", "東勢鄉", "褒忠鄉", "臺西鄉", "元長鄉", "四湖鄉", "口湖鄉", "水林鄉"],
    "嘉義市": ["東區", "西區"],
    "嘉義縣": ["太保市", "朴子市", "布袋鎮", "大林鎮", "民雄鄉", "溪口鄉", "新港鄉", "六腳鄉", "東石鄉", "義竹鄉", "鹿草鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "番路鄉", "大埔鄉", "阿里山鄉"],
    "台南市": ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"],
    "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "旗津區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "仁武區", "大社區", "岡山區", "路竹區", "阿蓮區", "田寮區", "燕巢區", "橋頭區", "梓官區", "彌陀區", "永安區", "湖內區", "鳳山區", "大寮區", "林園區", "鳥松區", "大樹區", "旗山區", "美濃區", "六龜區", "內門區", "杉林區", "甲仙區", "桃源區", "那瑪夏區", "茂林區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧臺鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"],
    "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"],
    "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "富里鄉", "秀林鄉", "萬榮鄉", "卓溪鄉"],
    "臺東縣": ["臺東市", "成功鎮", "關山鎮", "卑名鄉", "大武鄉", "太麻里鄉", "東河鄉", "長濱鄉", "鹿野鄉", "池上鄉", "綠島鄉", "延平鄉", "海端鄉", "達仁鄉", "金峰鄉", "蘭嶼鄉"],
    "澎湖縣": ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"],
    "金門縣": ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉", "烏坵鄉"],
    "連江縣": ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"]
};
//  全域核心變數與資料
let allStores = [];
let buyerLat = null;
let buyerLng = null;
let currentBuyerAddress = "正在獲取定位中...";
let currentUserId = null;
let activeDragItem = null;
// 統一管理頁面上的所有元件
const storeContainer = document.getElementById('store-Container');
const citySelect = document.getElementById('citySelect');
const districtSelect = document.getElementById('districtSelect');
const gpsPinBtn = document.getElementById('gpsPinBtn');
const addressDetailLightbox = document.getElementById('addressDetailLightbox');
const modalAddressText = document.getElementById('modalAddressText');
const globalSearchInput = document.getElementById('globalSearchInput');
const toggleBtn = document.getElementById('themeToggleBtn');
const heartIcon = document.getElementById('heart-icon');
const menuContainer = document.getElementById('menuContainer');
const storeDistanceText = document.getElementById('storeDistanceText');
const dropdownMenu = document.getElementById('dropdownMenu');
const userNameDisplay = document.getElementById('userNameDisplay');
const loginLightbox = document.getElementById('loginLightbox');
const emailFormSection = document.getElementById('emailFormSection');
const adminMainContent = document.getElementById('adminMainContent'); // 請換成你放主要內容的容器 ID
if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    // 直接把 console.log 覆寫成空函式，讓它印不出任何東西
    console.log = function () { };
    console.warn = function () { };
    // 💡 建議保留 console.error，這樣萬一線上有嚴重 Bug 時，你還是能在 F12 看到錯誤訊息
}
// 監聽 Firebase 登入狀態
export const authReady = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
        resolve(user); // 當狀態確認後，resolve 這個 user
        if (user) {
            // 使用者已經登入 (可能是匿名，也可能是正式會員)
            console.log("當前使用者 ID:", user.uid);
            console.log("是否為匿名:", user.isAnonymous);
            // 開始進行點餐或載入購物車
            handleUserSyncAndRoleRouting(user);
            renderFavoriteStores();
        } else {
            // --- 這裡就是「關門」的地方 ---
            console.log("[PACE DEBUG] 未登入，正在觸發匿名登入...");
            signInAnonymously(auth).catch((error) => {
                showGuestUI();
            });
        }
        refreshTotalCartUI();//** * 🛒 購物車管理
    });
});
// 使用者登出
function showGuestUI() {
    if (userNameDisplay) userNameDisplay.innerHTML = "訪客";
    renderDynamicMenu('guest');
}
async function handleUserSyncAndRoleRouting(user) {
    if (!user) return;
    currentUserId = user.uid;
    // 確保這裡使用 user.isAnonymous
    console.log("[PACE DEBUG] User synced. Is Anonymous:", user.isAnonymous);
    try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            // --- 這裡是「老客戶登入」---
            console.log("登入成功：更新上次登入時間");
            await updateDoc(userRef, {
                lastLogin: new Date().toISOString()
            });
            const currentRole = userDoc.data().role || "buyer";
            updateUIForUser(user, currentRole);
        } else {
            // --- 這裡是「新客戶註冊」---
            console.log("註冊成功：建立初始資料");
            const initialData = {
                uid: user.uid,
                role: "buyer",
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            if (!user.isAnonymous) {
                initialData.email = user.email;
                initialData.displayName = user.displayName || "新會員";
            }
            else {
                // 如果是匿名，你可以額外註記一個欄位方便後台辨識
                initialData.isAnonymous = true;
            }
            // 統一寫入資料庫
            await setDoc(userRef, initialData);
            const safeName = user.displayName || '遊客';
            const userRole = "buyer";
            updateUIForUser(user, "buyer");
        }
    } catch (e) {
        console.error("Role routing error:", e);
    }
}


function updateUIForUser(user, currentRole) {
    const userAvatarImg = document.getElementById('userAvatarImg');
    const defaultIcon = document.getElementById('defaultIcon');
    const statusContainer = document.getElementById('statusmsg');
    const userId = currentUserId || 'guest';
    // 1. 角色名稱邏輯 (保留你的防禦性檢查)
    if (userNameDisplay) {
        if (currentRole === "admin") {
            userNameDisplay.innerHTML = `👑 總管`;
        } else if (currentRole === "seller") {
            userNameDisplay.innerHTML = `<img src="png/logo180.png" class="buyer" alt="買家圖示"> 老闆`;
        } else {
            userNameDisplay.innerHTML = `<img src="png/logo180.png" class="buyer" alt="買家圖示"> 貴賓`;
        }
    }
    // 2. 頭像區塊 (保留防禦性檢查)
    if (userAvatarImg && defaultIcon) {
        if (!user.isAnonymous && user.photoURL) {
            userAvatarImg.src = user.photoURL;
            userAvatarImg.style.display = 'block';
            defaultIcon.style.display = 'none';
        } else {
            userAvatarImg.src = '';
            userAvatarImg.style.display = 'none';
            defaultIcon.style.display = 'block';
        }
    }
    // 3. 狀態列區塊 (保留防禦性檢查)
    if (statusContainer) {
        if (!user.isAnonymous) {
            statusContainer.innerHTML = `
                <a class="statusText" href="orders.html?userId=${userId}">
                    <div class="status-indicator"></div>
                    <span>您好 ${user.displayName || 'PACE用戶'} ~<br>請點此查看訂單狀態！</span>
                </a>`;
        } else {
            statusContainer.innerHTML = `
                <button class="statusText" data-action="loginBtn">
                    <div class="status-indicatorlogin"></div>
                    <span>請點此連結google帳號<br>或使用電子郵件登入</span>
                </button>`;
        }
    }
    renderDynamicMenu(currentRole, user);
}

function renderDynamicMenu(role, user) {
    if (!dropdownMenu) return;
    // 確保有 userId，沒有的話用 'guest' 佔位
    const userId = currentUserId || 'guest';
    // 1. 個人連結區塊 (誰都能看，或依照登入狀態調整)
    let personalLinks = `
        <a href="orders.html?userId=${userId}" class="nav-fast">🛒 我的訂單</a>
        <a href="history.html?userId=${userId}" class="nav-fast">⏳ 歷史訂單</a>
        <a href="favorites.html?userId=${userId}" class="nav-fast">❤️ 我的收藏</a>
    `;
    // 2. 店舖與管理連結區塊
    let shopLinks = '';
    if (role === 'admin' || role === 'seller') {
        shopLinks = `
            <div class="menu-divider"></div>
            <div class="menu-header">店舖管理</div>
            <a href="seller.html?storeId=${userId}" class="nav-fast">🧑‍🍳 接單管理</a>
            <a href="manage.html?storeId=${userId}" class="nav-fast">⚙️ 店舖管理</a>
            <a href="payment.html?storeId=${userId}" class="nav-fast">💵 繳費</a>
        `;
    }
    // 3. 開店連結區塊
    let registerLink = '';
    if (role === 'admin' || role === 'buyer') {
        registerLink = `<a href="register.html" class="nav-fast" style="color: var(--brand-blue); font-weight: 700;">💼 月費開店(試用七天)</a>`;
    }
    // 最終組合
    let adminLink = '';
    if (role === 'admin') {
        adminLink = `
        <div class="menu-divider"></div>
        <a href="javascript:void(0)" data-action="issuePromo" class="nav-fast" style="color: var(--brand-green);">🎟️ 邀請碼發行</a>
        <a href="javascript:void(0)" data-action="payment" class="nav-fast" style="color: var(--brand-green);">💳 繳費審核</a>`;
    }
    let authActionLink = '';
    if (user.isAnonymous) {
        authActionLink = `
        <div class="menu-divider"></div>
        <button class="loginBtn" data-action="loginBtn" style="color: var(--brand-green); width: 100%; text-align: left; padding: 2cqw; background: none; border: none; cursor: pointer; font-size: 5cqw;">🔐 登入/註冊</button>`;
    } else {
        authActionLink = `
        <div class="menu-divider"></div>
        <button class="logoutBtn" data-action="logoutBtn" style="color: var(--brand-red); width: 100%; text-align: left; padding: 2cqw; background: none; border: none; cursor: pointer; font-size: 5cqw;">🚪 登出系統</button>`;
    }
    dropdownMenu.innerHTML = personalLinks + registerLink + shopLinks + adminLink + authActionLink;
}
function getBrowserLocation() {
    const path = window.location.pathname;
    const targetPaths = ['/', 'index.html', 'store.html', 'favorites.html'];
    if (targetPaths.some(p => path === '/' ? path === '/' : path.includes(p))) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    buyerLat = position.coords.latitude;  // 存入全域變數
                    buyerLng = position.coords.longitude; // 存入全域變數
                    const currentBuyerAddress = `經度: ${buyerLng.toFixed(4)}, 緯度: ${buyerLat.toFixed(4)} (GPS 衛星精準定位)`;
                    // UI 更新
                    if (gpsPinBtn) gpsPinBtn.innerText = "📍 已獲取定位";
                    if (modalAddressText) modalAddressText.innerText = currentBuyerAddress;
                    if (window.currentStoreInfo) {
                        const sLat = parseFloat(window.currentStoreInfo.shopLat || window.currentStoreInfo.lat);
                        const sLng = parseFloat(window.currentStoreInfo.shopLng || window.currentStoreInfo.lng);
                        updateDistanceUI(sLat, sLng);
                    }
                    // 🌟 關鍵修改：檢查使用者是否已經手動選了下拉選單
                    const selectedCity = citySelect ? citySelect.value : '';
                    if (!selectedCity) {
                        // 只有在「沒有選下拉選單」的預設情況下，才執行 GPS 附近搜尋
                        fetchNearbyStores(buyerLat, buyerLng);
                    } else {
                        console.log("[PACE] 用戶已手動選擇下拉選單，略過 GPS 自動搜尋");
                    }
                },
                (error) => {
                    const errorMsg = "瀏覽器定位遭拒，請手動選擇下拉選單縣市。";
                    if (gpsPinBtn) gpsPinBtn.innerText = "📍 無法定位";
                    if (modalAddressText) modalAddressText.innerText = errorMsg;
                }
            );
        } else {
            if (modalAddressText) modalAddressText.innerText = "您的裝置不支援 GPS 定位裝置。";
        }
    }
}
// 從firebase抓資料
async function fetchNearbyStores(lat, lng) {
    const path = window.location.pathname;
    if (path === '/' || path.includes('index.html')) {
        console.log("[PACE] 正在執行區域化精準查詢...");
        // 1. 取得目標 9 宮格區域 ID
        const searchZones = getNearbyZones(lat, lng);
        try {
            // 2. 核心優化：只抓這 9 個區內的店家
            const q = query(
                collection(db, "stores"),
                where("zoneid", "in", searchZones) // 這行是省錢關鍵！
            );
            const querySnapshot = await getDocs(q);
            // 3. 更新全域資料
            allStores = [];
            querySnapshot.forEach((doc) => {
                allStores.push({ id: doc.id, ...doc.data() });
            });
            console.log(`[PACE] 成功獲取附近店家共 ${allStores.length} 間`);
            // 4. 資料到手後，執行篩選與渲染
            filterAndRenderStores();
        } catch (error) {
            console.error("讀取店家失敗：", error);
            if (storeContainer) storeContainer.innerHTML = '<div class="loading-Spinner" style="color:var(--brand-red);">❌ 讀取附近店家失敗</div>';
        }
    }
}
/**
 * 取得使用者周圍的 9 宮格區域陣列
 */
function getNearbyZones(lat, lng) {
    const LAT_MIN = 21.8, LAT_MAX = 25.7;
    const LNG_MIN = 119.3, LNG_MAX = 122.0;
    const ROW_COUNT = 78, COL_COUNT = 54;
    const row = Math.floor(((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * ROW_COUNT);
    const col = Math.floor(((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * COL_COUNT);
    let zones = [];
    // 抓取中心點與周圍 8 格
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            // 確保網格沒有超出 0~38 和 0~26 的範圍
            if (r >= 0 && r < ROW_COUNT && c >= 0 && c < COL_COUNT) {
                zones.push(`zone_${r}_${c}`);
            }
        }
    }
    return zones; // 把這個陣列丟給 Firebase 的 where("zone_id", "in", zones) 即可！
}
// index.html
function filterAndRenderStores() {
    if (!storeContainer) return;
    // 1. 抓取篩選條件
    const selectedCity = citySelect ? citySelect.value : '';
    const selectedDist = districtSelect ? districtSelect.value : '';
    const searchKeyword = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';
    // 2. 進行篩選
    const filtered = allStores.filter(store => {
        const matchCity = !selectedCity || store.city === selectedCity;
        const matchDist = !selectedDist || store.district === selectedDist;
        const nameToSearch = store.shopName || store.name || '';
        const matchKeyword = !searchKeyword || nameToSearch.toLowerCase().includes(searchKeyword);
        return matchCity && matchDist && matchKeyword;
    });
    // 3. 如果找不到店家，顯示提示並結束
    if (filtered.length === 0) {
        storeContainer.innerHTML = '<div class="loading-Spinner" style="color: var(--text-main);">🍃 此商圈目前尚無合作店家進駐喔！</div>';
        return;
    }
    // 4. 清空畫面並開始渲染卡片
    storeContainer.innerHTML = "";
    filtered.forEach(store => {
        if (store.status === false) return;
        // 生成卡片
        const card = createStoreCard(store);
        storeContainer.appendChild(card);
    });
}
//favorites.html
async function renderFavoriteStores() {
    const favoriteContainer = document.getElementById('favoriteContainer');
    // 如果頁面上沒有這個容器，代表現在不是收藏頁，直接結束函數
    if (!favoriteContainer) return;
    const user = auth.currentUser;
    if (!user) {
        favoriteContainer.innerHTML = '<p style="color: var(--text-main);">請先登入以查看收藏清單。</p>';
        return;
    }
    try {
        // 1. 抓取收藏列表的所有文件
        const favCol = collection(db, "users", user.uid, "favorites");
        const snapshot = await getDocs(favCol);
        if (snapshot.empty) {
            favoriteContainer.innerHTML = '<div class="loading-Spinner" style="color: var(--text-main);">🤍 您目前還沒有收藏任何店家喔！</div>';
            return;
        }
        favoriteContainer.innerHTML = ""; // 清空容器
        snapshot.forEach((doc) => {
            const store = doc.data();
            const card = createStoreCard(store);
            favoriteContainer.appendChild(card);
        });
    } catch (error) {
        console.error("讀取收藏失敗:", error);
    }
}
// 這個函數接收一個 store 物件，回傳卡片的 HTML 字串
function createStoreCard(store) {
    const finalName = store.shopName || store.name || '未命名店家';
    const finalAddress = store.shopAddress || store.address || '';
    const takeoutSupported = store.isCashPayEnabled !== false;
    const paySupported = store.isOnlinePayEnabled !== false;
    const seatingSupported = store.hasSeating !== false;
    const logoData = store.shopLogo || '🏪';
    const sLat = parseFloat(store.shopLat || store.lat);
    const sLng = parseFloat(store.shopLng || store.lng);
    // 2. 計算距離 (如果使用者有定位，且店家有座標，才進行計算)
    let distanceHtml = '';
    if (buyerLat !== null && buyerLng !== null && !isNaN(sLat) && !isNaN(sLng)) {
        const dist = calculateDistance(buyerLat, buyerLng, sLat, sLng);
        distanceHtml = dist.toFixed(1) + ' km';
    }
    let finalLogoHtml = logoData;
    if (logoData && (logoData.startsWith('data:image') || logoData.startsWith('http'))) {
        finalLogoHtml = `<img src="${logoData}" style="width:100%; height:100%; object-fit:cover; border-radius:3cqw;">`;
    }
    const card = document.createElement('a');
    card.href = `store.html?storeId=${store.sellerUid}`;
    card.className = 'store-card';
    card.innerHTML = `
        <div class="store-img">${finalLogoHtml}</div>
        <div class="store-info">
                <div class="store-name">${finalName}</div>
                <div class="store-meta">📍 ${finalAddress} <br>⚡ 距離 ${distanceHtml}</div>
                <div class="store-tags">
                    <span class="tag-time ${takeoutSupported ? '' : 'inactive'}">💵 現金付款</span>
                    <span class="tag-pay ${paySupported ? '' : 'inactive'}">💳 線上支付</span>
                    <span class="tag-seating ${seatingSupported ? '' : 'inactive'}">🪑 內用</span>
                </div>
            </div>`;
    return card;
};


// 📍 計算兩點經緯度距離 (回傳公里數)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半徑(公里)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function updateDistanceUI(storeLat, storeLng) {
    const distElement = document.getElementById('storeDistanceText');
    if (!distElement) return;
    // 如果沒有傳入有效的 GPS 座標，維持「距離未知」
    if (buyerLat === null || buyerLng === null || isNaN(storeLat) || isNaN(storeLng)) {
        distElement.innerText = '⚡ 距離未知';
        return;
    }
    const dist = calculateDistance(buyerLat, buyerLng, storeLat, storeLng);
    distElement.innerText = `⚡ ${dist.toFixed(1)} km`;
}
function mouseslide() {
    const tabs = document.getElementById('categoryHeader');
    if (!tabs) return;
    let isDown = false;
    let startX;
    let scrollLeft;
    // 1. 滑鼠按下：激活拖曳狀態
    tabs.addEventListener('mousedown', (e) => {
        isDown = true;
        tabs.classList.add('dragging'); // 選擇性：可以加這個 class 改變滑鼠游標样式
        startX = e.pageX - tabs.offsetLeft;
        scrollLeft = tabs.scrollLeft;
    });
    // 2. 滑鼠離開容器範圍：取消拖曳狀態
    tabs.addEventListener('mouseleave', () => {
        isDown = false;
        tabs.classList.remove('dragging');
    });
    // 3. 滑鼠放開：取消拖曳狀態
    tabs.addEventListener('mouseup', () => {
        isDown = false;
        tabs.classList.remove('dragging');
    });
    // 4. 滑鼠移動中：計算移動距離並動態捲動
    tabs.addEventListener('mousemove', (e) => {
        if (!isDown) return; // 沒按下就不用動
        e.preventDefault();  // 阻止瀏覽器預設的選取文字行為
        const x = e.pageX - tabs.offsetLeft;
        // 🎯 乘以 2 是「滑動靈敏度/速度」，數字越大滑越快
        const walk = (x - startX) * 2;
        tabs.scrollLeft = scrollLeft - walk;
    });
}
// Listener'input'
document.addEventListener('input', (e) => {
    const target = e.target.closest('[data-action-input]');
    if (!target) return;
    const action = target.getAttribute('data-action-input');

    if (action === 'globalSearch') {
        filterAndRenderStores();
    }
    else {
        // 如果有需要處理預設情況或錯誤紀錄，可以寫在這裡
        console.log('未知的 action:', action);
    }
});
// 1. 初始化函式：負責把資料灌入指定的 Select
function initCitySelect(selectElement) {
    if (!selectElement) return;
    Object.keys(areaData).forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.innerText = city;
        selectElement.appendChild(opt);
    });
}
// Listener'change'
document.addEventListener('change', async (e) => {
    const target = e.target.closest('[data-action-change]');
    if (!target) return;
    const action = target.getAttribute('data-action-change');
    const selectedValue = target.value;
    const path = window.location.pathname;
    // 1. 處理「城市選擇」邏輯
    if (action === 'citySelect') {
        const districtSelect = document.querySelector('#districtSelect');
        if (districtSelect) {
            districtSelect.innerHTML = '<option value="">選擇區域</option>';
            if (areaData[selectedValue]) {
                areaData[selectedValue].forEach(dist => {
                    const opt = document.createElement('option');
                    opt.value = dist;
                    opt.innerText = dist;
                    districtSelect.appendChild(opt);
                });
            }
        }
        // 分流執行：只有在 index.html 才根據下拉選單抓取並篩選商店
        if (path.includes('index.html') || path === '/') {
            await fetchStoresBasedOnSelection();
        }
    }
    // 2. 處理「區域選擇」的邏輯
    else if (action === 'districtSelect') {
        if (path.includes('index.html') || path === '/') {
            await fetchStoresBasedOnSelection();
        }
    }
    else {
        console.log('未知的 action:', action);
    }
});
async function fetchStoresBasedOnSelection() {
    const selectedCity = citySelect ? citySelect.value : '';
    const selectedDist = districtSelect ? districtSelect.value : '';
    // 優先權 1：如果使用者有選擇縣市下拉選單
    if (selectedCity) {
        console.log(`[PACE] 優先使用下拉選單查詢：${selectedCity} ${selectedDist || '全區'}`);
        try {
            let q;
            // 根據有沒有選區域來決定 Firebase 查詢條件
            if (selectedDist) {
                q = query(
                    collection(db, "stores"),
                    where("city", "==", selectedCity),
                    where("district", "==", selectedDist)
                );
            } else {
                q = query(
                    collection(db, "stores"),
                    where("city", "==", selectedCity)
                );
            }
            const querySnapshot = await getDocs(q);
            allStores = [];
            querySnapshot.forEach((doc) => {
                allStores.push({ id: doc.id, ...doc.data() });
            });
            console.log(`[PACE] 依下拉選單成功獲取店家共 ${allStores.length} 間`);
            filterAndRenderStores(); // 直接渲染
        } catch (error) {
            console.error("依下拉選單讀取店家失敗：", error);
            if (storeContainer) storeContainer.innerHTML = '<div class="loading-Spinner" style="color:var(--brand-red);">❌ 讀取店家失敗</div>';
        }
    }
    // 優先權 2：如果沒有選下拉選單，但有快取或記錄到 GPS 座標，就走原本的 9 宮格附近搜尋
    else if (buyerLat !== null && buyerLng !== null) {
        fetchNearbyStores(buyerLat, buyerLng);
    }
    else {
        console.log("[PACE] 尚未選擇縣市且尚未取得 GPS 定位");
    }
}
// Listener'click'
document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (adminMainContent && e.target === adminMainContent) {
        closeloadPaymentAudits();
        return;
    }
    if (!target) return;
    const action = target.getAttribute('data-action');
    switch (action) {
        // 發行邀請碼
        case 'issuePromo': {
            const code = prompt('請輸入要發行的VIP 邀請碼 (例如: PACE2026):');
            if (!code || code.trim() === "") return;
            try {
                await setDoc(doc(db, "promo_codes", code.trim()), {
                    code: code.trim(),
                    createdBy: currentUserId,
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    usedBy: null
                });
                alert(`🎟️ 邀請碼「${code}」已成功寫入 Firebase！`);
            } catch (error) {
                console.error("邀請碼發行失敗:", error);
                alert("發行失敗，請檢查您的系統權限配置！");
            }
            break;
        }
        // 收藏按鈕監聽器
        case 'favorite-btn': {
            const user = auth.currentUser;
            if (!user) {
                alert("⚠️ 請先登入才能收藏店家喔！");
                return;
            }
            const data = window.currentStoreInfo || {};
            const { id } = data; // 確保有 id
            const favoriteData = {
                sellerUid: data.sellerUid || null, // 若為 undefined，存為 null
                shopLogo: data.shopLogo || "",
                shopName: data.shopName || "",
                shopAddress: data.shopAddress || "",
                shopLat: data.shopLat ?? 0, // 使用 Nullish coalescing operator
                shopLng: data.shopLng ?? 0,
                isCashPayEnabled: !!data.isCashPayEnabled, // 強制轉為布林值
                isOnlinePayEnabled: !!data.isOnlinePayEnabled,
                hasSeating: !!data.hasSeating,
                createdAt: new Date().toISOString()
            };
            const favRef = doc(db, "users", user.uid, "favorites", id);
            try {
                const docSnap = await getDoc(favRef);
                if (docSnap.exists()) {
                    await deleteDoc(favRef);
                    heartIcon.innerText = "🤍";
                    alert(`💔 已將「${data.shopName}」移除`);
                } else {
                    // 使用處理過的 favoriteData
                    await setDoc(favRef, favoriteData);
                    heartIcon.innerText = "❤️";
                    alert(`❤️ 已將「${data.shopName}」加入最愛！`);
                }
            } catch (error) {
                console.error("操作失敗:", error);
                alert("系統錯誤，請稍後再試。");
            }
            break;
        }
        case 'gpsPinBtn': {
            console.log("[PACE DEBUG] GPS Pin clicked.");
            if (addressDetailLightbox) addressDetailLightbox.style.display = 'flex';
            break;
        }
        case 'closeAddressModalBtn': {
            addressDetailLightbox.style.display = 'none';
            break;
        }
        case 'avatarBtnMenu': {
            // 2. 下拉選單邏輯
            dropdownMenu.classList.toggle('active');
            // 如果選單打開了
            if (dropdownMenu.classList.contains('active')) {
                // 使用 setTimeout 是為了避免「點擊按鈕的瞬間」就被監聽器判定為「點擊外部」
                setTimeout(() => {
                    document.addEventListener('click', closeMenuOutside);
                }, 0);
            } else {
                // 如果手動關閉了，移除監聽
                document.removeEventListener('click', closeMenuOutside);
            }
            break;
        }
        case 'loginBtn': {
            loginLightbox.style.display = 'flex';
            break;
        }
        case 'customReturnBtn': {
            loginLightbox.style.display = 'none';
            break;
        }
        case 'logoutBtn': {
            console.log("[PACE DEBUG] Logout clicked.");
            try {
                await signOut(auth);
                location.reload();
            } catch (error) {
                console.error("Logout error:", error);
            }
            break;
        }
        case 'toggleEmailFormBtn': {
            emailFormSection.classList.toggle('active');
            break;
        }
        case 'togglePasswordVisibility': {
            const input = document.getElementById('loginPassword');
            if (!input) return;
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            target.textContent = isPass ? '🙈' : '👁️';
            break;
        }
        case 'emailLogin': {
            const emailInput = document.getElementById('loginEmail');
            const passInput = document.getElementById('loginPassword');
            const email = emailInput?.value.trim();
            const password = passInput?.value;
            if (!email || !password) {
                alert("密碼或 Email 欄位不可為空！");
                return;
            }
            const originalText = target.textContent;
            target.disabled = true;
            target.textContent = "處理中...";
            try {
                const result = await signInWithEmailAndPassword(auth, email, password);
                await handleUserSyncAndRoleRouting(result.user);
            } catch (err) {
                if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                    try {
                        const result = await createUserWithEmailAndPassword(auth, email, password);
                        await handleUserSyncAndRoleRouting(result.user);
                        if (loginLightbox) {
                            loginLightbox.style.display = 'none';
                        }
                    } catch (regErr) {
                        alert("註冊密碼強度不足，或帳號已被佔用！");
                    }
                } else {
                    alert("登入密碼有誤，請再確認一次！");
                }
            } finally {
                target.disabled = false;
                target.textContent = originalText;
            }
            break;
        }
        case 'googleLogin': {
            try {
                const result = await signInWithPopup(auth, provider);
                await handleUserSyncAndRoleRouting(result.user);
                if (loginLightbox) {
                    loginLightbox.style.display = 'none';
                }
            } catch (err) {
                console.error("Google 登入失敗：", err);
                alert("連線失敗，請檢查網路服務！");
            }
            break;
        }
        case 'payment': {
            loadPaymentAudits(); // 👈 點擊「繳費審核」時就會呼叫這支程式！
            break;
        }
    }
});
// 定義一個獨立的函式，方便隨時新增或移除監聽
function closeMenuOutside(e) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const avatarBtnMenu = document.querySelector('[data-action="avatarBtnMenu"]');
    if (!dropdownMenu.contains(e.target) && e.target !== avatarBtnMenu) {
        dropdownMenu.classList.remove('active');
        document.removeEventListener('click', closeMenuOutside); // 關閉後立刻移除監聽器
    }
}
function closeloadPaymentAudits() {
    document.getElementById('adminMainContent').style.display = 'none';
}
// 1. 載入並渲染待審核清單
async function loadPaymentAudits() {
    if (!adminMainContent) {
        alert("找不到顯示內容的容器！");
        return;
    }
    adminMainContent.style.display = 'flex';
    adminMainContent.innerHTML = '<h3 style="text-align: center;">載入審核資料中...</h3>';
    try {
        // 查詢所有 status 爲 pending 的付款請求
        const q = query(collection(db, "payment_requests"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            adminMainContent.innerHTML = `
                <div style="text-align: center; padding: 3cqw;">
                    <h3>🎉 目前沒有需要審核的繳費申請</h3>
                    <p style="color: #FFFFFF;">大家都乖乖繳費了！</p>
                </div>
            `;
            return;
        }
        let html = `
            <h2>💵 待審核繳費列表</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(75cqw, 1fr)); gap: 1cqw;">
        `;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const requestId = docSnap.id;
            // 轉換方案中文顯示
            let planName = data.plan;
            if (data.plan === 'year') planName = '一年期';
            else if (data.plan === 'halfYear') planName = '半年期';
            else if (data.plan === 'month') planName = '一個月';
            html += `
                <div style="color:#111111; border: 0.2cqw solid #ddd; background: #fff; padding: 3cqw; border-radius: 2cqw; box-shadow: 0 0.2cqw 1.25cqw rgba(0,0,0,0.05);">
                    <p style="margin: 1cqw 0;"><strong>商店 ID：</strong><br><span style="font-size: 3cqw; color: #555; word-break: break-all;">${data.storeId}</span></p>
                    <p style="margin: 1cqw 0;"><strong>購買方案：</strong> ${planName} ($${data.amount})</p>
                    <p style="margin: 1cqw 0;"><strong>轉帳後五碼：</strong> <span style="color: #d9534f; font-weight: bold; font-size: 4cqw;">${data.lastFiveDigits}</span></p>
                    <p style="margin: 1cqw 0; font-size: 3cqw; color: #888;"><strong>申請時間：</strong> ${new Date(data.createdAt).toLocaleString()}</p>
                    <div style="margin: 4cqw 0;">
                        <strong>轉帳證明：</strong><br>
                        <a href="${data.proofUrl}" target="_blank" style="display: inline-block; margin-top: 1cqw; color: #007bff; text-decoration: underline;">🔍 點擊查看大圖截圖</a>
                    </div>
                    <button onclick="approvePayment('${requestId}', '${data.storeId}', '${data.plan}')" style="width: 100%; background: #28a745; color: white; border: none; padding: 2.5cqw; border-radius: 1.25cqw; font-weight: bold; cursor: pointer;">
                        ✅ 審核通過並延長期限
                    </button>
                </div>
            `;
        });
        html += `</div>`;
        adminMainContent.innerHTML = html;
    } catch (error) {
        console.error("載入審核清單失敗：", error);
        adminMainContent.innerHTML = '<p style="color: red; text-align: center;">載入失敗，請檢查網路或權限。</p>';
    }
}
// 2. 審核通過的執行動作 (必須挂在 window 上才能被 HTML 的 onclick 呼叫)
window.approvePayment = async function (requestId, storeId, plan) {
    if (!confirm(`確定要通過這筆審核嗎？這將會自動為商店延長對應的訂閱天數。`)) return;
    try {
        // 決定要加幾個月
        let monthsToAdd = 1;
        if (plan === 'year') monthsToAdd = 12;
        else if (plan === 'halfYear') monthsToAdd = 6;
        else if (plan === 'month') monthsToAdd = 1;
        // 取得該商店目前的資料，用來計算「從哪一天開始延期」
        const storeRef = doc(db, "stores", storeId);
        const storeSnap = await getDoc(storeRef);
        let baseDate = new Date(); // 預設從今天開始算
        if (storeSnap.exists()) {
            const storeData = storeSnap.data();
            if (storeData.subscription && storeData.subscription.expiryDate) {
                const currentExpiry = new Date(storeData.subscription.expiryDate);
                // 💡 關鍵疊加邏輯：如果客戶還沒過期，以他原本的到期日往後加；如果已經過期了，從今天開始加
                if (currentExpiry > baseDate) {
                    baseDate = currentExpiry;
                }
            }
        }
        // 加上對應的月份
        baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
        // A. 更新該商店的訂閱狀態與新到期日
        await updateDoc(storeRef, {
            "subscription.status": "active",
            "subscription.expiryDate": baseDate.toISOString(),
            "subscription.lastPaymentDate": new Date().toISOString(),
            "subscription.planType": plan
        });
        // B. 將這筆 payment_request 的狀態改為 approved (審核完成，下次就不會再顯示了)
        const requestRef = doc(db, "payment_requests", requestId);
        await updateDoc(requestRef, {
            status: "approved",
            approvedAt: new Date().toISOString()
        });
        alert('🎉 審核成功！該商店的到期日已自動更新。');
        // 重新整理審核列表
        loadPaymentAudits();
    } catch (error) {
        console.error("審核處理失敗：", error);
        alert("審核失敗，發生未預期的錯誤。");
    }
};
// ==========================================
// 🎯 PACE 專屬：store.html 終極完美動態渲染模組 (含首頁卡片替換、加減鍵、備註欄)
// ==========================================
async function initStorePage() {
    console.log("[PACE DEBUG] 啟動點餐頁面終極渲染程序...");
    if (!menuContainer) return;
    const urlParams = new URLSearchParams(window.location.search);
    const currentStoreId = urlParams.get('storeId');
    if (!currentStoreId) {
        alert("❌ 找不到店家資訊");
        window.location.href = "index.html";
        return;
    }
    document.body.setAttribute('data-store-id', currentStoreId);
    try {
        const storeDoc = await getDoc(doc(db, "stores", currentStoreId));
        if (!storeDoc.exists()) {
            if (auth.currentUser) {
                // 1. 定位到使用者收藏夾中，對應的那位店家的文件
                // 路徑：users -> [使用者UID] -> favorites -> [該店家的sellerUid]
                const favoriteDocRef = doc(db, "users", auth.currentUser.uid, "favorites", currentStoreId);
                try {
                    // 2. 執行刪除，直接把這份文件移除
                    await deleteDoc(favoriteDocRef);
                    console.log("已從收藏夾中清除失效店家：", currentStoreId);
                } catch (error) {
                    console.error("清理收藏時發生錯誤，但仍將導向：", error);
                }
                // 不管有沒有刪除成功，最後都導回，確保使用者不會卡在壞掉的頁面
                window.location.href = "favorites.html";
            }
            alert("該店家已下架，已自動從您的收藏中移除。");
            window.location.href = "favorites.html";
            return;
        }
        const storeData = storeDoc.data();
        window.currentStoreInfo = {
            ...storeData, // 這行會自動把 storeData 的所有欄位全部放入，無需一行行寫
            id: currentStoreId, // 確保 ID 被正確寫入
            // 如果需要對特定欄位強制處理 (例如布林值轉型)，可以在下面單獨覆寫：
            isCashPayEnabled: !!storeData.isCashPayEnabled,
            isOnlinePayEnabled: !!storeData.isOnlinePayEnabled,
            hasSeating: !!storeData.hasSeating
        };
        console.log("全域商店資訊已更新：", window.currentStoreInfo);
        if (auth.currentUser) await syncHeartIcon();
        // 頁面初始化時，根據 Firebase 狀態更新愛心
        async function syncHeartIcon() {
            if (!heartIcon) return; // 防呆：如果網頁沒這按鈕就跳出
            const user = auth.currentUser;
            if (!user) {
                heartIcon.innerText = "🤍"; // 沒登入固定顯示白色
                return;
            }
            try {
                const favRef = doc(db, "users", user.uid, "favorites", window.currentStoreInfo.id);
                const docSnap = await getDoc(favRef);
                heartIcon.innerText = docSnap.exists() ? "❤️" : "🤍";
            } catch (e) {
                console.error("同步收藏失敗:", e);
            }
        }
        // 1. 先抓出 Firebase 的座標 (記得轉成數字)
        const sLat = parseFloat(storeData.shopLat || storeData.lat);
        const sLng = parseFloat(storeData.shopLng || storeData.lng);
        // 2. 計算距離 (如果使用者有定位，且店家有座標，才進行計算)
        updateDistanceUI(sLat, sLng);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${sLat},${sLng}`;
        // 2. 獲取地址文字 (確保 fallback 機制)
        const address = storeData.shopAddress || storeData.address || '地址未提供';
        // 3. 把算出來的結果填入 HTML
        document.getElementById('storeNameText').innerText = storeData.shopName || storeData.name || '未命名店家';
        document.getElementById('storephone').innerText = storeData.shopPhone || storeData.Phone || '未提供';
        document.getElementById('storeAddressText').innerHTML = `
        <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
        📍 ${address}</a>`;
        const savedLogo = localStorage.getItem('selected_store_logo');
        const target = document.getElementById('logo-wrapper');
        if (!target) return; // 如果找不到盒子就跳出，防止報錯
        const imageSource = storeData.shopLogo;
        if (imageSource) {
            // 檢查是不是 base64 或者正常的 http 網址
            if (imageSource.startsWith('data:image') || imageSource.startsWith('http')) {
                target.innerHTML = `<img src="${imageSource}" style="width:100%; height:100%; object-fit:cover; border-radius:3cqw;">`;
            } else {
                target.innerText = imageSource;
            }
        } else {
            target.innerText = '🏪';
        }
        // 1. 抓取購物車與分頁標籤容器
        const cartData = JSON.parse(localStorage.getItem(getCartKey())) || [];
        // 🎯【修改點 1】：拿掉 tabsWrapper，直接抓取分類大外層容器
        const categoryHeader = document.querySelector('.category-header');
        const menuQuery = collection(db, "stores", currentStoreId, "menu");
        const menuSnapshot = await getDocs(menuQuery);
        // 🎯【修改點 2】：清空舊的內容
        if (categoryHeader) categoryHeader.innerHTML = "";
        menuContainer.innerHTML = "";
        // 🔥【關鍵修正】：把撈出來的分類文件轉成陣列，並依照你在後台蓋樓的數字順序進行排序
        // 這樣能保證 category-list-1 永遠排在 category-list-2 前面，不會被隨機打亂
        const sortedDocs = menuSnapshot.docs.sort((a, b) => {
            const sortA = a.data().sortIndex !== undefined ? a.data().sortIndex : 999;
            const sortB = b.data().sortIndex !== undefined ? b.data().sortIndex : 999;
            return sortA - sortB; // 由小到大排序 (0 -> 1 -> 2)
        });
        // 2. 第一層迴圈：使用排序好的文件陣列（sortedDocs）
        sortedDocs.forEach((doc, catIndex) => {
            const catData = doc.data();
            const categoryName = catData.category || "未命名分類";
            const items = catData.items || [];
            // 🎯 密碼對齊一：使用跟後台完全一樣的 ID
            const uniqueStoredId = doc.id;
            // 🎯 密碼對齊二：生成分類按鈕
            const newTabBtn = document.createElement('button');
            newTabBtn.type = 'button';
            newTabBtn.className = catIndex === 0 ? 'category-tab-btn active' : 'category-tab-btn';
            newTabBtn.setAttribute('data-action', 'switchcategory');
            newTabBtn.setAttribute('data-target', uniqueStoredId);
            // 純文字 span
            newTabBtn.innerHTML = `<span>${categoryName}</span>`;
            // 🎯【修改點 3】：直接塞進 categoryHeader 盒子裡（依排序順序追加）
            if (categoryHeader) categoryHeader.appendChild(newTabBtn);
            // 過濾出有供應的商品
            const availableItems = items.filter(item => item.supply !== false);
            // 3. 第二層迴圈：把這個分類的菜，直接丟進大容器裡
            availableItems.forEach((item, index) => {
                const itemUniqueId = item.id || `${doc.id}_item_${index}`;
                const itemId = `${currentStoreId}|||${itemUniqueId}`;
                const savedItem = cartData.find(c => c.id === itemId);
                const qty = savedItem ? savedItem.qty : 0;
                const basePrice = parseInt(item.price) || 0;
                const priceHTML = `
                        <div class="one-size-row">
                            <span class="food-price" style="font-weight:bold;">$${basePrice}</span>
                            <div class="quantity-control-panel">
                                <button class="minus-btn" data-id="${itemId}">-</button>
                                <span class="qty-number" id="qty_${itemId}">${qty}</span>
                                <button class="plus-btn" data-id="${itemId}">+</button>
                            </div>
                        </div>`;
                const foodCard = document.createElement('div');
                foodCard.className = 'food-card';
                foodCard.dataset.id = itemId;
                foodCard.dataset.price = basePrice;
                // 🎯 把分類標籤貼在卡片自己身上
                foodCard.dataset.category = uniqueStoredId;
                // 🎯 如果不是排序後的第一個分類，預設先隱藏起來
                if (catIndex !== 0) {
                    foodCard.style.display = 'none';
                }
                foodCard.innerHTML = `
                <div class="food-img">
                    ${item.image ? `<img src="${item.image}" style="width:100%; height:100%; border-radius:inherit; object-fit: cover; position: absolute;">` : '🍱'}
                </div>
                <div class="food-info">
                        <div class="food-name">${item.name || '未命名'}</div>
                    ${priceHTML}
                </div>`;
                // 🎯 塞進大衣櫃（此時也會照著排序好的分類依序加入）
                menuContainer.appendChild(foodCard);
            });
        });
        // 🎯【修改點 4】：前台分類分頁切換監聽器（全面改為控制卡片顯示/隱藏）
        if (categoryHeader) {
            categoryHeader.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('[data-action="switchcategory"]');
                if (!targetBtn) return;
                const targetContainerId = targetBtn.getAttribute('data-target');
                // 🎯【核心修正】：不找大盒子了，直接遍歷所有商品卡片進行篩選！
                document.querySelectorAll('.food-card').forEach(card => {
                    if (card.dataset.category === targetContainerId) {
                        card.style.display = ''; // 移除隱藏，恢復原本遵守 menuContainer 的 Grid 佈局
                    } else {
                        card.style.display = 'none'; // 不是這一類的通通隱藏
                    }
                });
                // 3. 更新按鈕的高亮樣式
                document.querySelectorAll('.category-tab-btn').forEach(btn => {
                    if (btn === targetBtn) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            });
        }
        // --- 滑動切換分類功能 (Swipe to change category) ---
        let touchStartX = 0;
        let touchEndX = 0;
        // 1. 綁定在商品卡片的大容器上，偵測手指按下的起始位置
        if (menuContainer) {
            menuContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            // 2. 偵測手指離開的位置，並計算滑動方向
            menuContainer.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipeToSwitchCategory();
            }, { passive: true });
        }
        // 3. 判斷滑動方向並觸發對應的「假點擊」
        function handleSwipeToSwitchCategory() {
            const swipeThreshold = 50; // 滑動超過 50px 才算數，避免誤觸
            const deltaX = touchStartX - touchEndX;
            // 如果滑動距離太短，就不做任何事
            if (Math.abs(deltaX) < swipeThreshold) return;
            // 抓出目前畫面上所有的分類按鈕
            const allTabs = Array.from(document.querySelectorAll('.category-tab-btn'));
            if (allTabs.length === 0) return;
            // 找出當前是哪一個按鈕亮著 (active)
            const currentIndex = allTabs.findIndex(btn => btn.classList.contains('active'));
            if (currentIndex === -1) return;
            let targetIndex = currentIndex;
            if (deltaX > 0) {
                // 向左滑 (deltaX > 0) ➡️ 代表想看「下一個」分類
                targetIndex = Math.min(currentIndex + 1, allTabs.length - 1);
            } else {
                // 向右滑 (deltaX < 0) ➡️ 代表想看「上一個」分類
                targetIndex = Math.max(currentIndex - 1, 0);
            }
            // 如果目標分類跟現在不一樣，就觸發點擊！
            if (targetIndex !== currentIndex) {
                const targetBtn = allTabs[targetIndex];
                // 觸發你原本寫好的點擊事件！(完美連動)
                targetBtn.click();
                // 🌟 貼心小優化：如果分類很多，上方按鈕列會自動捲動到被選中的按鈕位置
                targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        // --- 事件綁定（隨後點擊加減按鈕，維持原樣） ---
        menuContainer.addEventListener('click', (e) => {
            if (!e.target.matches('.plus-btn, .minus-btn')) return;
            const clickedBtn = e.target;
            const itemId = clickedBtn.dataset.id;
            const card = clickedBtn.closest('.food-card');
            const qtyDisplay = clickedBtn.parentElement.querySelector('.qty-number');
            let count = parseInt(qtyDisplay.innerText);
            if (e.target.matches('.plus-btn')) count++;
            else if (count > 0) count--;
            qtyDisplay.innerText = count;
            const currentPrice = parseInt(card.dataset.price || 0);
            updateLocalStorageData(
                itemId,
                card.querySelector('.food-name').innerText,
                currentPrice,
                currentStoreId,
                qtyDisplay,
                card
            );
        });
        // --- 在 initStorePage 最底部的購物車回填（維持原樣不變） ---
        setTimeout(() => {
            const currentStoreId = document.body.getAttribute('data-store-id');
            // 🎯【修正這裡】：改用動態的 getCartKey() 抓取該用戶專屬的購物車資料
            const latestCartData = JSON.parse(localStorage.getItem(getCartKey())) || [];
            latestCartData.forEach(cartItem => {
                const qtyDisplay = document.getElementById(`qty_${cartItem.id}`);
                if (qtyDisplay) {
                    qtyDisplay.innerText = cartItem.qty;
                }
            });
            if (typeof refreshTotalCartUI === 'function') refreshTotalCartUI();
            console.log("[PACE DEBUG] 前台購物車同步與分頁初始化完成。");
        }, 200);
    } catch (error) {
        console.error("[PACE ERROR] 頁面渲染失敗：", error);
        menuContainer.innerHTML = "<p>無法載入店家菜單，請檢查網路連線。</p>";
    }
}
/** * 🛒 購物車管理核心 */
function getCartKey() {
    // 1. 優先抓取你寫的全域變數
    let uid = window.currentUserId;
    // 2. 如果全域變數還沒好，直接向 Firebase Auth 拿當前登入者
    if (!uid && window.auth && window.auth.currentUser) {
        uid = window.auth.currentUser.uid;
    }
    // 3. 如果連 Firebase Auth 都還沒初始化完，嘗試從 sessionStorage 或 localStorage 的快取找，或退回 guest
    return uid ? `pacetake_cart_${uid}` : 'pacetake_cart_guest';
}
// --- 1. 資料處理區 ---
export function getCartData() {
    try {
        const raw = localStorage.getItem(getCartKey()); // 👈 改用動態 Key
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
    // 🛠️ 修正：直接精準對應你 HTML 裡的 id="orderbadgecount"
    const badge = document.getElementById('orderbadgecount');
    if (badge) {
        badge.innerText = `($${totalPrice})`; // 更新金額
    } else {
        console.warn("[PACE] 找不到 id='orderbadgecount' 的標籤！");
    }
    // 如果還有其他摘要文字容器也可以一併更新
    const cartSummaryText = document.getElementById('cartSummaryText'); // 確保變數存在
    if (cartSummaryText) {
        cartSummaryText.innerHTML = `🛒 已加入 ${totalQty} 項 · 總計 $${totalPrice} `;
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
        localStorage.removeItem(getCartKey()); // 👈 結帳後清空該用戶專屬的購物車
        refreshTotalCartUI();
        alert("訂單已送出！");
    } catch (e) {
        console.error("訂單送出失敗: ", e);
    }
}
// 這是你現在使用的唯一更新函式
export function updateLocalStorageData(itemId, itemName, itemPrice, currentStoreId, qtyDisplay, card) {
    let localCartData = getCartData();
    const currentQty = parseInt(qtyDisplay.innerText, 10);

    if (localCartData.length > 0 && String(localCartData[0].storeId).trim() !== String(currentStoreId).trim()) {
        if (confirm("⚠️ 購物車內已有其他店家的商品，加入此商品將會清空前店清單，確定繼續嗎？")) {
            localCartData = [];
        } else {
            qtyDisplay.innerText = "0";
            return;
        }
    }

    localCartData = localCartData.filter(i => i.id !== itemId);
    if (currentQty > 0) {
        localCartData.push({
            id: itemId,
            name: itemName,
            price: itemPrice,
            qty: currentQty,
            storeId: currentStoreId
        });
    }
    localStorage.setItem(getCartKey(), JSON.stringify(localCartData)); // 👈 存入該用戶專屬 Key
    refreshTotalCartUI();
}
// app.js 裡新增這段：專門給購物車列表使用的「純資料修改器」
export function modifyCartItemQty(itemId, delta) {
    let localCartData = getCartData();
    const itemIndex = localCartData.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
        localCartData[itemIndex].qty += delta;
        if (localCartData[itemIndex].qty <= 0) {
            localCartData.splice(itemIndex, 1);
        }
        localStorage.setItem(getCartKey(), JSON.stringify(localCartData)); // 👈 存入該用戶專屬 Key
        refreshTotalCartUI();
    }
}

export function initCartDOMState() {
    const cartItems = getCartData();
    const currentStoreId = document.body.getAttribute('data-store-id');
    if (!cartItems || cartItems.length === 0) return;
    cartItems.forEach(item => {
        if (String(item.storeId || "").trim() !== String(currentStoreId || "").trim()) return;
        const qtyDisplay = document.getElementById(`qty_${item.id}`);
        if (qtyDisplay) {
            qtyDisplay.innerText = item.qty;
        }
    });
}

function initThemeSystem() {
    // 1. 初始化：網頁載入時套用顏色
    const savedTheme = localStorage.getItem('pacetake-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (toggleBtn) {
        toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        // 2. 綁定事件：只有當按鈕存在時，才註冊點擊事件
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('pacetake-theme', newTheme);
            toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }
}
// 🚀 初始化區塊
document.addEventListener('DOMContentLoaded', () => {
    getBrowserLocation();
    mouseslide();
    initCitySelect(document.getElementById('citySelect'));// 負責把資料灌入指定的 Select
    /*initPullToRefresh(); // 把那個下拉刷新的功能也包在這裡*/
    initStorePage();
    initCartDOMState();//回填當前店家購物車的資料
    initThemeSystem();//網頁載入時套用顏色
    console.log("系統初始化完成");
});