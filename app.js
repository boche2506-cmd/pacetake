import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, onSnapshot, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// 在你的網頁 script 或其他 JS 檔案中：
// 接下來就可以直接呼叫這些函式了
// 例如：
// 1. firebase 設定與初始化
const firebaseConfig = {
    apiKey: "AIzaSyCkAiZCJ6L950KfYJEqubWGi1M8D03OuJI",
    authDomain: "pacetake-c6e1e.firebaseapp.com",
    projectId: "pacetake-c6e1e",
    storageBucket: "pacetake-c6e1e.firebasestorage.app",
    messagingSenderId: "1052980235056",
    appId: "1:1052980235056:web:6a06e4ac9b48f1e74896f5",
    measurementId: "G-888XL8JTHW",
};
// 在 app.js 的最後一行
export { signInAnonymously, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, collection, getDocs, doc, onSnapshot, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp };
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export const currentStoreInfo = {
    id: null,
    name: null
};
// ==========================================
// 2. 全域核心變數與資料
// ==========================================
let allStores = [];
let buyerLat = null;
let buyerLng = null;
let currentBuyerAddress = "正在獲取定位中...";
let currentUserId = null;
let activeDragItem = null;

const areaData = {
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
// 統一管理頁面上的所有元件
const storeContainer = document.getElementById('store-Container');
const citySelect = document.getElementById('citySelect');
const districtSelect = document.getElementById('districtSelect');
const gpsPinBtn = document.getElementById('gpsPinBtn');
const addressDetailLightbox = document.getElementById('addressDetailLightbox');
const modalAddressText = document.getElementById('modalAddressText');
const globalSearchInput = document.getElementById('globalSearchInput');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const toggleBtn = document.getElementById('themeToggleBtn');
const heartIcon = document.getElementById('heart-icon');
const menuContainer = document.getElementById('menuContainer');
const storeDistanceText = document.getElementById('storeDistanceText');
const cartSummaryText = document.querySelector('.cart-summary-text') || document.getElementById('cartSummaryText');
const dropdownMenu = document.getElementById('dropdownMenu');
const userNameDisplay = document.getElementById('userNameDisplay');
const loginLightbox = document.getElementById('loginLightbox');
const emailFormSection = document.getElementById('emailFormSection');
// 監聽 Firebase 登入狀態
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 使用者已經登入 (可能是匿名，也可能是正式會員)
        console.log("當前使用者 ID:", user.uid);
        console.log("是否為匿名:", user.isAnonymous);
        // 開始進行點餐或載入購物車
        handleUserSyncAndRoleRouting(user);
        renderFavoriteStores();
    } else {
        // --- 這裡是「徹底未登入」：觸發匿名登入 ---
        console.log("[PACE DEBUG] 未登入，正在觸發匿名登入...");
        signInAnonymously(auth).catch((error) => {
            console.error("匿名登入失敗:", error);
            // 如果匿名失敗，才退回到你原本的「訪客」UI 顯示
            showGuestUI();
        });
    }
});
// 這裡是「徹底未登入」：觸發匿名登入 
function showGuestUI() {
    console.log("[PACE DEBUG] 進入訪客模式 (無法取得任何身分)");
    if (userNameDisplay) userNameDisplay.innerHTML = "訪客";
    renderDynamicMenu('guest');
    fetchStoresFromFirebase();
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
            updateUIForUser(user, "buyer");
        }
    } catch (e) {
        console.error("Role routing error:", e);
    }
    fetchStoresFromFirebase();
}
// 從firebase抓資料
async function fetchStoresFromFirebase() {
    try {
        console.log("[PACE DEBUG] Fetching stores.");
        const querySnapshot = await getDocs(collection(db, "stores"));
        allStores = [];
        querySnapshot.forEach((doc) => {
            allStores.push({ id: doc.id, ...doc.data() });
        });
        filterAndRenderStores();
    } catch (error) {
        console.error("讀取店家失敗：", error);
        if (storeContainer) storeContainer.innerHTML = '<div class="loading-Spinner" style="color:var(--brand-red);">❌ 無法取得雲端店家資料</div>';
    }
}

function updateUIForUser(user, currentRole) {
    const userAvatarImg = document.getElementById('userAvatarImg');
    const defaultIcon = document.getElementById('defaultIcon');
    // 角色顯示邏輯// 如果程式執行到這裡，表示 user 一定存在，可以安心讀取資料
    if (userNameDisplay) {
        if (currentRole === "admin") {
            userNameDisplay.innerHTML = `👑 總管`;
        } else if (currentRole === "seller") {
            userNameDisplay.innerHTML = `<img src="png/logo.png" class="buyer" alt="買家圖示"> 老闆`;
        } else {
            userNameDisplay.innerHTML = `<img src="png/logo.png" class="buyer" alt="買家圖示"> 貴賓`;
        }
    }
    // 只要有圖就設給 src // 頭像處理邏輯
    if (!user.isAnonymous && user.photoURL) {
        userAvatarImg.src = user.photoURL;
        userAvatarImg.style.display = 'block'; // 顯示圖片
        defaultIcon.style.display = 'none';    // 隱藏文字
        if (statusDot && statusText) {
            statusDot.classList.add('active');
            statusText.innerText = `您好 ${user.displayName || 'PACE用戶'} ~\n目前沒有進行中的訂單喔！`;
        }
    } else {
        userAvatarImg.src = '';                // 清空 src
        userAvatarImg.style.display = 'none';  // 隱藏圖片
        defaultIcon.style.display = 'block';   // 顯示文字
        if (statusDot && statusText) {
            statusDot.classList.remove('active');
            statusText.innerText = "請連結google帳號\n或使用電子郵件登入";
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
            <div class="menu-header">店舖管理</div> <a href="seller.html?storeId=${userId}" class="nav-fast">🧑‍🍳 接單管理</a>
            <a href="manage.html?storeId=${userId}" class="nav-fast">⚙️ 店舖管理</a>
            <a href="#" class="nav-fast" data-target="pay">💵 繳費</a>
        `;
    }
    // 3. 開店連結區塊
    let registerLink = '';
    if (role === 'admin' || role === 'buyer') {
        registerLink = `<a href="register.html" class="nav-fast" style="color: var(--brand-blue); font-weight: 700;">💼 月費開店</a>`;
    }
    // 最終組合
    let adminLink = '';
    if (role === 'admin') {
        adminLink = `
        <div class="menu-divider"></div>
        <a href="javascript:void(0)" data-action="toggleAdmin" class="nav-fast" style="color: var(--brand-blue);">🔮 派思核心控制台</a>
        <a href="javascript:void(0)" data-action="issuePromo" class="nav-fast" style="color: var(--brand-green);">🎟️ 邀請碼發行</a>`;
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
    let distanceHtml = "<span>⚡ 距離未知</span>";
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
                    <span class="tag-time ${takeoutSupported ? '' : 'inactive'}">💵 現金</span>
                    <span class="tag-pay ${paySupported ? '' : 'inactive'}">💳 行動</span>
                    <span class="tag-seating ${seatingSupported ? '' : 'inactive'}">🪑 內用</span>
                </div>
            </div>
        </div>
    `;
    return card;
};
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
        if (store.status === "offline") return;
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

function getBrowserLocation() {
    // 🛡️ 守護：如果不是首頁，直接離開
    const path = window.location.pathname;
    if (path === '/' || path.includes('index.html')) {
        // 這裡是你的首頁邏輯
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                buyerLat = position.coords.latitude;
                buyerLng = position.coords.longitude;
                const currentBuyerAddress = `經度: ${buyerLng.toFixed(4)}, 緯度: ${buyerLat.toFixed(4)} (GPS 衛星精準定位)`;
                if (gpsPinBtn) gpsPinBtn.innerText = "📍 已獲取定位";
                if (modalAddressText) modalAddressText.innerText = currentBuyerAddress;
                // 確認函數存在再呼叫
                if (typeof filterAndRenderStores === 'function') {
                    filterAndRenderStores();
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
/**
 * 監聽特定欄位的變化並更新 UI的工具
 * @param {string} collectionName - 資料庫集合名稱
 * @param {string} docId - 文件 ID
 * @param {string} fieldName - 要監聽的欄位名稱
 * @param {HTMLElement} element - 要更新的 UI 元件
 */
export function setupRealtimeListener(collectionName, docId, fieldName, element) {
    const docRef = doc(db, collectionName, docId);
    // 建立監聽器
    return onSnapshot(docRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const value = data[fieldName];
        // 根據欄位類型更新 UI
        if (element.type === 'checkbox') {
            element.checked = value; // 更新開關狀態
        } else {
            element.innerText = value; // 更新文字顯示
        }
        console.log(`${fieldName} 已自動更新為:`, value);
    });
    // 將 unsubscribe 回傳出去，讓你在 app.js 可以控制
    return unsubscribe;
}
//Firebase 即時監聽
function initAppListeners() {
    // 確保元素真的存在才進行綁定，避免報錯
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
        // 分流執行：只有在 index.html 才篩選商店
        if (path.includes('index.html') || path === '/') {
            filterAndRenderStores();
        }
    }
    // 處理「區域選擇」的邏輯
    else if (action === 'districtSelect') {
        // 分流執行：只有在 index.html 才篩選商店
        if (path.includes('index.html') || path === '/') {
            filterAndRenderStores();
        }
    }
    // 3. 其他處理
    else {
        console.log('未知的 action:', action);
    }
});
// Listener'click'
document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
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
            getBrowserLocation();
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
// 封裝成一個獨立的初始化函式
function initPullToRefresh() {
    const topGroup = document.querySelector('.sticky-top-group');
    let startY = 0;
    let isReloading = false; // 加入鎖定開關，防止連點
    if (topGroup) {
        topGroup.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
            isReloading = false;
        }, { passive: true });
        topGroup.addEventListener('touchmove', (e) => {
            if (isReloading) return;
            const currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;
            if (pullDistance > 80) {
                isReloading = true;
                console.log("[PACE] 偵測到上層下拉，觸發重新整理！");
                location.reload();
            }
        }, { passive: true });
    }
}
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
        // --- 這裡放回你原有的 Firebase 讀取邏輯 ---
        let storeData = null;
        const firebaseFirestore = window.firebase ? window.firebase.firestore() : null;
        if (typeof db !== 'undefined' && typeof doc === 'function') {
            const docSnap = await getDoc(doc(db, "stores", currentStoreId));
            if (!docSnap.exists()) {
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
            if (docSnap.exists()) storeData = docSnap.data();
            console.log("Firebase 拿到的資料：", storeData); // <-- 加上這行！
            // 順便檢查一下這裡有沒有值
            console.log("Logo 欄位的值：", storeData.shopLogo);
        }
        if (!storeData) throw new Error("無法從資料庫找到該店家資料");
        window.currentStoreInfo = {
            ...storeData, // 這行會自動把 storeData 的所有欄位全部放入，無需一行行寫
            id: currentStoreId, // 確保 ID 被正確寫入
            // 如果需要對特定欄位強制處理 (例如布林值轉型)，可以在下面單獨覆寫：
            isCashPayEnabled: !!storeData.isCashPayEnabled,
            isOnlinePayEnabled: !!storeData.isOnlinePayEnabled,
            hasSeating: !!storeData.hasSeating
        };
        console.log("全域商店資訊已更新：", window.currentStoreInfo);
        if (auth.currentUser) {
            try {
                await syncHeartIcon();
            } catch (err) {
                console.error("同步愛心狀態失敗:", err);
            }
        }
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
        let displayDistance = '距離未知'; // 預設值
        if (buyerLat !== null && buyerLng !== null && !isNaN(sLat) && !isNaN(sLng)) {
            const dist = calculateDistance(buyerLat, buyerLng, sLat, sLng);
            displayDistance = dist.toFixed(1) + ' km';
        }
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${sLat},${sLng}`;
        // 2. 獲取地址文字 (確保 fallback 機制)
        const address = storeData.shopAddress || storeData.address || '地址未提供';
        // 3. 把算出來的結果填入 HTML
        document.getElementById('storeNameText').innerText = storeData.shopName || storeData.name || '未命名店家';
        document.getElementById('storeAddressText').innerHTML = `
        <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
        📍 ${address}</a>`;
        // 這裡填入我們算好的 displayDistance
        const distElement = document.getElementById('storeDistanceText');
        if (distElement) {
            distElement.innerText = '⚡ ' + displayDistance;
        }
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
        const menuList = storeData.menuList || storeData.menu || [];
        menuContainer.innerHTML = "";
        const availableItems = menuList.filter(item => item.supply !== false);
        availableItems.forEach((item, index) => {
            // 確保 ID 格式與你的 cart-manager 一致
            const itemId = `${currentStoreId}|||${item.id}`;
            const merchantNote = item.note || "";
            // 1. 抓取購物車存檔資料
            const cartData = JSON.parse(localStorage.getItem('pacetake_cart')) || [];
            const savedItem = cartData.find(c => c.id === itemId);
            const qty = savedItem ? savedItem.qty : 0;
            const buyerNote = savedItem ? savedItem.note : "";
            // 2. 判斷並產生 HTML
            let priceHTML = '';
            let basePrice = 0;
            const hasMedium = item.prices && item.prices.medium;
            if (item.priceType === 'multi') {
                // 我們直接寫死三個規格，這樣最簡單好讀
                priceHTML = `
                <div class="size-options">
                    <div class="size-row">
                        <span class="size-label" style="font-weight:bold;">大 $${item.prices.large}</span>
                        <div class="quantity-control-panel">
                            <button class="minus-btn" data-id="${itemId}_large">-</button>
                            <span class="qty-number" id="qty_${itemId}_large">0</span>
                            <button class="plus-btn" data-id="${itemId}_large">+</button>
                        </div>
                    </div>
                    <div class="size-row" style="${!hasMedium ? 'opacity: 0.5; pointer-events: none;' : ''}">
                        <span class="size-label" style="font-weight:bold;">中 $${item.prices.medium}</span>
                        <div class="quantity-control-panel">
                            <button class="minus-btn" data-id="${itemId}_medium">-</button>
                            <span class="qty-number" id="qty_${itemId}_medium">0</span>
                            <button class="plus-btn" data-id="${itemId}_medium">+</button>
                        </div>
                    </div>
                    <div class="size-row">
                        <span class="size-label" style="font-weight:bold;">小 $${item.prices.small}</span>
                        <div class="quantity-control-panel">
                            <button class="minus-btn" data-id="${itemId}_small">-</button>
                            <span class="qty-number" id="qty_${itemId}_small">0</span>
                            <button class="plus-btn" data-id="${itemId}_small">+</button>
                        </div>
                    </div>
                </div>
            `;
            } else {
                // 單一價格：這裡必須補上加減按鈕的 HTML，否則會消失
                basePrice = parseInt(item.price) || 0;
                priceHTML = `
                <div class="one-size-row">
                    <span class="food-price" style="font-weight:bold;">$${basePrice}</span>
                    <div class="quantity-control-panel">
                        <button class="minus-btn" data-id="${itemId}">-</button>
                        <span class="qty-number" id="qty_${itemId}">0</span>
                        <button class="plus-btn" data-id="${itemId}">+</button>
                    </div>
                </div>
            `;
            }
            // 3. 建立並填入卡片
            const foodCard = document.createElement('div');
            foodCard.className = 'food-card';
            foodCard.dataset.id = itemId;
            // --- 🎯 在這裡加入這些屬性 ---
            foodCard.dataset.price = basePrice; // 存入單一價格 (給非多規格商品用)
            foodCard.dataset.largePrice = item.prices?.large || 0;
            foodCard.dataset.mediumPrice = item.prices?.medium || 0;
            foodCard.dataset.smallPrice = item.prices?.small || 0;
            // ----------------------------
            foodCard.innerHTML = `
                <div class="food-img-info">
                    <div class="food-img">${item.image ? `<img src="${item.image}" style="width:100%; height:100%; border-radius:inherit; object-fit: cover; position: absolute;">` : '🍱'}</div>
                    <div class="food-info">
                    <div class="food-name-note-display">
                    <div class="food-name">${item.name || '未命名'}</div>
                    <div class="card-note-display">${merchantNote}</div>
                    </div>${priceHTML}
                    </div>
                </div>    
                <div class="note-wrapper">
                    <input type="text" class="input-style" placeholder="✍️ 填寫客製化備註..." value="${buyerNote}">
                </div>
            `;
            menuContainer.appendChild(foodCard);
        });
        // --- 事件綁定 ---
        menuContainer.addEventListener('click', (e) => {
            if (!e.target.matches('.plus-btn, .minus-btn')) return;
            const clickedBtn = e.target;
            const itemId = clickedBtn.dataset.id; // 這現在是類似 'storeId|||item_0_large' 的格式
            const card = clickedBtn.closest('.food-card');
            const qtyDisplay = clickedBtn.parentElement.querySelector('.qty-number');
            const noteInput = card.querySelector('.input-style');
            // 計算數量
            let count = parseInt(qtyDisplay.innerText);
            if (e.target.matches('.plus-btn')) count++;
            else if (count > 0) count--;
            qtyDisplay.innerText = count;
            // --- 動態獲取價格 ---
            // 邏輯：從 itemId 的後綴判斷價格
            let currentPrice = 0;
            // 從 card 的資料庫來源獲取原始商品資訊 (假設你原本的 item 資料在渲染時有存入)
            // 這裡我們簡單一點：直接用 data-id 判斷規格
            if (itemId.includes('_large')) currentPrice = parseInt(card.dataset.largePrice || 0);
            else if (itemId.includes('_medium')) currentPrice = parseInt(card.dataset.mediumPrice || 0);
            else if (itemId.includes('_small')) currentPrice = parseInt(card.dataset.smallPrice || 0);
            else currentPrice = parseInt(card.dataset.price || 0); // 單一價格
            updateLocalStorageData(
                itemId, // 傳入精確的規格 ID
                card.querySelector('.food-name').innerText,
                currentPrice,
                currentStoreId,
                qtyDisplay,
                noteInput,
                card
            );
        });
        // --- 在 initStorePage 的最後面 ---
        setTimeout(() => {
            const currentStoreId = document.body.getAttribute('data-store-id');
            const cartData = JSON.parse(localStorage.getItem('pacetake_cart')) || [];
            cartData.forEach(cartItem => {
                // cartItem.id 現在可能是 'storeId|||item_0_large'
                // 我們要找的是頁面上對應那個按鈕的 span
                const qtyDisplay = document.getElementById(`qty_${cartItem.id}`);
                if (qtyDisplay) {
                    qtyDisplay.innerText = cartItem.qty;
                }
            });
            if (typeof refreshTotalCartUI === 'function') refreshTotalCartUI();
            console.log("[PACE DEBUG] 購物車規格同步完成。");
        }, 200);
    } catch (error) {
        console.error("[PACE ERROR] 頁面渲染失敗：", error);
        menuContainer.innerHTML = "<p>無法載入店家菜單，請檢查網路連線。</p>";
    }
}
/** * 🛒 購物車管理核心 */
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
    // 1. 店家檢查邏輯
    if (localCartData.length > 0 && String(localCartData[0].storeId).trim() !== String(currentStoreId).trim()) {
        if (confirm("⚠️ 購物車內已有其他店家的商品，加入此商品將會清空前店清單，確定繼續嗎？")) {
            localCartData = [];
        } else {
            // --- 修正點：取消時，必須將畫面上的數字改回 0 (因為沒加入購物車) ---
            qtyDisplay.innerText = "0";
            return;
        }
    }
    // 2. 其餘邏輯保持不變...
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

export function initCartDOMState() {
    const cartItems = getCartData();
    const currentStoreId = document.body.getAttribute('data-store-id');
    if (!cartItems || cartItems.length === 0) return;
    cartItems.forEach(item => {
        // 確保只回填當前店家的資料
        if (String(item.storeId || "").trim() !== String(currentStoreId || "").trim()) return;
        // 直接透過 ID 找到對應的 span，例如 qty_storeId|||item_0_large
        const qtyDisplay = document.getElementById(`qty_${item.id}`);
        if (qtyDisplay) {
            qtyDisplay.innerText = item.qty;
        }
    });
}
// 🚀 初始化區塊
document.addEventListener('DOMContentLoaded', () => {
    fetchStoresFromFirebase();
    initThemeSystem();
    renderFavoriteStores();
    initCitySelect(document.getElementById('citySelect'));
    getBrowserLocation();
    initPullToRefresh(); // 把那個下拉刷新的功能也包在這裡
    initStorePage();
    refreshTotalCartUI();
    initCartDOMState();
    initAppListeners();
    console.log("系統初始化完成");
});