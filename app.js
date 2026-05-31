    // 監聽 Firebase 登入狀態
    onAuthStateChanged(auth, (user) => {
        if (user) {
            handleUserSyncAndRoleRouting(user);
            document.getElementById('statusDot')?.classList.add('active');
            const statusText = document.getElementById('statusText');
            if(statusText) statusText.innerText = `您好 ${user.displayName || 'PACE用戶'} ~\n目前沒有進行中的訂單喔！`;
        } else {
            if(loginBtn) loginBtn.style.display = 'block';
            if(avatarBtn) avatarBtn.style.display = 'none';
            if(dropdownMenu) {
                dropdownMenu.style.display = 'none';
                dropdownMenu.innerHTML = '';
            }
            document.getElementById('statusDot')?.classList.remove('active');
            const statusText = document.getElementById('statusText');
            if(statusText) statusText.innerText = "您尚未登入，請連結google帳號\n或使用電子郵件登入";
        }
    });

    // 預設讓買家畫面顯示
    const buyerView = document.getElementById('buyerView');
    if (buyerView) buyerView.style.display = 'block';

    // 啟動資料庫與定位抓取
    fetchStoresFromFirebase();
    getBrowserLocation();
});
