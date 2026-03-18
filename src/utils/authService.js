/**
 * Gurukripa Bricks - Authentication Service
 */
var AuthService = {
    getUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),
    isLoggedIn: () => !!JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),
    login: (email, password, rememberMe) => {
        return new Promise((resolve, reject) => {
            // Simulated API delay
            setTimeout(() => {
                if (email && password) {
                    const user = {
                        id: 1,
                        name: email.split('@')[0].replace(/\./g, ' '),
                        email: email
                    };
                    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                    if (rememberMe) localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');

                    AuthService.updateUI(user);
                    showToast('🎉 Login successful! Welcome back!');
                    resolve(user);
                } else {
                    reject('Invalid credentials');
                }
            }, 1000);
        });
    },

    register: (userData) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = { ...userData, id: Date.now() };
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                AuthService.updateUI(user);
                showToast('🎊 Registration successful! Welcome to Gurukripa!');
                resolve(user);
            }, 1000);
        });
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        AuthService.resetUI();
        showToast('👋 You have been logged out.');
    },

    updateUI: (user) => {
        const authActions = document.getElementById('authActions');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const mobileUserName = document.getElementById('mobileUserName');

        if (authActions) authActions.style.display = 'none';

        if (userMenu) {
            userMenu.style.display = 'flex'; // Use flex for better alignment
            if (userName) userName.textContent = user.name.split(' ')[0];

            // Sync Dropdown Fields
            const dropdownName = document.getElementById('dropdownUserName');
            const dropdownEmail = document.getElementById('dropdownUserEmail');
            if (dropdownName) dropdownName.textContent = user.name;
            if (dropdownEmail) dropdownEmail.textContent = user.email;
        }

        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'block';
            if (mobileUserName) mobileUserName.textContent = user.name;
            const mobileEmail = mobileUserMenu.querySelector('.mobile-user-email');
            if (mobileEmail) mobileEmail.textContent = user.email;
            const mobileAuth = document.getElementById('mobileAuthButtons');
            if (mobileAuth) mobileAuth.style.display = 'none';
        }

        // Update profile images across all instances
        AuthService.syncAllAvatars(user);

        // Update mobile bottom nav profile button state
        if (typeof window.updateMobileNavProfileState === 'function') {
            window.updateMobileNavProfileState();
        }

        // Render dashboard if we are on dashboard page
        if (window.location.hash === '#dashboard' || window.location.hash === '#profile') {
            AuthService.renderDashboard();
        }
    },

    syncAllAvatars: (user) => {
        // Collect all avatar containers and specific image/initial elements
        const containers = document.querySelectorAll('.user-avatar-premium, .profile-avatar-container, .user-avatar, .mobile-avatar-wrap');
        const imgEls = document.querySelectorAll('#profileModalImg, #editProfilePreview, #mobileNavAvatar img, #dropdownUserImg, #dashAvatarImg');
        const initialEls = document.querySelectorAll('#profileModalInitial, #editProfileInitials, #mobileNavAvatar span, #dropdownUserInitial, #dashAvatarInitial');

        const initials = AuthService.getInitials(user ? user.name : 'User');
        const hasImage = !!(user && user.profileImage);

        // Update individual elements for maximum precision
        imgEls.forEach(img => {
            if (hasImage) {
                img.src = user.profileImage;
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }
        });

        initialEls.forEach(span => {
            if (!hasImage) {
                span.textContent = initials;
                span.style.display = 'flex';
            } else {
                span.style.display = 'none';
            }
        });

        // Update generic containers for fallback coverage
        containers.forEach(container => {
            const img = container.querySelector('img');
            const span = container.querySelector('span');
            
            if (hasImage && img) {
                img.src = user.profileImage;
                img.style.display = 'block';
                if (span) span.style.display = 'none';
            } else if (!hasImage && span) {
                span.textContent = initials;
                span.style.display = 'flex';
                if (img) img.style.display = 'none';
            }
        });
    },

    renderDashboard: () => {
        const user = AuthService.getUser();
        const container = document.getElementById('dashboardContent');
        const dashboardSection = document.getElementById('dashboard');

        if (!user || !container || !dashboardSection) return;

        dashboardSection.style.display = 'block';
        const isHindi = TranslationService.getLanguage() === 'hi';

        container.innerHTML = `
            <div class="dashboard-modern">
                <!-- 1. Header Section -->
                <header class="dashboard-header animate-slide-down">
                    <div class="dash-welcome">
                        <h2>${isHindi ? `नमस्ते, ${user.name}! 👋` : `Welcome back, ${user.name}! 👋`}</h2>
                        <p>${isHindi ? 'जल्द ही अपनी अगली योजना बनाना शुरू करें।' : 'Ready to start your next construction project?'}</p>
                    </div>
                    <div class="dash-quick-btns">
                         <button class="btn-dash btn-dash-home" onclick="navigateTo('home')">
                            <i class="ion-ios-home-outline"></i> ${isHindi ? 'होम' : 'Go Home'}
                         </button>
                         <button class="btn-dash btn-dash-primary" onclick="navigateTo('products')">
                            <i class="ion-ios-cart-outline"></i> ${isHindi ? 'शॉपिंग करें' : 'Shop Now'}
                         </button>
                    </div>
                </header>

                <div class="dashboard-grid">
                    <!-- 2. Sticky Profile Summary -->
                    <aside class="dash-card profile-summary-card animate-fade-in">
                        <div class="user-avatar-premium" id="dashAvatarLarge" style="width: 100px; height: 100px; margin: 0 auto 20px;">
                            ${user.profileImage ? `<img id="dashAvatarImg" src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span id="dashAvatarInitial" style="font-size: 2.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; height:100%; background: #f3f4f6; border-radius: 50%;">${AuthService.getInitials(user.name)}</span>`}
                        </div>
                        <div class="profile-info-stack">
                            <h3 class="user-name-title">${user.name}</h3>
                            <p class="user-email-subtitle">${user.email}</p>
                            
                            <div class="membership-badge">
                                <i class="ion-ios-star"></i>
                                <span>${isHindi ? 'प्रीमियम मेंबर' : 'Premium Member'}</span>
                            </div>

                            <div class="dash-account-actions">
                                <button class="action-btn-pill" onclick="openProfileModal()">
                                    <i class="ion-ios-person-outline"></i> ${isHindi ? 'अकाउंट देखें' : 'View Account'}
                                </button>
                                <button class="action-btn-pill outline" onclick="openEditProfileModal()">
                                    <i class="ion-ios-compose-outline"></i> ${isHindi ? 'एडिट करें' : 'Edit Profile'}
                                </button>
                            </div>
                        </div>
                    </aside>

                    <!-- 3. Main Statistical Content -->
                    <main class="dashboard-main-content">
                        <div class="dash-stats-grid">
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.1s">
                                <div class="stat-icon-wrap"><i class="ion-ios-list-outline"></i></div>
                                <div class="stat-info">
                                    <span class="stat-number">03</span>
                                    <span class="stat-label">${isHindi ? 'ऑर्डर' : 'Total Orders'}</span>
                                </div>
                            </div>
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.2s">
                                <div class="stat-icon-wrap"><i class="ion-ios-cart-outline"></i></div>
                                <div class="stat-info">
                                    <span class="stat-number">₹14k+</span>
                                    <span class="stat-label">${isHindi ? 'खर्च' : 'Total Spent'}</span>
                                </div>
                            </div>
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.3s">
                                <div class="stat-icon-wrap"><i class="ion-ios-heart-outline"></i></div>
                                <div class="stat-info">
                                    <span class="stat-number">08</span>
                                    <span class="stat-label">${isHindi ? 'विशलिस्ट' : 'Saved Bricks'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Navigation Section -->
                        <div class="dash-links-section animate-fade-in" style="animation-delay: 0.4s">
                            <h4 class="dash-section-label">${isHindi ? 'त्वरित कार्रवाई' : 'Quick Actions'}</h4>
                            <div class="dash-links-grid">
                                <a href="javascript:void(0)" class="dash-link-card" onclick="navigateTo('orders')">
                                    <i class="ion-ios-paper-outline"></i>
                                    <span>${isHindi ? 'ऑर्डर हिस्ट्री' : 'Order History'}</span>
                                </a>
                                <a href="javascript:void(0)" class="dash-link-card" onclick="openCart()">
                                    <i class="ion-ios-cart-outline"></i>
                                    <span>${isHindi ? 'मेरा कार्ट' : 'My Shopping Cart'}</span>
                                </a>
                                <a href="javascript:void(0)" class="dash-link-card" onclick="showToast('🏠 Address manager loading...')">
                                    <i class="ion-ios-location-outline"></i>
                                    <span>${isHindi ? 'पता' : 'Saved Addresses'}</span>
                                </a>
                                <a href="javascript:void(0)" class="dash-link-card" onclick="App.toggleTheme()">
                                    <i class="ion-ios-color-palette-outline"></i>
                                    <span>${isHindi ? 'थीम' : 'Appearance'}</span>
                                </a>
                            </div>
                        </div>

                        <!-- 4. Recent Activity / Orders -->
                        <div class="recent-orders-outer animate-fade-in" style="animation-delay: 0.5s">
                            <div class="section-flex-header">
                                <h4 class="dash-section-label">${isHindi ? 'हाल के ऑर्डर' : 'Recent Tracked Orders'}</h4>
                                <a href="#" class="view-all-link" onclick="navigateTo('orders')">${isHindi ? 'सभी देखें' : 'View All'}</a>
                            </div>
                            
                            <div class="orders-stack">
                                <!-- Example Order Card -->
                                <div class="order-modern-card">
                                    <div class="order-main-info">
                                        <div class="order-id-tag">#GB-2041</div>
                                        <div class="order-meta">Ordered on 15 May, 2026 • 500 Red Bricks</div>
                                    </div>
                                    <div class="order-status-pill delivered">${isHindi ? 'डिलिवर हो गया' : 'Delivered'}</div>
                                    <button class="order-action-btn" onclick="showToast('Invoice loading...')">
                                        <i class="ion-ios-download-outline"></i>
                                    </button>
                                </div>

                                <div class="order-modern-card">
                                    <div class="order-main-info">
                                        <div class="order-id-tag">#GB-1982</div>
                                        <div class="order-meta">Ordered on 12 May, 2026 • 200 Shiv Bricks</div>
                                    </div>
                                    <div class="order-status-pill processing">${isHindi ? 'रास्ते में है' : 'Shipped'}</div>
                                    <button class="order-action-btn primary" onclick="showToast('Tracking your bricks...')">
                                        <i class="ion-ios-navigate-outline"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
    },

    getInitials: (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 1).toUpperCase();
    },

    resetUI: () => {
        const authActions = document.getElementById('authActions');
        const userMenu = document.getElementById('userMenu');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const dashboardSection = document.getElementById('dashboard');

        if (authActions) authActions.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'none';
        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'none';
            const mobileAuth = document.getElementById('mobileAuthButtons');
            if (mobileAuth) mobileAuth.style.display = 'block';
        }

        // Update mobile bottom nav profile button state
        if (typeof window.updateMobileNavProfileState === 'function') {
            window.updateMobileNavProfileState();
        }
    },

    updateUser: (newData) => {
        const currentUser = AuthService.getUser();
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...newData };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

        // Refresh UI everywhere
        AuthService.updateUI(updatedUser);

        // If on dashboard, re-render it
        if (window.location.hash === '#dashboard' || window.location.hash === '#profile') {
            AuthService.renderDashboard();
        }

        showToast('✅ Profile updated successfully!');
        return updatedUser;
    },

    updateProfileImage: (imageData) => {
        const user = AuthService.getUser();
        if (!user) return;

        user.profileImage = imageData;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        // Use the central synchronization method
        AuthService.syncAllAvatars(user);
        showToast('📸 Profile picture updated!');
    },

    init: () => {
        const user = AuthService.getUser();
        if (user) {
            AuthService.updateUI(user);
        }

        // Expose globally for HTML onclick handlers
        window.openLoginModal = () => Modals.open('loginModal');
        window.closeLoginModal = () => Modals.close('loginModal');
        window.openRegisterModal = () => Modals.open('registerModal');
        window.closeRegisterModal = () => Modals.close('registerModal');
        window.logoutUser = AuthService.logout;
        window.renderDashboard = AuthService.renderDashboard;

        // Expose editing functions
        window.updateUserProfile = AuthService.updateUser;
    }
};

// Initialization is managed by App.init in main.js

