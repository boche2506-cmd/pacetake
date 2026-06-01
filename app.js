import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==========================================
// 1. Firebase 設定與初始化
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

// ==========================================
// 3. 核心功能函式
// ==========================================

function initTheme() {
    const savedTheme = localStorage.getItem('pacetake-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

function renderDynamicMenu(role) {
    dropdownMenu = document.getElementById('dropdownMenu');
    if (!dropdownMenu) return;
    
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
        <button id="logoutBtn" style="color: var(--brand-red); width: 100%; text-align: left; padding: 10px; background: none; border: none; cursor: pointer; font-size: 14px;">🚪 登出系統</button>
    `;

    dropdownMenu.innerHTML = menuHTML;
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                location.reload();
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }
}

async function handleUserSyncAndRoleRouting(user) {
    if (!user) return;
    currentUserId = user.uid;
    
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

function updateUIForUser(user, currentRole) {
    loginBtn = document.getElementById('loginBtn');
    avatarBtn = document.getElementById('avatarBtn');
    loginLightbox = document.getElementById('loginLightbox');
    userNameDisplay = document.getElementById('userNameDisplay');

    if (loginBtn) loginBtn.style.display = 'none';
    if (avatarBtn) avatarBtn.style.display = 'block';
    if (loginLightbox) loginLightbox.style.display = 'none';

    if (userNameDisplay) {
        if (currentRole === "admin") {
            userNameDisplay.innerHTML = `👑 總管`;
        } else if (currentRole === "seller") {
            userNameDisplay.innerHTML = `🏪 老闆`;
        } else {
            userNameDisplay.innerHTML = `🧑‍💼 買家`;
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

// ==========================================
// 4. 初始化與事件綁定
// ==========================================

function bindHeaderEvents() {
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
            console.log("[PACE DEBUG] Login button clicked, showing login lightbox.");
            if (loginLightbox) loginLightbox.style.display = 'flex'; 
        });
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    bindHeaderEvents(); // 確保 Header 事件在 DOMContentLoaded 時綁定
    
    // 非 Header 元件抓取
    userNameDisplay = document.getElementById('userNameDisplay');
    storeContainer = document.getElementById('store-container');
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
    menuUploadList = document.getElementById('menuUploadList');

    // 監聽 Firebase 登入狀態
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("[PACE DEBUG] User logged in:", user.uid);
            handleUserSyncAndRoleRouting(user);
        } else {
            console.log("[PACE DEBUG] User logged out.");
            loginBtn = document.getElementById('loginBtn');
            avatarBtn = document.getElementById('avatarBtn');
            dropdownMenu = document.getElementById('dropdownMenu');
            if (loginBtn) loginBtn.style.display = 'block';
            if (avatarBtn) avatarBtn.style.display = 'none';
            if (dropdownMenu) dropdownMenu.style.display = 'none';
            if (userNameDisplay) userNameDisplay.innerHTML = `訪客`;
            if (document.getElementById('statusDot')) document.getElementById('statusDot').classList.remove('active');
            if (document.getElementById('statusText')) document.getElementById('statusText').innerText = `您好 訪客 ~\n請先登入以享受完整服務！`;
            renderDynamicMenu('guest');
        }
    });

    // 登入彈窗事件綁定
    if (googleLoginAction) {
        googleLoginAction.addEventListener('click', async () => {
            console.log("[PACE DEBUG] Google login initiated.");
            try {
                await signInWithPopup(auth, provider);
                if (loginLightbox) loginLightbox.style.display = 'none';
            } catch (error) {
                console.error("Google login error:", error);
                alert("Google 登入失敗: " + error.message);
            }
        });
    }

    if (toggleEmailFormBtn) {
        toggleEmailFormBtn.addEventListener('click', () => {
            console.log("[PACE DEBUG] Toggle email form button clicked.");
            if (emailFormSection) {
                emailFormSection.style.display = emailFormSection.style.display === 'none' ? 'block' : 'none';
                toggleEmailFormBtn.innerText = emailFormSection.style.display === 'none' ? '使用 Email 登入/註冊' : '返回 Google 登入';
            }
        });
    }

    if (customReturnBtn) {
        customReturnBtn.addEventListener('click', () => {
            console.log("[PACE DEBUG] Custom return button clicked.");
            if (emailFormSection) emailFormSection.style.display = 'none';
            if (toggleEmailFormBtn) toggleEmailFormBtn.innerText = '使用 Email 登入/註冊';
        });
    }

    if (emailLoginAction) {
        emailLoginAction.addEventListener('click', async () => {
            console.log("[PACE DEBUG] Email login/register initiated.");
            const email = loginEmailInput ? loginEmailInput.value : '';
            const password = loginPasswordInput ? loginPasswordInput.value : '';

            if (!email || !password) {
                alert("請輸入 Email 和密碼。");
                return;
            }

            try {
                // 嘗試登入
                await signInWithEmailAndPassword(auth, email, password);
                console.log("[PACE DEBUG] Email login successful.");
                if (loginLightbox) loginLightbox.style.display = 'none';
            } catch (loginError) {
                if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/wrong-password') {
                    // 如果登入失敗，嘗試註冊
                    try {
                        await createUserWithEmailAndPassword(auth, email, password);
                        console.log("[PACE DEBUG] Email registration successful.");
                        alert("註冊成功！您已自動登入。");
                        if (loginLightbox) loginLightbox.style.display = 'none';
                    } catch (registerError) {
                        console.error("Email registration error:", registerError);
                        alert("註冊失敗: " + registerError.message);
                    }
                } else {
                    console.error("Email login error:", loginError);
                    alert("登入失敗: " + loginError.message);
                }
            }
        });
    }

    if (closeAddressModalBtn) {
        closeAddressModalBtn.addEventListener('click', () => {
            console.log("[PACE DEBUG] Close address modal button clicked.");
            if (addressDetailLightbox) addressDetailLightbox.style.display = 'none';
        });
    }

    if (gpsPinBtn) {
        gpsPinBtn.addEventListener('click', () => {
            console.log("[PACE DEBUG] GPS pin button clicked, attempting to get browser location.");
            getBrowserLocation();
            if (addressDetailLightbox) addressDetailLightbox.style.display = 'flex';
        });
    }

    // 城市選擇器初始化與事件
    if (citySelect) {
        Object.keys(areaData).forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });

        citySelect.addEventListener('change', () => {
            console.log("[PACE DEBUG] City selected:", citySelect.value);
            const selectedCity = citySelect.value;
            if (districtSelect) {
                districtSelect.innerHTML = '<option value="">請選擇區域</option>';
                if (selectedCity && areaData[selectedCity]) {
                    areaData[selectedCity].forEach(district => {
                        const option = document.createElement('option');
                        option.value = district;
                        option.textContent = district;
                        districtSelect.appendChild(option);
                    });
                }
            }
            filterAndRenderStores();
        });
    }

    if (districtSelect) {
        districtSelect.addEventListener('change', () => {
            console.log("[PACE DEBUG] District selected:", districtSelect.value);
            filterAndRenderStores();
        });
    }

    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', () => {
            console.log("[PACE DEBUG] Global search input changed:", globalSearchInput.value);
            filterAndRenderStores();
        });
    }

    // 賣家註冊頁面專屬邏輯
    const registerPageSpecificElements = document.getElementById('shopRegisterForm'); // 檢查是否存在表單來判斷是否在註冊頁
    if (registerPageSpecificElements) {
        console.log("[PACE DEBUG] Initializing register page specific elements.");

        const addMenuItemBtn = document.getElementById('addMenuItemBtn');
        if (addMenuItemBtn) {
            addMenuItemBtn.addEventListener('click', () => {
                console.log("[PACE DEBUG] Add menu item button clicked.");
                addMenuItem();
            });
        }

        const toggleCashPay = document.getElementById('toggleCashPay');
        if (toggleCashPay) {
            toggleCashPay.addEventListener('change', (event) => {
                console.log("[PACE DEBUG] Cash pay toggle changed. New state:", event.target.checked);
                if (event.target.checked) {
                    alert("⚠️ 開啟現金支付代表您將接受顧客到店取貨時以現金付款，請確保您有足夠的零錢可供找零！");
                }
            });
        }

        // 修正 shopSubmitBtn 監聽方式
        const shopSubmitBtn = document.getElementById('shopSubmitBtn');
        if (shopSubmitBtn) {
            shopSubmitBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // 阻止按鈕預設行為，雖然不是表單提交，但習慣性加上
                console.log("[PACE DEBUG] shopSubmitBtn click event triggered.");

                const user = auth.currentUser;
                if (!user) {
                    alert("請先登入才能建立店鋪！");
                    console.log("[PACE DEBUG] User not logged in, cannot submit shop.");
                    return;
                }

                const name = document.getElementById('shopNameInput')?.value.trim() || '';
                const phone = document.getElementById('shopPhoneInput')?.value.trim() || '';
                const city = document.getElementById('shopCitySelect')?.value || '';
                const district = document.getElementById('shopDistrictSelect')?.value || '';
                const detailAddress = document.getElementById('shopAddressInput')?.value.trim() || '';
                const isOnlinePayEnabled = document.getElementById('toggleOnlinePay') ? document.getElementById('toggleOnlinePay').checked : false;
                const isCashPayEnabled = document.getElementById('toggleCashPay') ? document.getElementById('toggleCashPay').checked : false;

                if (!name || !phone || !city || !district || !detailAddress) {
                    alert("⚠️ 請填寫完整的店舖資訊（店名、電話、地址等）！");
                    console.log("[PACE DEBUG] Missing shop information.");
                    return;
                }

                const inviteCode = document.getElementById('shopInviteCode')?.value.trim() || '';
                const status = document.getElementById('shopStatus')?.value || 'online';
                const prepareTime = parseInt(document.getElementById('prepareTimeInput')?.value) || 15;
                const logoEl = document.getElementById('shopLogoPreview');
                const shopLogoData = (logoEl && logoEl.style.display !== 'none') ? logoEl.src : "";
                
                const merchantIdValue = document.getElementById('merchantIdInput')?.value.trim() || '';
                const hashKeyValue = document.getElementById('hashKeyInput')?.value.trim() || '';
                const hashIvValue = document.getElementById('hashIvInput')?.value.trim() || '';
                
                // 抓取菜單
                const menuRows = document.querySelectorAll('.menu-item-row');
                const menuItems = [];
                menuRows.forEach(row => {
                    const nameField = row.querySelector('.item-name-input');
                    const priceField = row.querySelector('.price-input');
                    const nameVal = nameField ? nameField.value.trim() : '';
                    const priceVal = priceField ? parseInt(priceField.value) || 0 : 0;
                    const imgEl = row.querySelector('.preview-img');
                    const imgData = (imgEl && imgEl.style.display !== 'none') ? imgEl.src : "";
                    if (nameVal) menuItems.push({ name: nameVal, price: priceVal, image: imgData });
                });

                const shopData = {
                    sellerUid: user.uid,
                    shopName: name, shopPhone: phone, city: city, district: district,
                    shopAddress: `${city}${district}${detailAddress}`,
                    inviteCode: inviteCode, status: status, shopLogo: shopLogoData,
                    prepareTime: prepareTime, isOnlinePayEnabled: isOnlinePayEnabled,
                    isCashPayEnabled: isCashPayEnabled,
                    newebpayConfig: { MerchantID: merchantIdValue, HashKey: hashKeyValue, HashIV: hashIvValue },
                    menuList: menuItems, createdAt: new Date().toISOString()
                };

                if (shopSubmitBtn) {
                    shopSubmitBtn.innerText = "⚡ 正在打通雲端地基中...";
                    shopSubmitBtn.disabled = true;
                }

                try {
                    console.log("[PACE DEBUG] Attempting to write shop data to Firestore.", shopData);
                    // 執行寫入
                    await setDoc(doc(db, "stores", user.uid), shopData);
                    
                    // 更新使用者角色為賣家
                    await updateDoc(doc(db, "users", user.uid), { role: "seller" });
                    
                    alert("🎉 恭喜老闆！您的店鋪（" + name + "）已成功開張！");
                    console.log("[PACE DEBUG] Shop created successfully, redirecting to seller.html.");
                    window.location.href = "seller.html";
                } catch (dbError) {
                    console.error("提交失敗：", dbError);
                    alert("寫入失敗：" + dbError.message);
                    if (shopSubmitBtn) {
                        shopSubmitBtn.innerText = "建立店鋪";
                        shopSubmitBtn.disabled = false;
                    }
                }
            });
        }

        // 處理店鋪城市和區域選擇
        const shopCitySelect = document.getElementById('shopCitySelect');
        const shopDistrictSelect = document.getElementById('shopDistrictSelect');

        if (shopCitySelect) {
            Object.keys(areaData).forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                shopCitySelect.appendChild(option);
            });

            shopCitySelect.addEventListener('change', () => {
                console.log("[PACE DEBUG] Shop city selected:", shopCitySelect.value);
                const selectedCity = shopCitySelect.value;
                if (shopDistrictSelect) {
                    shopDistrictSelect.innerHTML = '<option value="">請選擇區域</option>';
                    if (selectedCity && areaData[selectedCity]) {
                        areaData[selectedCity].forEach(district => {
                            const option = document.createElement('option');
                            option.value = district;
                            option.textContent = district;
                            shopDistrictSelect.appendChild(option);
                        });
                    }
                }
            });
        }
    }

    loadHeader();
});

// ==========================================
// 5. 資料處理與渲染
// ==========================================

async function fetchStoresFromFirebase() {
    try {
        console.log("[PACE DEBUG] Fetching stores from Firebase.");
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
    citySelect = document.getElementById('citySelect');
    districtSelect = document.getElementById('districtSelect');
    globalSearchInput = document.getElementById('globalSearchInput');
    
    const selectedCity = citySelect ? citySelect.value : '';
    const selectedDist = districtSelect ? districtSelect.value : '';
    const searchKeyword = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';

    console.log(`[PACE DEBUG] Filtering stores: City=${selectedCity}, District=${selectedDist}, Keyword=${searchKeyword}`);

    const filtered = allStores.filter(store => {
        const matchCity = !selectedCity || store.city === selectedCity;
        const matchDist = !selectedDist || store.district === selectedDist;
        const nameToSearch = store.shopName || store.name || '';
        const matchKeyword = !searchKeyword || nameToSearch.toLowerCase().includes(searchKeyword);
        return matchCity && matchDist && matchKeyword;
    });

    if (filtered.length === 0) {
        storeContainer.innerHTML = '<div class="loading-Spinner">🍃 此商圈目前尚無合作店家進駐喔！</div>';
        return;
    }

    storeContainer.innerHTML = "";
    filtered.forEach(store => {
        if (store.status === "offline") return;
        const finalName = store.shopName || store.name || '未命名店家';
        const finalAddress = store.shopAddress || store.address || '';
        const finalCity = store.city || '';
        const finalDistrict = store.district || '';
        const takeoutSupported = store.isCashPayEnabled !== false;
        const paySupported = store.isOnlinePayEnabled !== false;

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
                console.log("[PACE DEBUG] GPS location obtained.", { lat: buyerLat, lng: buyerLng });
            },
            (error) => {
                currentBuyerAddress = "瀏覽器定位遭拒，請手動選擇下拉選單縣市。";
                if (gpsPinBtn) gpsPinBtn.innerText = "📍 無法定位";
                if (modalAddressText) modalAddressText.innerText = currentBuyerAddress;
                console.warn("[PACE DEBUG] GPS location error:", error.message);
            }
        );
    } else {
        currentBuyerAddress = "您的裝置不支援 GPS 定位裝置。";
        console.warn("[PACE DEBUG] Geolocation not supported by browser.");
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('adminStoreTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (allStores.length === 0) {
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

// ==========================================
// 6. 拖曳菜單專屬函式區 (賣家)
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
    row.style.border = '2px dashed var(--brand-blue)';
    if (e.type.startsWith('touch')) {
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    } else {
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
    }
    console.log("[PACE DEBUG] Drag started for item:", row);
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
    activeDragItem.style.border = '1px solid var(--border-color)';
    activeDragItem = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onDragMove);
    window.removeEventListener('touchend', onDragEnd);
    console.log("[PACE DEBUG] Drag ended.");
}

// ==========================================
// 7. Window 全域綁定區 (給 HTML onclick 呼叫)
// ==========================================

window.deleteRow = function(btn) {
    menuUploadList = document.getElementById('menuUploadList');
    if (!menuUploadList) return;
    const rows = menuUploadList.querySelectorAll('.menu-item-row');
    if (rows.length <= 1) { alert("報告老闆，店裡至少要留一項商品才能開張喔！"); return; }
    btn.closest('.menu-item-row').remove();
    console.log("[PACE DEBUG] Menu item row deleted.");
};

window.triggerUpload = function(box) {
    const fileInput = box.querySelector('.image-input');
    if (fileInput) fileInput.click();
    console.log("[PACE DEBUG] Triggering image upload.");
};

window.previewImage = function(input) {
    const box = input.parentElement;
    const img = box.querySelector('.preview-img');
    const placeholder = box.querySelector('.upload-placeholder');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            img.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            console.log("[PACE DEBUG] Image preview updated.");
        };
        reader.readAsDataURL(input.files[0]);
    }
};

const adminSubmitStoreBtn = document.getElementById('adminSubmitStoreBtn');
if (adminSubmitStoreBtn) {
    adminSubmitStoreBtn.addEventListener('click', async () => {
        console.log("[PACE DEBUG] Admin submit store button clicked.");
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
            console.log("[PACE DEBUG] Admin store submission missing required fields.");
            return;
        }

        adminSubmitStoreBtn.innerText = "⏳ 正在同步至雲端...";
        try {
            console.log("[PACE DEBUG] Admin attempting to add new store to Firestore.");
            await addDoc(collection(db, "stores"), {
                name: name, shopName: name, phone: phone, city: city, district: district,
                address: address, shopAddress: address, isCashPayEnabled: isCashPayEnabled,
                isOnlinePayEnabled: isOnlinePayEnabled, status: status, inviteCode: inviteCode,               
                menu: [], createdAt: new Date().toISOString()
            });
            alert("✅ 店家已成功新增至雲端！");
            console.log("[PACE DEBUG] Admin store added successfully.");
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
            console.log("[PACE DEBUG] Attempting to delete store with ID:", storeId);
            await deleteDoc(doc(db, "stores", storeId));
            alert("🗑️ 店家已從雲端刪除！");
            console.log("[PACE DEBUG] Store deleted successfully.");
            fetchStoresFromFirebase();
        } catch (error) {
            console.error("刪除店家失敗:", error);
            alert("刪除失敗，請檢查網路或資料庫權限！");
        }
    }
};
