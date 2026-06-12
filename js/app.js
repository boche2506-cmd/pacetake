import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==========================================
// 1. firebase 設定與初始化
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCkAiZCJ6L950KfYJEqubWGi1M8D03OuJI",
    authDomain: "pacetake-c6e1e.firebaseapp.com",
    projectId: "pacetake-c6e1e",
    storageBucket: "pacetake-c6e1e.firebasestorage.app",
    messagingSenderId: "1052980235056",
    appId: "1:1052980235056:web:6a06e4ac9b48f1e74896f5",
    measurementId: "G-888XL8JTHW",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// ==========================================
// 2. 全域核心變數與資料
// ==========================================
let allStores = [];
let buyerLat = null;
let buyerLng = null;
let currentBuyerAddress = "正在獲取定位中...";
let currentUserId = null;

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

// UI 變數宣告
let themeToggleBtn, loginBtn, avatarBtn, dropdownMenu, userNameDisplay, storeContainer;
let loginLightbox, googleLoginAction, toggleEmailFormBtn, emailFormSection, customReturnBtn;
let loginEmailInput, loginPasswordInput, emailLoginAction;
let citySelect, districtSelect, gpsPinBtn, addressDetailLightbox, modalAddressText, closeAddressModalBtn, globalSearchInput;
let menuUploadList = null;
let activeDragItem = null;

// --- 2. 初始化函式 (負責把那 17 行活化) ---
    // 全部直接宣告在全域，不用包進任何函式
const userNameDisplay = document.getElementById('userNameDisplay');
const storeContainer = document.getElementById('store-container');
const googleLoginAction = document.getElementById('googleLoginAction');
const toggleEmailFormBtn = document.getElementById('toggleEmailFormBtn');
const emailFormSection = document.getElementById('emailFormSection');
const customReturnBtn = document.getElementById('customReturnBtn');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const emailLoginAction = document.getElementById('emailLoginAction');
const citySelect = document.getElementById('citySelect');
const districtSelect = document.getElementById('districtSelect');
const gpsPinBtn = document.getElementById('gpsPinBtn');
const addressDetailLightbox = document.getElementById('addressDetailLightbox');
const modalAddressText = document.getElementById('modalAddressText');
const closeAddressModalBtn = document.getElementById('closeAddressModalBtn');
const globalSearchInput = document.getElementById('globalSearchInput');
const menuUploadList = document.getElementById('menuUploadList');

// 接著是下面那 6 行
const toggleOnline = document.getElementById('toggleOnline');
const toggleCash = document.getElementById('toggleCash');
const newebpayContainer = document.getElementById('newebpayContainer');
const cashWarningModal = document.getElementById('cashWarningModal');
const warningConfirmBtn = document.getElementById('warningConfirmBtn');
const warningCancelBtn = document.getElementById('warningCancelBtn');

// ==========================================
// 3. 核心功能函式
// ==========================================
// 監聽 Firebase 登入狀態
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("[PACE DEBUG] Auth state: Logged in", user.uid);
        handleUserSyncAndRoleRouting(user);
    } else {
        console.log("[PACE DEBUG] Auth state: Logged out");
        loginBtn = document.getElementById('loginBtn');
        avatarBtn = document.getElementById('avatarBtn');
        dropdownMenu = document.getElementById('dropdownMenu');
        if (loginBtn) loginBtn.style.display = 'block';
        if (avatarBtn) {
            avatarBtn.style.display = 'none';
            dropdownMenu.style.display = 'none';
            dropdownMenu.innerHTML = '';
        }
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        if (statusDot) statusDot.classList.remove('active');
        if (statusText) statusText.innerText = "請連結google帳號\n或使用電子郵件登入";
        if (userNameDisplay) userNameDisplay.innerHTML = "訪客";
        renderDynamicMenu('guest');
        fetchStoresFromFirebase();
    }
});
async function handleUserSyncAndRoleRouting(user) {
    if (!user) return;
    currentUserId = user.uid;
    console.log("[PACE DEBUG] User synced:", user.uid);

    let currentRole = "buyer";
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentRole = userDoc.data().role || "buyer";
        } else {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                role: "buyer",
                createdAt: new Date().toISOString()
            });
        }
    } catch (e) {
        console.error("Role routing error:", e);
    }

    updateUIForUser(user, currentRole);
    fetchStoresFromFirebase();
}
function initTheme() {
    console.log("[PACE DEBUG] 函式被呼叫了！");
    const savedTheme = localStorage.getItem('pacetake-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

function updateUIForUser(user, currentRole) {
    loginBtn = document.getElementById('loginBtn');
    avatarBtn = document.getElementById('avatarBtn');
    loginLightbox = document.getElementById('loginLightbox');
    userNameDisplay = document.getElementById('userNameDisplay');

    if (loginBtn) loginBtn.style.display = 'none';
    if (avatarBtn) avatarBtn.style.display = 'flex';
    if (loginLightbox) loginLightbox.style.display = 'none';

    if (userNameDisplay) {
        if (currentRole === "admin") {
            userNameDisplay.innerHTML = `👑 總管`;
        } else if (currentRole === "seller") {
            userNameDisplay.innerHTML = `🏪 老闆`;
        } else {
            userNameDisplay.innerHTML = `<img src="png/logo.png" class="buyer" alt="買家圖示"> 貴賓`;
        }
    }

    const userAvatarImg = document.getElementById('userAvatarImg');
    const defaultIcon = document.getElementById('defaultIcon');
    if (user.photoURL && userAvatarImg && defaultIcon) {
        userAvatarImg.src = user.photoURL;
        userAvatarImg.style.display = 'block';
        defaultIcon.style.display = 'none';
    } else if (defaultIcon) {
        if (userAvatarImg) userAvatarImg.style.display = 'none';
        defaultIcon.style.display = 'block';
    }

    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    if (statusDot) statusDot.classList.add('active');
    if (statusText) statusText.innerText = `您好 ${user.displayName || 'PACE用戶'} ~\n目前沒有進行中的訂單喔！`;

    renderDynamicMenu(currentRole);
}

function renderDynamicMenu(role) {
    const menuContainer = document.getElementById('dropdownMenu');
    if (!menuContainer) return;

    let menuHTML = '';

    menuHTML += `
        <a href="orders.html" class="nav-fast">🛒 我的訂單</a>
        <a href="history.html" class="nav-fast">⏳ 歷史訂單</a>
    `;

    if (role === 'buyer' || role === 'admin') {
        menuHTML += `<a href="register.html" class="nav-fast" style="color: var(--brand-blue); font-weight: 700;">💼 月費開店(暫不收費)</a>`;
    }

    if (role === 'seller' || role === 'admin') {
        menuHTML += `
            <div class="menu-divider"></div>
            <a href="seller.html" class="nav-fast">🧑‍🍳 接單管理</a>
            <a href="manage.html" class="nav-fast">⚙️ 店舖管理</a>
            <a href="#" class="nav-fast" data-target="pay">💵 繳費</a>
        `;
    }

    if (role === 'admin') {
        menuHTML += `
            <div class="menu-divider"></div>
            <a href="javascript:void(0)" onclick="window.toggleView('admin')" class="nav-fast" style="color: var(--brand-blue);">🔮 派思核心控制台</a>
            <a href="javascript:void(0)" onclick="window.issuePromoCode()" class="nav-fast" style="color: var(--brand-green);">🎟️ 邀請碼發行</a>
            
        `;
    }

    menuHTML += `
        <div class="menu-divider"></div>
        <button id="logoutBtn" style="color: var(--brand-red); width: 100%; text-align: left; padding: 2cqw; background: none; border: none; cursor: pointer; font-size: 5cqw;">🚪 登出系統</button>
    `;

    dropdownMenu.innerHTML = menuHTML;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log("[PACE DEBUG] Logout clicked.");
            try {
                await signOut(auth);
                location.reload();
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }
}

async function fetchStoresFromFirebase() {
    try {
        console.log("[PACE DEBUG] Fetching stores.");
        const querySnapshot = await getDocs(collection(db, "stores"));
        allStores = [];
        querySnapshot.forEach((doc) => {
            allStores.push({ id: doc.id, ...doc.data() });
        });
        filterAndRenderStores();
        renderAdminTable();
    } catch (error) {
        console.error("讀取店家失敗：", error);
        if (storeContainer) storeContainer.innerHTML = '<div class="loading-Spinner" style="color:var(--brand-red);">❌ 無法取得雲端店家資料</div>';
    }
}

function filterAndRenderStores() {
    if (!storeContainer) return;

    // 1. 抓取篩選條件
    const citySelect = document.getElementById('citySelect');
    const districtSelect = document.getElementById('districtSelect');
    const globalSearchInput = document.getElementById('globalSearchInput');

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
        storeContainer.innerHTML = '<div class="loading-Spinner">🍃 此商圈目前尚無合作店家進駐喔！</div>';
        return;
    }

    // 4. 清空畫面並開始渲染卡片
    storeContainer.innerHTML = "";

    filtered.forEach(store => {
        if (store.status === "offline") return;

        // 基本資料準備
        const finalName = store.shopName || store.name || '未命名店家';
        const finalAddress = store.shopAddress || store.address || '';
        const takeoutSupported = store.isCashPayEnabled !== false;
        const paySupported = store.isOnlinePayEnabled !== false;

        // 照片處理 (優先顯示 shopLogo)
        const logoData = store.shopLogo || store.emoji || '🏪';
        let finalLogoHtml = logoData;
        if (logoData && (logoData.startsWith('data:image') || logoData.startsWith('http'))) {
            finalLogoHtml = `<img src="${logoData}" style="width:100%; height:100%; object-fit:cover; border-radius:3cqw;">`;
        }

        // 距離計算處理
        let distanceHtml = "<span>⚡ 距離未知</span>";
        // 確保 buyerLat/Lng 已定義且店家有座標
        if (typeof buyerLat !== 'undefined' && typeof buyerLng !== 'undefined' && buyerLat !== null && buyerLng !== null && store.lat && store.lng) {
            const dist = calculateDistance(buyerLat, buyerLng, store.lat, store.lng);
            distanceHtml = `<span>⚡ ${dist.toFixed(1)} km</span>`;
        }

        // 生成卡片
        const card = document.createElement('a');
        card.href = `store.html?storeId=${store.id}`;
        card.className = 'store-card';
        card.innerHTML = `
            <div class="store-img">${finalLogoHtml}</div>
            <div class="store-info">
                <div class="store">
                    <div class="store-name">${finalName}</div>
                    <div class="store-meta">📍 ${finalAddress} • ${distanceHtml}</div>
                </div>
                <div class="store-tags">
                    <span class="tag-time ${takeoutSupported ? '' : 'inactive'}">💵 現金支付</span>
                    <span class="tag-pay ${paySupported ? '' : 'inactive'}">💳 支援行動支付</span>
                </div>
            </div>
        `;
        storeContainer.appendChild(card);
    });
}

function getBrowserLocation() {
    gpsPinBtn = document.getElementById('gpsPinBtn');
    modalAddressText = document.getElementById('modalAddressText');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                buyerLat = position.coords.latitude;
                buyerLng = position.coords.longitude;
                currentBuyerAddress = `經度: ${buyerLng.toFixed(4)}, 緯度: ${buyerLat.toFixed(4)} (GPS 衛星精準定位)`;
                if (gpsPinBtn) gpsPinBtn.innerText = "📍 已獲取定位";
                if (modalAddressText) modalAddressText.innerText = currentBuyerAddress;
                // 💡【新增這行】定位成功後，立刻重新渲染首頁卡片來顯示距離！
                filterAndRenderStores();
            },
            (error) => {
                currentBuyerAddress = "瀏覽器定位遭拒，請手動選擇下拉選單縣市。";
                if (gpsPinBtn) gpsPinBtn.innerText = "📍 無法定位";
                if (modalAddressText) modalAddressText.innerText = currentBuyerAddress;
            }
        );
    } else {
        currentBuyerAddress = "您的裝置不支援 GPS 定位裝置。";
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('adminStoreTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (allStores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1cqw; color:#aaa;">目前雲端尚無店家資料</td></tr>';
        return;
    }
    allStores.forEach(store => {
        const finalName = store.shopName || store.name || '未命名店家';
        const finalAddress = store.shopAddress || store.address || '';
        const phone = store.phone || '無資料';
        const statusText = store.status === 'offline' ? '🔴 下線' : '🟢 上線';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 1cqw; border: 0.2cqw solid #3a3a3a; color: #ffca28; font-weight: bold;">${finalName}</td>
            <td style="padding: 1cqw; border: 0.2cqw solid #3a3a3a; color: #bbb;">${store.city || ''}${store.district || ''} ${finalAddress}</td>
            <td style="padding: 1cqw; border: 0.2cqw solid #3a3a3a; color: #bbb;">${phone}</td>
            <td style="padding: 1cqw; border: 0.2cqw solid #3a3a3a; text-align: center; color: ${store.status === 'offline' ? '#ef4444' : '#10b981'}; font-weight: bold;">${statusText}</td>
            <td style="padding: 1cqw; border: 0.2cqw solid #3a3a3a; text-align: center;">
                <button onclick="window.deleteStore('${store.id}')" style="padding: 1cqw 2cqw; background: #ef4444; color: white; border: none; border-radius: 1cqw; cursor: pointer; font-weight: bold;">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// ==========================================
// 📍 計算兩點經緯度距離 (回傳公里數)
// ==========================================
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

// ==========================================
// 4. 初始化與事件綁定
// ==========================================

function bindHeaderEvents() {
    console.log("[PACE DEBUG] bindHeaderEvents() started.");
    themeToggleBtn = document.getElementById('themeToggleBtn');
    loginBtn = document.getElementById('loginBtn');
    avatarBtn = document.getElementById('avatarBtn');
    dropdownMenu = document.getElementById('dropdownMenu');
    loginLightbox = document.getElementById('loginLightbox');

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('pacetake-theme', newTheme);
            themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    if (avatarBtn && dropdownMenu) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (!avatarBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log("[PACE DEBUG] Login button clicked.");
            if (loginLightbox) loginLightbox.style.display = 'flex';
        });
    }

    if (auth.currentUser) {
        updateUIForUser(auth.currentUser, 'buyer'); // 角色會由 handleUserSyncAndRoleRouting 修正
    }
}

// 頁面固定元件事件綁定
if (customReturnBtn) customReturnBtn.addEventListener('click', () => {
    console.log("[PACE DEBUG] Custom return clicked.");
    loginLightbox = document.getElementById('loginLightbox');
    if (loginLightbox) loginLightbox.style.display = 'none';
});

if (toggleEmailFormBtn) {
    toggleEmailFormBtn.addEventListener('click', () => {
        console.log("[PACE DEBUG] Toggle email form.");
        if (emailFormSection) emailFormSection.style.display = emailFormSection.style.display === 'none' ? 'block' : 'none';
    });
}

const togglePasswordVisibility = document.getElementById('togglePasswordVisibility');
if (togglePasswordVisibility && loginPasswordInput) {
    togglePasswordVisibility.addEventListener('click', function () {
        const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        loginPasswordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });
}

if (gpsPinBtn) {
    gpsPinBtn.addEventListener('click', () => {
        console.log("[PACE DEBUG] GPS Pin clicked.");
        getBrowserLocation();
        if (addressDetailLightbox) addressDetailLightbox.style.display = 'flex';
    });
}
if (closeAddressModalBtn) closeAddressModalBtn.addEventListener('click', () => { addressDetailLightbox.style.display = 'none'; });

if (citySelect) {
    Object.keys(areaData).forEach(city => {
        const opt = document.createElement('option');
        opt.value = city; opt.innerText = city; citySelect.appendChild(opt);
    });
    citySelect.addEventListener('change', () => {
        const selectedCity = citySelect.value;
        if (districtSelect) {
            districtSelect.innerHTML = '<option value="">選擇區域</option>';
            if (areaData[selectedCity]) {
                areaData[selectedCity].forEach(dist => {
                    const opt = document.createElement('option');
                    opt.value = dist; opt.innerText = dist; districtSelect.appendChild(opt);
                });
            }
        }
        filterAndRenderStores();
    });
}
if (districtSelect) districtSelect.addEventListener('change', filterAndRenderStores);
if (globalSearchInput) globalSearchInput.addEventListener('input', filterAndRenderStores);

if (googleLoginAction) {
    googleLoginAction.addEventListener('click', async () => {
        console.log("[PACE DEBUG] Google login action.");
        try {
            const result = await signInWithPopup(auth, provider);
            await handleUserSyncAndRoleRouting(result.user);
        } catch (error) {
            console.error("Google 登入失敗：", error);
            alert("連線失敗，請檢查網路服務！");
        }
    });
}

if (emailLoginAction) {
    emailLoginAction.addEventListener('click', async () => {
        console.log("[PACE DEBUG] Email login action.");
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;
        if (!email || !password) {
            alert("密碼或 Email 欄位不可為空！");
            return;
        }
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await handleUserSyncAndRoleRouting(result.user);
        } catch (loginError) {
            if (loginError.code === "auth/user-not-found" || loginError.code === "auth/invalid-credential") {
                try {
                    const result = await createUserWithEmailAndPassword(auth, email, password);
                    await handleUserSyncAndRoleRouting(result.user);
                } catch (regError) {
                    alert("註冊密碼強度不足，或帳號已被佔用！");
                }
            } else {
                alert("登入密碼有誤，請再確認一次！");
            }
        }
    });
}

// 賣家註冊專區初始化
const shopCity = document.getElementById('shopCity');
const shopDistrict = document.getElementById('shopDistrict');
if (shopCity) {
    Object.keys(areaData).forEach(city => {
        const opt = document.createElement('option');
        opt.value = city; opt.innerText = city; shopCity.appendChild(opt);
    });
    shopCity.addEventListener('change', () => {
        const selectedCity = shopCity.value;
        if (shopDistrict) {
            shopDistrict.innerHTML = '<option value="">選擇區域</option>';
            if (areaData[selectedCity]) {
                areaData[selectedCity].forEach(dist => {
                    const opt = document.createElement('option');
                    opt.value = dist; opt.innerText = dist; shopDistrict.appendChild(opt);
                });
            }
        }
    });
}

// 監聽詳細地址輸入框，當離開欄位時自動查詢
document.getElementById('shopAddress')?.addEventListener('blur', () => {
    const city = document.getElementById('shopCity').value;
    const district = document.getElementById('shopDistrict').value;
    const detail = document.getElementById('shopAddress').value.trim();

    if (!city || !district || !detail) return;

    const fullAddress = `${city}${district}${detail}`;
    console.log("[PACE] 使用 Google API 查詢：", fullAddress);

    // 初始化 Google Geocoder
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ 'address': fullAddress }, (results, status) => {
        if (status === 'OK') {
            const location = results[0].geometry.location;
            // 填入經緯度欄位
            document.getElementById('shopLat').value = location.lat();
            document.getElementById('shopLng').value = location.lng();
            console.log("[PACE] Google 定位成功！");
        } else {
            console.warn("[PACE] Google 定位失敗，狀態：" + status);
        }
    });
});

if (newebpayContainer) {
    newebpayContainer.innerHTML = `
            <label style="display:block; font-size:4cqw; font-weight:600;">🔒 藍新金流 API 開發參數設定</label>
            <div style="display:flex; flex-direction:column; gap:0.5cqw;">
                <input type="text" id="merchantIdInput" class="input-style" style="height:8cqw;" placeholder="請輸入 商店代號 (MerchantID)">
                <input type="text" id="hashKeyInput" class="input-style" style="height:8cqw;" placeholder="請輸入 HashKey">
                <input type="text" id="hashIvInput" class="input-style" style="height:8cqw;" placeholder="請輸入 HashIV">
            </div>
        `;
}

if (toggleOnline) {
    toggleOnline.addEventListener('change', function () {
        if (newebpayContainer) newebpayContainer.style.display = this.checked ? 'block' : 'none';
    });
}

// toggleCash 開啟警告邏輯
if (toggleCash) {
    toggleCash.checked = false;
    toggleCash.addEventListener('click', function (e) {
        console.log("[PACE DEBUG] toggleCash clicked.");
        if (this.checked) {
            this.checked = false;
            e.preventDefault();
            if (cashWarningModal) cashWarningModal.style.display = 'flex';
        }
    });
}

if (warningConfirmBtn) {
    warningConfirmBtn.addEventListener('click', () => {
        console.log("[PACE DEBUG] Cash warning confirmed.");
        if (toggleCash) toggleCash.checked = true;
        if (cashWarningModal) cashWarningModal.style.display = 'none';
    });
}
if (warningCancelBtn) {
    warningCancelBtn.addEventListener('click', () => {
        console.log("[PACE DEBUG] Cash warning cancelled.");
        if (toggleCash) toggleCash.checked = false;
        if (cashWarningModal) cashWarningModal.style.display = 'none';
    });
}

if (menuUploadList) {
    document.querySelectorAll('.menu-item-row').forEach(row => makeItemDraggable(row));
}

const addItemRowBtn = document.getElementById('addItemRowBtn');
if (addItemRowBtn && menuUploadList) {
    addItemRowBtn.addEventListener('click', () => {
        console.log("[PACE DEBUG] Add item row clicked.");
        const newRow = document.createElement('div');
        newRow.className = 'menu-upload-list';
        newRow.innerHTML = `
                <div class="menu-item-row">
                        <div class="menu-item">
                            <div class="img-upload-box" onclick="triggerUpload(this)">
                                <input type="file" class="image-input" accept="image/*" style="display: none;"
                                    onchange="previewImage(this)">
                                <img class="preview-img" src=""
                                    style="display: none; width: 100%; height: 100%; object-fit: cover; border-radius: 2cqw;">
                                <div class="upload-placeholder"
                                    style="font-size: 8cqw; width: 17cqw; height: 17cqw; border: 0.2cqw dashed var(--border-color); border-radius: 2cqw; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                    📷<span>上傳照片</span></div>
                            </div>
                            <div class="item-fields" style="width: 100%; gap: 0.5cqw;">
                                <input type="text" class="input-style item-name-input"
                                    style="height:8cqw; width: 100%; padding: 0 2cqw;" placeholder="品項名稱" required>
                                <div class="price-input-wrapper">
                                    <span class="price-symbol">$</span>
                                    <input type="number" class="input-style price-input"
                                        style="height:8cqw; width: 100%;padding-left:5cqw;" placeholder="金額" min="0"
                                        required>
                                </div>
                            </div>
                            <button type="button" class="new-size" onclick="toggleSizeFields(this)">如需規格</button>
                            <div class="item-right-ctrls"
                                style="gap: 0.5cqw; display: flex; flex-direction: column; justify-content: center;">
                                <div class="drag-handle"
                                    style="width: 8cqw; height: 8cqw; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 3cqw; cursor: grab;">
                                    ☰</div>
                                <button type="button" class="del-row-btn" onclick="deleteRow(this)"
                                    style="width: 8cqw; height: 8cqw; display: flex; align-items: center; justify-content: center; font-size: 3cqw;">❌</button>
                            </div>
                        </div>
                        <div class="new-size-price"
                            style="display: none; height: 8cqw; width: 100%; flex-direction: row; justify-content: space-around; gap: 1cqw;">
                            <div class="price-input-wrapper">
                                <span class="price-symbol">大$</span>
                                <input type="number" class="input-style price-input-large"
                                    style="height:8cqw; flex: 1;padding-left:7cqw;" placeholder="金額" min="0" required>
                            </div>
                            <div class="price-input-wrapper">
                                <span class="price-symbol">中$</span>
                                <input type="number" class="input-style price-input-medium"
                                    style="height:8cqw; flex: 1;padding-left:7cqw;" placeholder="金額" min="0" required>
                            </div>
                            <div class="price-input-wrapper">
                                <span class="price-symbol">小$</span>
                                <input type="number" class="input-style price-input-small"
                                    style="height:8cqw; flex: 1;padding-left:7cqw;" placeholder="金額" min="0" required>
                            </div>
                        </div>
                        <div class="remark" style="width: 100%; gap: 1cqw">
                            <input type="text" class="input-style item-note-input" style="height: 8cqw; max-width: 80%;"
                                placeholder="備註">
                            <label class="menu-soldout-switch"><input type="checkbox" class="menu-soldout-toggle">
                                <span class="toggle-slider">
                                    <span class="on-text">販售中</span>
                                    <span class="off-text">暫停</span>
                                </span>
                            </label>
                        </div>
                    </div>
            `;
        menuUploadList.appendChild(newRow);
        makeItemDraggable(newRow);
    });
}

// 確保只有在 register.html 才執行這段檢查
if (window.location.pathname.includes('register.html')) {

    // 你的原本的檢查邏輯
    const shopSubmitBtn = document.getElementById('shopSubmitBtn');
    if (shopSubmitBtn) {
        shopSubmitBtn.addEventListener('click', (e) => {
            const lat = document.getElementById('shopLat')?.value.trim();
            const lng = document.getElementById('shopLng')?.value.trim();

            if (!lat || !lng) {
                e.preventDefault(); // 阻止送出
                alert("⚠️ 請先確認店鋪經緯度！若無法自動取得，請點擊「查詢座標」按鈕手動輸入，確保定位正確喔！");
                document.getElementById('shopLat')?.focus();
                return;
            }
            // ... 後續的送出邏輯
        });
    }
}

// ... 下方原本的資料組合與儲存邏輯 ...

// shopSubmitBtn 監聽與手動提交邏輯
const shopSubmitBtn = document.getElementById('shopSubmitBtn');
if (shopSubmitBtn) {
    shopSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) { alert("【PACE 提示】開鋪前請先登入帳號喔！"); return; }

        // 1. 基本資訊與防呆
        const name = document.getElementById('shopName')?.value.trim();
        const phone = document.getElementById('shopPhone')?.value.trim();
        const city = document.getElementById('shopCity')?.value;
        const district = document.getElementById('shopDistrict')?.value;
        const detailAddress = document.getElementById('shopAddress')?.value.trim();

        if (!name || !phone || !city || !district || !detailAddress) {
            alert("⚠️ 請填寫完整的店舖資訊！");
            return;
        }
        // 1. (續) 補上剛剛漏掉的變數抓取
        const lat = document.getElementById('shopLat')?.value.trim() || '';
        const lng = document.getElementById('shopLng')?.value.trim() || '';
        const inviteCode = document.getElementById('shopInviteCode')?.value.trim() || '';
        const status = document.getElementById('shopStatus')?.value || 'online';
        const prepareTime = parseInt(document.getElementById('prepareTimeInput')?.value) || 15;

        const logoEl = document.getElementById('shopLogoPreview');
        const shopLogoData = (logoEl && logoEl.style.display !== 'none') ? logoEl.src : "";

        const merchantIdValue = document.getElementById('merchantIdInput')?.value.trim() || '';
        const hashKeyValue = document.getElementById('hashKeyInput')?.value.trim() || '';
        const hashIvValue = document.getElementById('hashIvInput')?.value.trim() || '';

        // --- 然後才是你上面的 shopData 定義 ---

        // 2. 菜單打包 (乾淨版)
        const menuRows = document.querySelectorAll('.menu-item-row');
        const menuItems = [];

        menuRows.forEach(row => {
            const nameVal = row.querySelector('.item-name-input').value.trim();
            if (!nameVal) return; // 沒填品項名就跳過

            const isSizeMode = row.querySelector('.new-size-price').style.display === 'flex';

            let itemObj = {
                name: nameVal,
                note: row.querySelector('.item-note-input').value.trim(),
                image: row.querySelector('.preview-img').src
            };

            if (isSizeMode) {
                itemObj.priceType = 'multi';
                itemObj.prices = {
                    large: row.querySelector('.price-input-large').value,
                    medium: row.querySelector('.price-input-medium').value,
                    small: row.querySelector('.price-input-small').value
                };
            } else {
                itemObj.priceType = 'single';
                itemObj.price = parseInt(row.querySelector('.price-input').value) || 0;
            }
            menuItems.push(itemObj); // 只在這裡 push 一次
        });
        // 3. 組裝資料物件 (這裡填入所有你剛剛抓取的欄位)
        const shopData = {
            sellerUid: user.uid,
            shopName: name,
            shopPhone: phone,
            shopAddress: `${city}${district}${detailAddress}`,
            shopLat: lat,
            shopLng: lng,
            inviteCode: inviteCode,
            status: status,
            shopLogo: shopLogoData,
            prepareTime: prepareTime,
            isOnlinePayEnabled: isOnlinePayEnabled,
            isCashPayEnabled: isCashPayEnabled,
            // 這是你原本有的金流設定
            newebpayConfig: {
                MerchantID: merchantIdValue,
                HashKey: hashKeyValue,
                HashIV: hashIvValue
            },
            menuList: menuItems, // 這是剛剛打包好的菜單陣列
            createdAt: new Date().toISOString()
        };

        // 4. 送出
        shopSubmitBtn.disabled = true;
        try {
            await setDoc(doc(db, "stores", user.uid), shopData);

            // 權限更新
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { role: "seller" });

            alert("🎉 開張成功！");
            window.location.href = "seller.html";
        } catch (dbError) {
            alert("錯誤：" + dbError.message);
            shopSubmitBtn.disabled = false;
        }
    });
}

// ==========================================
// 拖曳菜單專屬函式區 (賣家)
// ==========================================
function makeItemDraggable(row) {
    const handle = row.querySelector('.drag-handle');
    if (!handle) return;
    handle.addEventListener('mousedown', (e) => startDrag(e, row));
    handle.addEventListener('touchstart', (e) => startDrag(e, row), { passive: false });
}

function startDrag(e, row) {
    if (e.cancelable) e.preventDefault();
    activeDragItem = row;
    row.style.opacity = '0.5';
    row.style.border = '0.2cqw dashed var(--brand-blue)';
    if (e.type.startsWith('touch')) {
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    } else {
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
    }
}

function onDragMove(e) {
    if (!activeDragItem || !menuUploadList) return;
    if (e.cancelable) e.preventDefault();
    const currentY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    const siblings = [...menuUploadList.querySelectorAll('.menu-item-row:not([style*="dashed"])')];
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        return currentY <= box.top + box.height / 2;
    });
    nextSibling ? menuUploadList.insertBefore(activeDragItem, nextSibling) : menuUploadList.appendChild(activeDragItem);
}

function onDragEnd() {
    if (!activeDragItem) return;
    activeDragItem.style.opacity = '1';
    activeDragItem.style.border = '0.2cqw solid var(--border-color)';
    activeDragItem = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onDragMove);
    window.removeEventListener('touchend', onDragEnd);
}

// === 將這段整段替換掉原本的 menuManagementList.addEventListener ===
// 💡 加上 if 判斷安全守護，確保只有在有該元素的頁面才執行，避免 store.html 崩潰
if (menuUploadList) {
    menuUploadList.addEventListener('change', (e) => {
        if (e.target.classList.contains('menu-soldout-toggle') || e.target.classList.contains('soldout-toggle')) {
            const isChecked = e.target.checked;
            const card = e.target.closest('.menu-item-row');

            if (card) {
                if (isChecked) {
                    card.classList.add('sold-out');
                } else {
                    card.classList.remove('sold-out');
                }
            }
        }
    });
}

function toggleSizeFields(btn) {
    // 1. 找到當前這列餐點的根容器
    const menuItem = btn.closest('.menu-item-row');

    // 2. 找到原本的金額欄位 (原本的 price-input)
    const mainPriceInput = menuItem.querySelector('.price-input');

    // 3. 找到我們剛剛新增的規格容器 (new-size-price)
    const sizePriceContainer = menuItem.querySelector('.new-size-price');

    // 4. 切換狀態：如果顯示就隱藏，如果隱藏就顯示
    if (sizePriceContainer.style.display === 'none' || sizePriceContainer.style.display === '') {
        // 啟用規格模式
        sizePriceContainer.style.display = 'flex';

        // 禁止輸入原始金額，並加上橫線效果
        mainPriceInput.disabled = true;
        mainPriceInput.style.textDecoration = 'line-through';
        mainPriceInput.style.backgroundColor = '#f0f0f0'; // 加點灰底表示不可用
        mainPriceInput.required = false;
    } else {
        // 恢復原始模式
        sizePriceContainer.style.display = 'none';

        // 恢復原始金額欄位
        mainPriceInput.disabled = false;
        mainPriceInput.style.textDecoration = 'none';
        mainPriceInput.style.backgroundColor = '';
        mainPriceInput.required = true;
    }
}

// ==========================================
// 7. Window 全域綁定區 (給 HTML onclick 呼叫)
// ==========================================

window.deleteRow = function (btn) {
    menuUploadList = document.getElementById('menuUploadList');
    if (!menuUploadList) return;
    const rows = menuUploadList.querySelectorAll('.menu-item-row');
    if (rows.length <= 1) { alert("報告老闆，店裡至少要留一項商品才能開張喔！"); return; }
    btn.closest('.menu-item-row').remove();
};

window.triggerUpload = function (box) {
    const fileInput = box.querySelector('.image-input');
    if (fileInput) fileInput.click();
};

//「避免使用者上傳太大張的照片導致網頁卡頓或伺服器負擔」
window.previewImage = function (input) {
    const box = input.parentElement;
    const img = box.querySelector('.preview-img');
    const placeholder = box.querySelector('.upload-placeholder');

    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const tempImg = new Image();
            tempImg.src = e.target.result;

            tempImg.onload = function () {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // 限制最大寬度為 800px，你可以自行調整
                const scaleSize = MAX_WIDTH / tempImg.width;

                // 如果圖片大於設定寬度，才進行縮小
                if (tempImg.width > MAX_WIDTH) {
                    canvas.width = MAX_WIDTH;
                    canvas.height = tempImg.height * scaleSize;
                } else {
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                }

                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);

                // 將圖片轉為 base64，品質設為 0.7 (70%)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

                // 更新預覽區
                img.src = compressedDataUrl;
                img.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';

                console.log("[PACE] 圖片壓縮完成，新尺寸:", canvas.width, "x", canvas.height);
            };
        };
        reader.readAsDataURL(file);
    }
};

const adminSubmitStoreBtn = document.getElementById('adminSubmitStoreBtn');
if (adminSubmitStoreBtn) {
    adminSubmitStoreBtn.addEventListener('click', async () => {
        const name = document.getElementById('adminNewStoreName')?.value.trim() || '';
        const phone = document.getElementById('adminNewStorePhone')?.value.trim() || '';
        const city = document.getElementById('adminNewStoreCity')?.value || '';
        const district = document.getElementById('adminNewStoreDistrict')?.value.trim() || '';
        const address = document.getElementById('adminNewStoreAddress')?.value.trim() || '';
        const inviteCode = document.getElementById('adminNewStoreInviteCode')?.value.trim() || '';
        const status = document.getElementById('adminNewStoreStatus')?.value || 'online';
        const isCashPayEnabled = document.getElementById('adminNewStoreHasTakeout') ? document.getElementById('adminNewStoreHasTakeout').checked : true;
        const isOnlinePayEnabled = document.getElementById('adminNewStoreHasPay') ? document.getElementById('adminNewStoreHasPay').checked : true;

        if (!name || !district || !address) {
            alert("⚠️ 店名、區域、詳細地址為必填項目！");
            return;
        }

        adminSubmitStoreBtn.innerText = "⏳ 正在同步至雲端...";
        try {
            await addDoc(collection(db, "stores"), {
                name: name, shopName: name, phone: phone, city: city, district: district,
                address: address, shopAddress: address, isCashPayEnabled: isCashPayEnabled,
                isOnlinePayEnabled: isOnlinePayEnabled, status: status, inviteCode: inviteCode,
                menu: [], createdAt: new Date().toISOString()
            });
            alert("✅ 店家已成功新增至雲端！");
            fetchStoresFromFirebase();
        } catch (error) {
            console.error("新增店家失敗:", error);
            alert("新增失敗，請檢查網路或資料庫權限！");
        } finally {
            adminSubmitStoreBtn.innerText = "✅ 確認新增店家至雲端";
        }
    });
}

window.deleteStore = async function (storeId) {
    if (confirm("⚠️ 確定要從 Firebase 徹底刪除這個店家嗎？(刪除後無法恢復)")) {
        try {
            await deleteDoc(doc(db, "stores", storeId));
            alert("🗑️ 店家已從雲端刪除！");
            fetchStoresFromFirebase();
        } catch (error) {
            console.error("刪除店家失敗:", error);
            alert("刪除失敗，請檢查網路或資料庫權限！");
        }
    }
};

window.toggleView = function (view) {
    const adminEl = document.getElementById('adminView');
    const buyerEl = document.getElementById('buyerView');
    if (view === 'admin') {
        if (adminEl) adminEl.style.display = 'block';
        if (buyerEl) buyerEl.style.display = 'none';
        window.scrollTo(0, 0);
    } else {
        if (adminEl) adminEl.style.display = 'none';
        if (buyerEl) buyerEl.style.display = 'block';
    }
};

window.issuePromoCode = async function () {
    const code = prompt('請輸入要發行的VIP 邀請碼 (例如: PACE2026):');
    if (!code || code.trim() === "") return;
    try {
        await setDoc(doc(db, "promoCodes", code.trim()), {
            code: code.trim(), createdBy: currentUserId, createdAt: new Date().toISOString(),
            isActive: true, usedBy: null
        });
        alert(`🎟️ 邀請碼「${code}」已成功寫入 Firebase！`);
    } catch (error) {
        console.error("邀請碼發行失敗:", error);
        alert("發行失敗，請檢查您的系統權限配置！");
    }
};

window.addEventListener('DOMContentLoaded', () => {
    const topGroup = document.querySelector('.sticky-top-group');
    let startY = 0;

    if (topGroup) {
        // 監聽手指按下的瞬間
        topGroup.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
        }, { passive: true });

        // 監聽手指往下滑動的距離
        topGroup.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;

            // 💡 當在頂端列「往下拉」超過 80px 時，直接重新整理網頁！
            if (pullDistance > 80) {
                console.log("[PACE] 偵測到上層下拉，觸發重新整理！");
                location.reload();
            }
        }, { passive: true });
    }
});

// ==========================================
// 🎯 PACE 專屬：store.html 終極完美動態渲染模組 (含首頁卡片替換、加減鍵、備註欄)
// ==========================================
async function initStorePage() {
    const menuContainer = document.getElementById('menuContainer');
    if (!menuContainer) return;

    console.log("[PACE DEBUG] 啟動點餐頁面終極渲染程序...");

    const urlParams = new URLSearchParams(window.location.search);
    const currentStoreId = urlParams.get('storeId');

    if (!currentStoreId) {
        alert("❌ 找不到店家資訊，將返回首頁！");
        window.location.href = "index.html";
        return;
    }

    try {
        let storeData = null;
        // ... (保持你原有的 Firebase 讀取邏輯不變) ...
        const firebaseFirestore = window.firebase ? window.firebase.firestore() : null;
        if (typeof db !== 'undefined') {
            try {
                if (typeof doc === 'function' && typeof getDoc === 'function') {
                    const docRef = doc(db, "stores", currentStoreId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) storeData = docSnap.data();
                }
            } catch (innerErr) { }
        }
        if (!storeData) {
            const fallbackDb = typeof db !== 'undefined' ? db : firebaseFirestore;
            if (fallbackDb && typeof fallbackDb.collection === 'function') {
                const docSnap = await fallbackDb.collection("stores").doc(currentStoreId).get();
                if (docSnap.exists) storeData = docSnap.data();
            } else if (fallbackDb && typeof fallbackDb.doc === 'function') {
                const docSnap = await fallbackDb.doc("stores/" + currentStoreId).get();
                if (typeof docSnap.data === 'function') storeData = docSnap.data();
            }
        }

        // --- 2. 開始渲染畫面 ---
        if (storeData) {
            // 基礎資訊填入
            const nameEl = document.getElementById('storeNameText');
            const addrEl = document.getElementById('storeAddressText');
            const distEl = document.getElementById('storeDistanceText');

            if (nameEl) nameEl.innerText = storeData.shopName || storeData.name || '未命名店家';
            if (addrEl) addrEl.innerText = '📍 ' + (storeData.shopAddress || storeData.address || '');
            if (distEl) distEl.innerText = '⚡ ' + (typeof dist !== 'undefined' ? dist + ' km' : '0.05 km');

            const menuList = storeData.menuList || storeData.menu || [];
            menuContainer.innerHTML = "";

            menuList.forEach((item, index) => {
                const itemId = `item_${index}`;
                const itemName = item.name || '未命名商品';
                const itemPrice = parseInt(item.price, 10) || 0;
                const itemImg = item.image || '';
                const isSoldOut = storeData.status === "offline";
                const menuData = JSON.parse(localStorage.getItem('pacetake_menu')) || {};
                const isLocalSoldOut = menuData[itemId]?.isSoldOut || false;
                const finalIsSoldOut = (isSoldOut || isLocalSoldOut);
                const foodCard = document.createElement('div');
                foodCard.className = `food-card`;
                // 👇 補上這些屬性，對應 cart-manager.js 的需求
                foodCard.setAttribute('data-id', itemId);
                foodCard.setAttribute('data-price', itemPrice);
                foodCard.setAttribute('data-name', itemName);
                foodCard.setAttribute('data-store-id', currentStoreId); // 這是關鍵！

                // 這裡改用 class，讓 CSS 控制排版
                foodCard.innerHTML = `
                    <div class="food-main-row">
                        <div class="food-img">${itemImg ? `<img src="${itemImg}" class="preview-img">` : '🍱'}</div>
                        <div class="food-info">
                            <div class="food-name">${itemName} ${finalIsSoldOut ? '(暫停供應)' : ''}</div>
                            <div class="food-price">$${itemPrice}</div>
                        </div>
                        <div class="action-Container">
                            ${finalIsSoldOut
                        ? `<button class="add-cart-btn sold-out-btn" disabled>🔴 暫停供應</button>`
                        : `<div class="quantity-control-panel">
                                    <button class="minus-btn" data-id="${itemId}">-</button>
                                    <span class="qty-number" id="qty_${itemId}">0</span>
                                    <button class="plus-btn" data-id="${itemId}">+</button>
                                  </div>`
                    }
                        </div>
                    </div>
                    ${finalIsSoldOut ? '' : `
                        <div class="note-wrapper">
                            <input type="text" class="item-note-input" placeholder="✍️ 填寫客製化備註...">
                        </div>
                    `}
                `;

                menuContainer.appendChild(foodCard);

                // --- 4. 功能綁定 ---
                if (!finalIsSoldOut) {
                    const plusBtn = foodCard.querySelector('.plus-btn');
                    const minusBtn = foodCard.querySelector('.minus-btn');
                    const qtyDisplay = foodCard.querySelector('.qty-number');
                    const noteInput = foodCard.querySelector('.item-note-input');

                    plusBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        let count = parseInt(qtyDisplay.innerText, 10) + 1;
                        qtyDisplay.innerText = count;
                        if (typeof updateLocalStorageData === 'function') updateLocalStorageData(itemId, itemName, itemPrice, currentStoreId, qtyDisplay, noteInput);
                    });

                    minusBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        let count = parseInt(qtyDisplay.innerText, 10);
                        if (count > 0) {
                            count -= 1;
                            qtyDisplay.innerText = count;
                            if (typeof updateLocalStorageData === 'function') updateLocalStorageData(itemId, itemName, itemPrice, currentStoreId, qtyDisplay, noteInput);
                        }
                    });

                    if (noteInput) {
                        noteInput.addEventListener('input', () => {
                            if (typeof updateLocalStorageData === 'function') updateLocalStorageData();
                        });
                    }
                }
            });

            // 【關鍵】渲染完成後，執行一次狀態回填
            if (typeof initCartDOMState === 'function') {
                initCartDOMState();
                refreshTotalCartUI();
            }
        };
    }
    catch (error) {
        console.error("[PACE ERROR] 崩潰：", error);
    }
}
