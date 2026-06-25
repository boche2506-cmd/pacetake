import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
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
const closeAddressModalBtn = document.getElementById('closeAddressModalBtn');
const globalSearchInput = document.getElementById('globalSearchInput');
const menuUploadList = document.getElementById('menuUploadList');
const favoriteContainer = document.getElementById('favoriteContainer');
const toggleOnline = document.getElementById('toggleOnline');
const toggleCash = document.getElementById('toggleCash');
const newebpayContainer = document.getElementById('newebpayContainer');
const cashWarningModal = document.getElementById('cashWarningModal');
const warningConfirmBtn = document.getElementById('warningConfirmBtn');
const warningCancelBtn = document.getElementById('warningCancelBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const toggleBtn = document.getElementById('themeToggleBtn');
const addItemRowBtn = document.getElementById('addItemRowBtn');
const shopSubmitBtn = document.getElementById('shopSubmitBtn');
const heartIcon = document.getElementById('heart-icon');
const menuContainer = document.getElementById('menuContainer');
const storeDistanceText = document.getElementById('storeDistanceText');
const cartSummaryText = document.querySelector('.cart-summary-text') || document.getElementById('cartSummaryText');
const loginLightbox = document.getElementById('loginLightbox');
const avatarBtn = document.getElementById('avatarBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const loginBtn = document.getElementById('loginBtn');
const userNameDisplay = document.getElementById('userNameDisplay');

function initAuthSystem() {
    console.log("[PACE DEBUG] Initializing Auth UI...");
    const customReturnBtn = document.getElementById('customReturnBtn');
    const toggleEmailFormBtn = document.getElementById('toggleEmailFormBtn');
    const emailFormSection = document.getElementById('emailFormSection');
    const togglePasswordVisibility = document.getElementById('togglePasswordVisibility');
    const loginPasswordInput = document.getElementById('loginPassword');
    const emailLoginAction = document.getElementById('emailLoginAction');
    const loginEmailInput = document.getElementById('loginEmail');
    // 2. 下拉選單邏輯
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
    // 3. 登入視窗切換邏輯
    if (loginBtn && loginLightbox) {
        loginBtn.addEventListener('click', () => loginLightbox.style.display = 'flex');
    }
    if (customReturnBtn && loginLightbox) {
        customReturnBtn.addEventListener('click', () => loginLightbox.style.display = 'none');
    }
    // 4. 表單隱藏/密碼顯現邏輯
    if (toggleEmailFormBtn && emailFormSection) {
        toggleEmailFormBtn.addEventListener('click', () => {
            emailFormSection.style.display = emailFormSection.style.display === 'none' ? 'block' : 'none';
        });
    }
    if (togglePasswordVisibility && loginPasswordInput) {
        togglePasswordVisibility.addEventListener('click', () => {
            const isPass = loginPasswordInput.type === 'password';
            loginPasswordInput.type = isPass ? 'text' : 'password';
            togglePasswordVisibility.textContent = isPass ? '🙈' : '👁️';
        });
    }
    if (emailLoginAction) {
        emailLoginAction.addEventListener('click', async () => {
            const originalText = emailLoginAction.textContent; // 記住原本的字
            emailLoginAction.disabled = true; // 鎖住按鈕
            emailLoginAction.textContent = "處理中..."; // 給使用者提示
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
            } finally {
                emailLoginAction.disabled = false; // 處理完後解鎖
                emailLoginAction.textContent = originalText; // 恢復文字
            }
        });
    }
}

function getShopFormData() {
    // 每次被呼叫時，都抓取當下最新的一手資料
    return {
        name: document.getElementById('shopName')?.value.trim(),
        phone: document.getElementById('shopPhone')?.value.trim(),
        city: document.getElementById('citySelect')?.value,
        district: document.getElementById('districtSelect')?.value,
        detailAddress: document.getElementById('shopAddress')?.value.trim(),
        lat: document.getElementById('shopLat')?.value.trim() || '',
        lng: document.getElementById('shopLng')?.value.trim() || '',
        status: document.getElementById('shopStatus')?.value || 'online',
        prepareTime: parseInt(document.getElementById('prepareTimeInput')?.value) || 15,
        merchantIdValue: document.getElementById('merchantIdInput')?.value.trim() || '',
        hashKeyValue: document.getElementById('hashKeyInput')?.value.trim() || '',
        hashIvValue: document.getElementById('hashIvInput')?.value.trim() || '',
        isCashPayEnabled: document.getElementById('toggleCash')?.checked || false,
        isOnlinePayEnabled: document.getElementById('toggleOnline')?.checked || false,
        hasSeating: document.getElementById('seatingtoggle')?.checked || false
    };
}
// 監聽 Firebase 登入狀態
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("[PACE DEBUG] Auth state: Logged in", user.uid);
        handleUserSyncAndRoleRouting(user);
    } else {
        console.log("[PACE DEBUG] Auth state: Logged out");
        if (loginBtn) loginBtn.style.display = 'block';
        if (avatarBtn) {
            avatarBtn.style.display = 'none';
            dropdownMenu.style.display = 'none';
            dropdownMenu.innerHTML = '';
        }
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
                displayName: user.displayName || "新會員",
                role: "buyer",
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString() // 順便記錄第一次登入時間
            });
        }
    } catch (e) {
        console.error("Role routing error:", e);
    }
    updateUIForUser(user, currentRole);
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
    // 如果程式執行到這裡，表示 user 一定存在，可以安心讀取資料
    if (loginBtn) loginBtn.style.display = 'none';
    if (avatarBtn) avatarBtn.style.display = 'flex';
    if (loginLightbox) loginLightbox.style.display = 'none';
    // 角色顯示邏輯
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
    // 頭像處理邏輯 (結合你的建議)
    if (user.photoURL && userAvatarImg && defaultIcon) {
        userAvatarImg.src = user.photoURL;
        userAvatarImg.style.display = 'block';
        defaultIcon.style.display = 'none';
    } else if (defaultIcon) {
        if (userAvatarImg) userAvatarImg.style.display = 'none';
        defaultIcon.style.display = 'block';
    }
    // 狀態處理
    if (statusDot) statusDot.classList.add('active');
    if (statusText) statusText.innerText = `您好 ${user.displayName || 'PACE用戶'} ~\n目前沒有進行中的訂單喔！`;
    renderDynamicMenu(currentRole);
}

function renderDynamicMenu(role) {
    if (!dropdownMenu) return;
    let menuHTML = '';
    menuHTML += `
        <a href="orders.html" class="nav-fast">🛒 我的訂單</a>
        <a href="history.html" class="nav-fast">⏳ 歷史訂單</a>
        <a href="favorites.html" class="nav-fast">❤️ 我的收藏</a>
    `;
    if (role === 'admin' || role === 'buyer') {
        menuHTML += `<a href="register.html" class="nav-fast" style="color: var(--brand-blue); font-weight: 700;">💼 月費開店(暫不收費)</a>`;
    }
    if (role === 'admin' || role === 'seller') {
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
        <a href="javascript:void(0)" data-action="toggleAdmin" class="nav-fast" style="color: var(--brand-blue);">🔮 派思核心控制台</a>
        <a href="javascript:void(0)" data-action="issuePromo" class="nav-fast" style="color: var(--brand-green);">🎟️ 邀請碼發行</a>
    `;
    }
    menuHTML += `
        <div class="menu-divider"></div>
        <button data-action="logoutBtn" style="color: var(--brand-red); width: 100%; text-align: left; padding: 2cqw; background: none; border: none; cursor: pointer; font-size: 5cqw;">🚪 登出系統</button>
    `;
    dropdownMenu.innerHTML = menuHTML;
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
    // 如果頁面上沒有這個容器，代表現在不是收藏頁，直接結束函數
    if (!favoriteContainer) return;
    const user = auth.currentUser;
    if (!user) {
        favoriteContainer.innerHTML = '<p>請先登入以查看收藏清單。</p>';
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
// 監聽詳細地址輸入框，當離開欄位時自動查詢
function setupAddressGeocoder() {
    // 1. 頁面路徑安全檢查
    if (!window.location.pathname.includes('register.html')) return;
    console.log("[PACE] Initializing Register Page Logic...");

    const addressInput = document.getElementById('shopAddress');
    addressInput?.addEventListener('blur', async () => {
        const city = document.getElementById('citySelect').value;
        const district = document.getElementById('districtSelect').value;
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
}
// 確保只有在 register.html 才執行這段檢查
function initRegisterPage() {
    // 1. 頁面路徑安全檢查
    if (!window.location.pathname.includes('register.html')) return;
    console.log("[PACE] Initializing Register Page Logic...");
    // 2. 位址與經緯度檢查 (包含提交驗證)
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
    toggleOnline?.addEventListener('change', function () {
        if (newebpayContainer) newebpayContainer.style.display = this.checked ? 'block' : 'none';
    });
    // 4. 現金警告邏輯 (事件委派)
    if (toggleCash) {
        toggleCash.checked = false;
        toggleCash.addEventListener('click', (e) => {
            if (toggleCash.checked) {
                toggleCash.checked = false;
                e.preventDefault();
                if (cashWarningModal) cashWarningModal.style.display = 'flex';
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.id === 'warningConfirmBtn') {
            if (toggleCash) toggleCash.checked = true;
            if (cashWarningModal) cashWarningModal.style.display = 'none';
        } else if (e.target.id === 'warningCancelBtn') {
            if (toggleCash) toggleCash.checked = false;
            if (cashWarningModal) cashWarningModal.style.display = 'none';
        }
    });
}
// 拖曳菜單專屬函式區 新增菜單(賣家)
function setupMenuManager() {
    // 如果頁面沒有菜單容器，就直接跳出，不執行任何邏輯
    if (!menuUploadList) return;
    // --- 1. 拖曳功能模組 ---
    let activeDragItem = null;

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
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        requestAnimationFrame(() => {
            const siblings = [...menuUploadList.querySelectorAll('.menu-item-row')].filter(el => el !== activeDragItem);
            const nextSibling = siblings.find(sibling => {
                const box = sibling.getBoundingClientRect();
                return clientY <= box.top + box.height / 2;
            });
            if (nextSibling && activeDragItem !== nextSibling) {
                menuUploadList.insertBefore(activeDragItem, nextSibling);
            } else if (!nextSibling && activeDragItem !== menuUploadList.lastElementChild) {
                menuUploadList.appendChild(activeDragItem);
            }
        });
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
    // --- 2. 初始化已存在的項目 ---
    document.querySelectorAll('.menu-item-row').forEach(row => makeItemDraggable(row));
    // --- 3. 統一的事件委派 (點擊與變更) ---
    // 我們只綁定在 menuUploadList 上，這樣新增的項目也會自動擁有這些功能
    menuUploadList.addEventListener('click', (e) => {
        const target = e.target;
        const row = target.closest('.menu-item-row');
        if (!row) return;
        // 刪除按鈕邏輯
        if (target.classList.contains('del-row-btn')) {
            if (menuUploadList.querySelectorAll('.menu-item-row').length <= 1) {
                alert("報告老闆，店裡至少要留一項商品才能開張喔！");
                return;
            }
            row.remove();
        }
        // 規格切換邏輯
        if (target.classList.contains('new-size')) {
            const mainPriceInput = row.querySelector('.price-input');
            const sizePriceContainer = row.querySelector('.new-size-price');
            if (!mainPriceInput || !sizePriceContainer) return;

            const isHidden = sizePriceContainer.style.display === 'none' || sizePriceContainer.style.display === '';
            sizePriceContainer.style.display = isHidden ? 'flex' : 'none';
            mainPriceInput.disabled = isHidden;
            mainPriceInput.style.textDecoration = isHidden ? 'line-through' : 'none';
            mainPriceInput.style.backgroundColor = isHidden ? 'var(--bg-Container)' : '';
            mainPriceInput.required = !isHidden;
        }
    });

    menuUploadList.addEventListener('change', (e) => {
        if (e.target.classList.contains('menu-soldout-toggle')) {
            const row = e.target.closest('.menu-item-row');
            if (row) row.classList.toggle('sold-out', !e.target.checked);
        }
    });
    // --- 4. 新增行按鈕邏輯 ---
    addItemRowBtn?.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.className = 'menu-item-row';
        newRow.innerHTML = `
                        <div class="menu-item">
                            <div class="img-upload-box" id="uploadBox">
                                <input type="file" id="imageInput" class="image-input" accept="image/*"
                                    style="display: none;">
                                <img class="preview-img" src=""
                                    style="display: none; position: absolute; width: 100%; height: 100%; object-fit: contain; border-radius: 2cqw;">
                                <div class="upload-placeholder"
                                    style="font-size: 8cqw;  width: 17cqw; height: 17cqw; border: 0.2cqw dashed var(--border-color); border-radius: 2cqw; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                    📷<span>上傳照片</span></div>
                            </div>
                            <div class="item-fields" style="width: 100%; gap: 0.5cqw;">
                                <input type="text" class="input-style item-name-input"
                                    style="height:8cqw; width: 100%; padding: 0 2cqw;" placeholder="品項名稱(必填)" required>
                                <div class="price-input-wrapper">
                                    <span class="price-symbol">$</span>
                                    <input type="number" class="input-style price-input"
                                        style="height:8cqw; width: 100%;padding-left:5cqw;" placeholder="金額(必填)" min="0"
                                        required>
                                </div>
                            </div>
                            <button type="button" class="new-size">如需規格</button>
                            <div class="item-right-ctrls"
                                style="gap: 0.5cqw; display: flex; flex-direction: column; justify-content: center;">
                                <div class="drag-handle"
                                    style="width: 8cqw; height: 8cqw; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 3cqw; cursor: grab;">
                                    ☰</div>
                                <button type="button" class="del-row-btn"
                                    style="width: 8cqw; height: 8cqw; display: flex; align-items: center; justify-content: center; font-size: 3cqw;">❌</button>
                            </div>
                        </div>
                        <div class="new-size-price"
                            style="display: none; height: 8cqw; width: 100%; flex-direction: row; justify-content: space-around; gap: 1cqw;">
                            <div class="price-input-wrapper">
                                <span class="price-symbol">大$</span>
                                <input type="number" class="input-style price-input-large"
                                    style="height:8cqw; flex: 1;padding-left:7cqw;" placeholder="金額(必填)" min="0"
                                    required>
                            </div>
                            <div class="price-input-wrapper">
                                <span class="price-symbol">中$</span>
                                <input type="number" class="input-style price-input-medium"
                                    style="height:8cqw; flex: 1;padding-left:7cqw;" placeholder="金額" min="0">
                            </div>
                            <div class="price-input-wrapper">
                                <span class="price-symbol">小$</span>
                                <input type="number" class="input-style price-input-small"
                                    style="height:8cqw; flex: 1;padding-left:7cqw;" placeholder="金額(必填)" min="0"
                                    required>
                            </div>
                        </div>
                        <div class="remark" style="width: 100%; gap: 1cqw">
                            <input type="text" class="input-style item-note-input" style="height: 8cqw; max-width: 80%;"
                                placeholder="備註">
                            <label class="menu-soldout-switch"><input type="checkbox" class="menu-soldout-toggle"
                                    id="menu-soldout-toggle" checked>
                                <span class="toggle-slider">
                                    <span class="on-text">販售中</span>
                                    <span class="off-text">暫停</span>
                                </span>
                            </label>
                        </div>`;
        menuUploadList.appendChild(newRow);
        makeItemDraggable(newRow);
    });
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
// 直接在整個網頁範圍監聽點擊對應class="img-upload-box"class="shop-logo-box"
document.addEventListener('click', (e) => {
    // 如果點到的是上傳盒子 (img-upload-box 或 shop-logo-box)
    const box = e.target.closest('.img-upload-box, .shop-logo-box');
    if (box) {
        const input = box.querySelector('.image-input');
        if (input) input.click();
    }
});
// 直接在整個網頁範圍監聽 change
document.addEventListener('change', (e) => {
    // 如果觸發的是 .image-input
    if (e.target.classList.contains('image-input')) {
        const input = e.target;
        const box = input.closest('.img-upload-box, .shop-logo-box');
        if (!box) return;
        const file = input.files[0];
        if (!file) return;
        const img = box.querySelector('.preview-img');
        const reader = new FileReader();
        reader.onload = (event) => {
            const tempImg = new Image();
            tempImg.src = event.target.result;
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / tempImg.width;
                canvas.width = tempImg.width > MAX_WIDTH ? MAX_WIDTH : tempImg.width;
                canvas.height = tempImg.width > MAX_WIDTH ? tempImg.height * scaleSize : tempImg.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
                if (img) {
                    img.src = canvas.toDataURL('image/jpeg', 0.7);
                    img.style.display = 'block';
                }
            };
        };
        reader.readAsDataURL(file);
    }
});
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
    // 發行邀請碼
    if (action === 'issuePromo') {
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
    }
    // 收藏按鈕監聽器
    else if (action === 'favorite-btn') {
        const user = auth.currentUser;
        if (!user) {
            alert("⚠️ 請先登入才能收藏店家喔！");
            return;
        }
        const data = window.currentStoreInfo || {};
        const { id } = data; // 確保有 id
        // 建立要存入的資料物件，並排除可能為 undefined 的欄位
        // 利用 || null 或將其設定為預設空字串，防止 undefined 錯誤
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
    }
    // shopSubmitBtn 監聽與手動提交邏輯
    else if (action === 'shopSubmitBtn') {
        // --- 1. 嚴謹的身分確認與權限檢查 ---
        const btn = target;
        const lat = document.getElementById('shopLat')?.value.trim();
        const lng = document.getElementById('shopLng')?.value.trim();
        if (!lat || !lng) {
            alert("⚠️ 請先確認店鋪經緯度！若無法自動取得，請點擊「查詢座標」按鈕手動輸入，確保定位正確喔！");
            document.getElementById('shopLat')?.focus();
            return; // 直接中斷，不往下執行
        }
        const ShopFormData = getShopFormData();
        const user = auth.currentUser;
        if (!user) {
            alert("⚠️ 請先登入帳號！");
            return;
        }
        // 先檢查該用戶是否已經是賣家，防止重複開鋪
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().role === "seller") {
                alert("您已經擁有店舖了，將為您前往賣家後台。");
                window.location.href = "seller.html";
                return;
            }
        } catch (err) {
            console.error("權限檢查失敗:", err);
            return;
        }
        // --- 2. 基本資訊與防呆 ---
        if (!ShopFormData.name || !ShopFormData.phone || !ShopFormData.city || !ShopFormData.district || !ShopFormData.detailAddress) {
            alert("⚠️ 請填寫完整的店舖資訊！");
            return;
        }
        const logoEl = document.getElementById('shopLogoPreview');
        const shopLogoData = (logoEl && logoEl.style.display !== 'none') ? logoEl.src : "";
        // --- 3. 菜單打包 ---
        const menuRows = document.querySelectorAll('.menu-item-row');
        const menuItems = [];
        menuRows.forEach((row, index) => {
            const supply = document.getElementById('menu-soldout-toggle') ? document.getElementById('menu-soldout-toggle').checked : false;
            const nameVal = row.querySelector('.item-name-input').value.trim();
            if (!nameVal) return;
            const isSizeMode = row.querySelector('.new-size-price').style.display === 'flex';
            let itemObj = {
                id: `item_${index}`,
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
            menuItems.push(itemObj);
        });
        // --- 4. 邀請碼驗證 ---
        const inviteCode = document.getElementById('shopInviteCode')?.value.trim() || '';
        if (inviteCode) {
            const promoQuery = query(collection(db, "promo_codes"), where("code", "==", inviteCode), where("isActive", "==", true));
            const querySnapshot = await getDocs(promoQuery);
            if (querySnapshot.empty) {
                alert("❌ 無效的邀請碼或已被使用！");
                return;
            }
            const promoDoc = querySnapshot.docs[0];
            await updateDoc(promoDoc.ref, { isActive: false, usedBy: user.uid });
        }
        // --- 5. 資料組裝與送出 ---
        const shopData = {
            sellerUid: user.uid,
            shopName: ShopFormData.name,
            shopPhone: ShopFormData.phone,
            city: ShopFormData.city,
            district: ShopFormData.district,
            detailAddress: ShopFormData.detailAddress,
            // 雖然你有獨立欄位，但保留 shopAddress 也很方便前端直接顯示
            shopAddress: `${ShopFormData.city}${ShopFormData.district}${ShopFormData.detailAddress}`,
            shopLat: ShopFormData.lat,
            shopLng: ShopFormData.lng,
            inviteCode: inviteCode,
            status: ShopFormData.status,
            shopLogo: shopLogoData,
            prepareTime: ShopFormData.prepareTime,
            isOnlinePayEnabled: ShopFormData.isOnlinePayEnabled,
            isCashPayEnabled: ShopFormData.isCashPayEnabled,
            HashIV: ShopFormData.hashIvValue,
            HashKey: ShopFormData.hashKeyValue,
            MerchantID: ShopFormData.merchantIdValue,
            hasSeating: ShopFormData.hasSeating,
            menuList: menuItems,
            createdAt: new Date().toISOString()
        };
        btn.disabled = true;
        try {
            // 1. 處理店家資料
            await setDoc(doc(db, "stores", user.uid), shopData);
            // 2. 處理角色身分（只在非 admin 時更新）
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            // 只要不是 admin，就一律更新為 seller
            if (userData?.role !== 'admin') {
                await updateDoc(userRef, { role: "seller" });
            }
            alert("🎉 開張成功！");
            window.location.href = "seller.html";
        } catch (dbError) {
            console.error("提交錯誤:", dbError);
            alert("系統錯誤：" + dbError.message);
            btn.disabled = false; // 失敗時恢復按鈕
        }
    }
    else if (action === 'gpsPinBtn') {
        console.log("[PACE DEBUG] GPS Pin clicked.");
        getBrowserLocation();
        if (addressDetailLightbox) addressDetailLightbox.style.display = 'flex';
    }
    else if (action === 'closeAddressModalBtn') {
        addressDetailLightbox.style.display = 'none';
    }
    else if (action === 'googleLoginAction') {
        try {
            await signInWithPopup(auth, provider);
            // 不要在這裡呼叫 handleUserSyncAndRoleRouting！
            // 登入後，onAuthStateChanged 會自動被觸發
        } catch (error) {
            console.error("Google 登入失敗：", error);
        }
    }
    else if (action === 'logoutBtn') {
        await signOut(auth);
        location.reload();
        // 不用寫 location.reload()，onAuthStateChanged 偵測到登出後會自動切換 UI
    }
    else {
        // 如果有需要處理預設情況或錯誤紀錄，可以寫在這裡
        console.log('未知的 action:', action);
    }
});
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
    document.body.setAttribute('data-store-id', currentStoreId);
    try {
        // --- 這裡放回你原有的 Firebase 讀取邏輯 ---
        let storeData = null;
        const firebaseFirestore = window.firebase ? window.firebase.firestore() : null;
        // 嘗試用 v9 寫法讀取
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
        menuList.forEach((item, index) => {
            // 確保 ID 格式與你的 cart-manager 一致
            const itemId = `${currentStoreId}|||item_${index}`;
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
                    <div class="food-img">${item.image ? `<img src="${item.image}" style="width:100%; height:100%; border-radius:inherit; position: absolute;">` : '🍱'}</div>
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
    initAuthSystem();
    fetchStoresFromFirebase();
    initThemeSystem();
    initCitySelect(document.getElementById('citySelect'));
    getBrowserLocation();
    setupAddressGeocoder();
    initRegisterPage();
    setupMenuManager();
    initAppListeners();
    initPullToRefresh(); // 把那個下拉刷新的功能也包在這裡
    initStorePage();
    refreshTotalCartUI();
    initCartDOMState();
    console.log("系統初始化完成");
});