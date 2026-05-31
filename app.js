import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 1. Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyCkAiZCJ6L950KfYJEqubWGi1M8D03OuJI",
    authDomain: "pacetake-c6e1e.firebaseapp.com",
    projectId: "pacetake-c6e1e",
    storageBucket: "pacetake-c6e1e.firebasestorage.app",
    messagingSenderId: "1052980235056",
    appId: "1:1052980235056:web:6a06e4ac9b48f1e74896f5",
    measurementId: "G-888XL8JTHW",
};

// 🎯 沒錯！就是在這裡補上 export，把通道對外開放！
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider(); // 如果其他頁面需要處理 Google 登入，這個也順便送出去

// 2. 全域核心變數
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
    "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "旗津區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "仁武區", "大社區", "岡山區", "路竹區", "阿蓮區", "田寮區", "燕巢區", "橋頭區", "梓官區", "彌陀區", "永安區", "湖內區", "鳳山區", "大寮區", "林園區", "鳥松區", "大樹區", "旗山區", "美濃區", "六龜區", "內門區", "杉林區", "甲仙區", "桃源區", "那瑪夏區", "茂林區", "內門區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧臺鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"],
    "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"],
    "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "富里鄉", "秀林鄉", "萬榮鄉", "卓溪鄉"],
    "臺東縣": ["臺東市", "成功鎮", "關山鎮", "卑名鄉", "大武鄉", "太麻里鄉", "東河鄉", "長濱鄉", "鹿野鄉", "池上鄉", "綠島鄉", "延平鄉", "海端鄉", "達仁鄉", "金峰鄉", "蘭嶼鄉"],
    "澎湖縣": ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"],
    "金門縣": ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉", "烏坵鄉"],
    "連江縣": ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"]
};

// 宣告 UI 變數（防止重複宣告、不撞名）
let themeToggleBtn, loginBtn, avatarBtn, dropdownMenu, userNameDisplay, storeContainer;
let loginLightbox, googleLoginAction, toggleEmailFormBtn, emailFormSection, customReturnBtn;
let loginEmailInput, loginPasswordInput, emailLoginAction;
let citySelect, districtSelect, gpsPinBtn, addressDetailLightbox, modalAddressText, closeAddressModalBtn, globalSearchInput;

// 3. 大腦核心：等網頁全部長出來才執行
window.addEventListener('DOMContentLoaded', () => {
    
    // 抓取網頁上的所有元件
    themeToggleBtn = document.getElementById('themeToggleBtn');
    loginBtn = document.getElementById('loginBtn');
    avatarBtn = document.getElementById('avatarBtn');
    dropdownMenu = document.getElementById('dropdownMenu');
    userNameDisplay = document.getElementById('userNameDisplay');
    storeContainer = document.getElementById('store-container');
    loginLightbox = document.getElementById('loginLightbox');
    googleLoginAction = document.getElementById('googleLoginAction');
    toggleEmailFormBtn = document.getElementById('toggleEmailFormBtn');
    emailFormSection = document.getElementById('emailFormSection');
    customReturnBtn = document.getElementById('customReturnBtn');
    loginEmailInput = document.getElementById('loginEmail');
    loginPasswordInput = document.getElementById('loginPassword');
    emailLoginAction = document.getElementById('emailLoginAction');
    citySelect = document.getElementById('citySelect');
    districtSelect = document.getElementById('districtSelect');
    gpsPinBtn = document.getElementById('gpsPinBtn');
    addressDetailLightbox = document.getElementById('addressDetailLightbox');
    modalAddressText = document.getElementById('modalAddressText');
    closeAddressModalBtn = document.getElementById('closeAddressModalBtn');
    globalSearchInput = document.getElementById('globalSearchInput');

    // 初始化主題
    initTheme();

    // 綁定所有按鈕事件
    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('pacetake-theme', newTheme);
            themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    if(avatarBtn && dropdownMenu) {
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

    if(loginBtn) loginBtn.addEventListener('click', () => { loginLightbox.style.display = 'flex'; });
    if(customReturnBtn) customReturnBtn.addEventListener('click', () => { loginLightbox.style.display = 'none'; });
    if(toggleEmailFormBtn) {
        toggleEmailFormBtn.addEventListener('click', () => {
            emailFormSection.style.display = emailFormSection.style.display === 'none' ? 'block' : 'none';
        });
    }

    const togglePasswordVisibility = document.getElementById('togglePasswordVisibility');
    if(togglePasswordVisibility) {
        togglePasswordVisibility.addEventListener('click', function() {
            const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPasswordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    if(gpsPinBtn) {
        gpsPinBtn.addEventListener('click', () => {
            modalAddressText.innerText = currentBuyerAddress;
            addressDetailLightbox.style.display = 'flex';
        });
    }
    if(closeAddressModalBtn) closeAddressModalBtn.addEventListener('click', () => { addressDetailLightbox.style.display = 'none'; });

    if(citySelect) {
        citySelect.addEventListener('change', () => {
            const selectedCity = citySelect.value;
            districtSelect.innerHTML = '<option value="">選擇區域</option>';
            if (areaData[selectedCity]) {
                areaData[selectedCity].forEach(dist => {
                    const opt = document.createElement('option');
                    opt.value = dist;
                    opt.innerText = dist;
                    districtSelect.appendChild(opt);
                });
            }
            filterAndRenderStores();
        });
    }
    if(districtSelect) districtSelect.addEventListener('change', filterAndRenderStores);
    if(globalSearchInput) globalSearchInput.addEventListener('input', filterAndRenderStores);

    if(googleLoginAction) {
        googleLoginAction.addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                await handleUserSyncAndRoleRouting(result.user);
            } catch (error) {
                console.error("Google 登入失敗：", error);
                alert("連線失敗，請檢查網路服務！");
            }
        });
    }

    if(emailLoginAction) {
        emailLoginAction.addEventListener('click', async () => {
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
});
// 監聽 Firebase 登入狀態
onAuthStateChanged(auth, (user) => {
    // 預先抓好元素
    const avatarBtn = document.getElementById('avatarBtn');
    const defaultIcon = document.getElementById('defaultIcon');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const loginBtn = document.getElementById('loginBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const statusText = document.getElementById('statusText');

    if (user) {
        // --- 登入狀態 ---
        handleUserSyncAndRoleRouting(user);
        document.getElementById('statusDot')?.classList.add('active');

        // 顯示按鈕
        if(avatarBtn) avatarBtn.style.display = 'block';
        if(loginBtn) loginBtn.style.display = 'none';

        // 頭像邏輯
        if (user.photoURL && userAvatarImg && defaultIcon) {
            userAvatarImg.src = user.photoURL;
            userAvatarImg.style.display = 'block';
            defaultIcon.style.display = 'none';
        } else if (defaultIcon) {
            if(userAvatarImg) userAvatarImg.style.display = 'none';
            defaultIcon.style.display = 'block';
        }

        // 文字狀態
        if(statusText) statusText.innerText = `您好 ${user.displayName || 'PACE用戶'} ~\n目前沒有進行中的訂單喔！`;

    } else {
        // --- 登出狀態 ---
        if(loginBtn) loginBtn.style.display = 'block';
        if(avatarBtn) avatarBtn.style.display = 'none';

        if(dropdownMenu) {
            dropdownMenu.style.display = 'none';
            dropdownMenu.innerHTML = '';
        }
        document.getElementById('statusDot')?.classList.remove('active');

        if(statusText) statusText.innerText = "您尚未登入，請連結google帳號\n或使用電子郵件登入";
    }
}); // <--

// 4. 獨立功能函數區
function initTheme() {
    const savedTheme = localStorage.getItem('pacetake-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if(themeToggleBtn) themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function renderDynamicMenu(role) {
    let menuHTML = `
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
            <a href="manage.html" class="nav-fast">⚙️ 後台管理</a>
            <a href="#" class="nav-fast" data-target="pay">💵 繳費</a>
        `;
    }
    if (role === 'admin') {
        menuHTML += `
            <div class="menu-divider"></div>
            <a href="javascript:void(0)" onclick="window.toggleView('admin')" style="color: var(--brand-blue); font-weight: bold;">🔮 派思核心控制台</a>
            <a href="javascript:void(0)" onclick="window.issuePromoCode()" style="color: var(--brand-green); font-weight: bold;">🎟️ 邀請碼發行</a>
        `;
    }
    menuHTML += `
        <div class="menu-divider"></div>
        <button id="logoutBtn" style="color: var(--brand-red);">🚪 登出</button>
    `;
    if(dropdownMenu) {
        dropdownMenu.innerHTML = menuHTML;
        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await signOut(auth);
                location.reload();
            });
        }
    }
}

async function handleUserSyncAndRoleRouting(user) {
    if (!user) return;
    currentUserId = user.uid;
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let currentRole = "buyer"; 

    if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        currentRole = data.role || "buyer";
        await updateDoc(userDocRef, {
            lastLogin: new Date().toISOString(),
            email: user.email || data.email,
            displayName: user.displayName || data.displayName || "PACE用戶"
        });
    } else {
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "PACE用戶",
            role: "buyer",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });
    }

    if(loginBtn) loginBtn.style.display = 'none';
    if(avatarBtn) avatarBtn.style.display = 'flex';
    if(loginLightbox) loginLightbox.style.display = 'none';

    if(userNameDisplay) {
        if (currentRole === "admin") {
            userNameDisplay.innerHTML = `👑 總管`;
        } else if (currentRole === "seller") {
            userNameDisplay.innerHTML = `🏪 老闆`;
        } else {
            userNameDisplay.innerHTML = `🧑‍💼 買家`;
        }
    }
    renderDynamicMenu(currentRole);
}

async function fetchStoresFromFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, "stores"));
        allStores = [];
        querySnapshot.forEach((doc) => {
            allStores.push({ id: doc.id, ...doc.data() });
        });
        filterAndRenderStores();
        renderAdminTable(); 
    } catch (error) {
        console.error("讀取店家失敗：", error);
        if(storeContainer) storeContainer.innerHTML = '<div class="loading-spinner" style="color:var(--brand-red);">❌ 無法取得雲端店家資料</div>';
    }
}

function filterAndRenderStores() {
    if(!storeContainer) return;
    const selectedCity = citySelect ? citySelect.value : '';
    const selectedDist = districtSelect ? districtSelect.value : '';
    const searchKeyword = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';

    const filtered = allStores.filter(store => {
        const matchCity = !selectedCity || store.city === selectedCity;
        const matchDist = !selectedDist || store.district === selectedDist;
        const matchKeyword = !searchKeyword || 
                           (store.name && store.name.toLowerCase().includes(searchKeyword)) ||
                           (store.shopName && store.shopName.toLowerCase().includes(searchKeyword));
        return matchCity && matchDist && matchKeyword;
    });

    if (filtered.length === 0) {
        storeContainer.innerHTML = '<div class="loading-spinner">🍃 此商圈目前尚無合作店家進駐喔！</div>';
        return;
    }

    storeContainer.innerHTML = "";
    filtered.forEach(store => {
        const finalName = store.shopName || store.name || '未命名店家';
        const finalAddress = store.shopAddress || store.address || '';
        const finalCity = store.city || '';
        const finalDistrict = store.district || '';

        const takeoutSupported = store.isCashPayEnabled !== false;
        const paySupported = store.isOnlinePayEnabled !== false;

        // 如果店家狀態設定為下線，買家首頁直接過濾不顯示
        if (store.status === "offline") return;

        const card = document.createElement('a');
        card.href = `menu.html?storeId=${store.id}`;
        card.className = 'store-card';
        card.innerHTML = `
            <div class="store-img">${store.emoji || '🏪'}</div>
            <div class="store-info">
                <div>
                    <div class="store-name">${finalName}</div>
                    <div class="store-meta">📍 ${finalCity}${finalDistrict} ${finalAddress}</div>
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
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                buyerLat = position.coords.latitude;
                buyerLng = position.coords.longitude;
                currentBuyerAddress = `經度: ${buyerLng.toFixed(4)}, 緯度: ${buyerLat.toFixed(4)} (GPS 衛星精準定位)`;
                if(gpsPinBtn) gpsPinBtn.innerText = "📍 已獲取定位";
            },
            (error) => {
                currentBuyerAddress = "瀏覽器定位遭拒，請手動選擇下拉選單縣市。";
                if(gpsPinBtn) gpsPinBtn.innerText = "📍 無法定位";
            }
        );
    } else {
        currentBuyerAddress = "您的裝置不支援 GPS 定位裝置。";
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('adminStoreTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    if(allStores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:#aaa;">目前雲端尚無店家資料</td></tr>';
        return;
    }

    allStores.forEach(store => {
        const finalName = store.shopName || store.name || '未命名店家';
        const finalAddress = store.shopAddress || store.address || '';
        const phone = store.phone || '無資料';
        const statusText = store.status === 'offline' ? '🔴 下線' : '🟢 上線';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 12px; border: 1px solid #3a3a3a; color: #ffca28; font-weight: bold;">${finalName}</td>
            <td style="padding: 12px; border: 1px solid #3a3a3a; color: #bbb;">${store.city || ''}${store.district || ''} ${finalAddress}</td>
            <td style="padding: 12px; border: 1px solid #3a3a3a; color: #bbb;">${phone}</td>
            <td style="padding: 12px; border: 1px solid #3a3a3a; text-align: center; color: ${store.status === 'offline' ? '#ef4444' : '#10b981'}; font-weight: bold;">${statusText}</td>
            <td style="padding: 12px; border: 1px solid #3a3a3a; text-align: center;">
                <button onclick="window.deleteStore('${store.id}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. 暴露給 HTML Inline onclick 呼叫的控制台專屬功能
const adminSubmitStoreBtn = document.getElementById('adminSubmitStoreBtn');
if (adminSubmitStoreBtn) {
    adminSubmitStoreBtn.addEventListener('click', async () => {
        // 精準抓取 HTML 上所有的「指名」欄位：
        const name = document.getElementById('adminNewStoreName')?.value.trim() || '';
        const phone = document.getElementById('adminNewStorePhone')?.value.trim() || '';
        const city = document.getElementById('adminNewStoreCity')?.value || '';
        const district = document.getElementById('adminNewStoreDistrict')?.value.trim() || '';
        const address = document.getElementById('adminNewStoreAddress')?.value.trim() || '';
        const inviteCode = document.getElementById('adminNewStoreInviteCode')?.value.trim() || '';
        const status = document.getElementById('adminNewStoreStatus')?.value || 'online';

        // 判斷打勾狀態：
        const isCashPayEnabled = document.getElementById('adminNewStoreHasTakeout') ? document.getElementById('adminNewStoreHasTakeout').checked : true;
        const isOnlinePayEnabled = document.getElementById('adminNewStoreHasPay') ? document.getElementById('adminNewStoreHasPay').checked : true;

        if (!name || !district || !address) {
            alert("⚠️ 店名、區域、詳細地址為必填項目！");
            return;
        }

        adminSubmitStoreBtn.innerText = "⏳ 正在同步至雲端...";
        try {
            // 🎯 10個英雄欄位完美打包送進 Firebase 資料庫：
            await addDoc(collection(db, "stores"), {
                name: name,
                shopName: name,
                phone: phone,
                city: city,
                district: district,
                address: address,
                shopAddress: address,
                isCashPayEnabled: isCashPayEnabled,   // 💵 點燈開關
                isOnlinePayEnabled: isOnlinePayEnabled, // 💳 點燈開關
                status: status,                       // 🟢 上下線狀態
                inviteCode: inviteCode,               // 🎟️ 邀請碼
                menu: [],                             // 🧑‍🍳 預留菜單陣列
                createdAt: new Date().toISOString()
            });
            
            alert("✅ 店家已成功新增至雲端！");
            
            // 表單自動清空防呆
            if(document.getElementById('adminNewStoreName')) document.getElementById('adminNewStoreName').value = '';
            if(document.getElementById('adminNewStorePhone')) document.getElementById('adminNewStorePhone').value = '';
            if(document.getElementById('adminNewStoreDistrict')) document.getElementById('adminNewStoreDistrict').value = '';
            if(document.getElementById('adminNewStoreAddress')) document.getElementById('adminNewStoreAddress').value = '';
            if(document.getElementById('adminNewStoreInviteCode')) document.getElementById('adminNewStoreInviteCode').value = '';
            
            fetchStoresFromFirebase();
        } catch (error) {
            console.error("新增店家失敗:", error);
            alert("新增失敗，請檢查網路或資料庫權限！");
        } finally {
            adminSubmitStoreBtn.innerText = "✅ 確認新增店家至雲端";
        }
    });
}

window.deleteStore = async function(storeId) {
    if (confirm("⚠️ 確定要從 Firebase 徹底刪除這個店家嗎？(刪除後無法恢復)")) {
        try {
            await deleteDoc(doc(db, "stores", storeId));
            alert("🗑️ 店家已成功刪除！");
            fetchStoresFromFirebase(); 
        } catch (error) {
            console.error("刪除失敗:", error);
            alert("刪除失敗，請確認你的 Admin 權限！");
        }
    }
};

window.issuePromoCode = async function() {
    const code = prompt('請輸入要發行的VIP 邀請碼 (例如: PACE2026):');
    if (!code || code.trim() === "") return;
    
    try {
        await setDoc(doc(db, "promoCodes", code.trim()), {
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
};

window.toggleView = function(viewRole) {
    const adminEl = document.getElementById('adminView');
    const buyerEl = document.getElementById('buyerView');
    if (viewRole === 'admin') {
        if (adminEl) adminEl.style.display = 'block';
        if (buyerEl) buyerEl.style.display = 'none';
        window.scrollTo(0, 0);
    } else {
        if (adminEl) adminEl.style.display = 'none';
        if (buyerEl) buyerEl.style.display = 'block';
    }
};
