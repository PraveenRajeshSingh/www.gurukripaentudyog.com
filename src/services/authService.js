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
            userMenu.style.display = 'block';
            if (userName) userName.textContent = user.name.split(' ')[0];
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
        const avatarContainers = document.querySelectorAll('.user-avatar-premium, .profile-avatar-container');
        avatarContainers.forEach(container => {
            const img = container.querySelector('img');
            const span = container.querySelector('span');

            if (user && user.profileImage && img) {
                img.src = user.profileImage;
                img.style.display = 'block';
                if (span) span.style.display = 'none';
            } else if (span) {
                span.style.display = 'flex';
                if (img) img.style.display = 'none';
            }
        });

        // Update mobile bottom nav profile button state
        if (typeof window.updateMobileNavProfileState === 'function') {
            window.updateMobileNavProfileState();
        }

        // Render dashboard if we are on dashboard page
        if (window.location.hash === '#dashboard' || window.location.hash === '#profile') {
            AuthService.renderDashboard();
        }
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
                <!-- 1. Welcome Section -->
                <header class="dashboard-header animate-slide-down">
                    <div class="dash-welcome">
                        <h2>${isHindi ? `नमस्ते, ${user.name}! 👋` : `Welcome, ${user.name}! 👋`}</h2>
                        <p>${isHindi ? 'अपने अकाउंट और ऑर्डर ट्रैक करें' : 'Manage your account and track your orders in real-time.'}</p>
                    </div>
                    <div class="dash-actions">
                         <button class="btn-dash btn-dash-primary" onclick="navigateTo('home')">
                            <i class="ion-ios-home-outline"></i> ${isHindi ? 'होम पर जाएं' : 'Go Home'}
                         </button>
                         <button class="btn-dash btn-dash-outline" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                            <i class="ion-ios-refresh"></i> ${isHindi ? 'रिफ्रेश करें' : 'Refresh'}
                         </button>
                    </div>
                </header>

                <div class="dashboard-grid">
                    <!-- 2. Profile Summary Card -->
                    <aside class="dash-card profile-summary-card animate-fade-in">
                        <div class="user-avatar-premium" id="dashAvatarLarge">
                            ${user.profileImage ? `<img src="${user.profileImage}" alt="${user.name}">` : `<span>${AuthService.getInitials(user.name)}</span>`}
                        </div>
                        <div class="profile-info">
                            <h3>${user.name}</h3>
                            <p>${user.email}</p>
                            
                            <div class="membership-status">
                                <i class="ion-ios-ribbon"></i>
                                <span>${isHindi ? 'गोल्ड मेंबर' : 'Gold Member'}</span>
                            </div>

                            <div class="dash-profile-badges">
                                <span class="user-badge">${user.role || (isHindi ? 'प्रीमियम ग्राहक' : 'Premium Customer')}</span>
                                
                                <div class="dash-profile-actions">
                                    <button class="btn-dash btn-dash-primary" onclick="openEditProfileModal()">
                                        <i class="ion-ios-compose-outline"></i> ${isHindi ? 'प्रोफ़ाइल बदलें' : 'Edit Profile'}
                                    </button>
                                    <button class="btn-dash btn-dash-outline" onclick="showToast('📍 Address manager coming soon!')">
                                        <i class="ion-ios-location-outline"></i> ${isHindi ? 'पता बदलें' : 'Manage Address'}
                                    </button>
                                    <button class="btn-dash btn-dash-outline" onclick="logoutUser()" style="color: var(--error); border-color: rgba(239, 68, 68, 0.2);">
                                        <i class="ion-log-out"></i> ${isHindi ? 'लॉगआउट' : 'Logout'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main class="dashboard-main-content">
                        <!-- 3. Quick Stats Cards -->
                        <div class="dash-stats-grid">
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.1s">
                                <i class="ion-ios-list-outline"></i>
                                <div class="stat-body">
                                    <span class="stat-num">3</span>
                                    <span class="stat-label">${isHindi ? 'ऑर्डर' : 'Orders'}</span>
                                </div>
                            </div>
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.2s">
                                <i class="ion-ios-cart-outline"></i>
                                <div class="stat-body">
                                    <span class="stat-num">₹12,000</span>
                                    <span class="stat-label">${isHindi ? 'कुल खर्च' : 'Total Spent'}</span>
                                </div>
                            </div>
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.3s">
                                <i class="ion-ios-star-outline"></i>
                                <div class="stat-body">
                                    <span class="stat-num">Gold</span>
                                    <span class="stat-label">${isHindi ? 'मेंबरशिप' : 'Level'}</span>
                                </div>
                            </div>
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.4s">
                                <i class="ion-ios-heart-outline"></i>
                                <div class="stat-body">
                                    <span class="stat-num">5</span>
                                    <span class="stat-label">${isHindi ? 'विशलिस्ट' : 'Wishlist'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 4. Quick Action Menu -->
                        <div class="quick-menu-section animate-fade-in" style="animation-delay: 0.5s">
                            <h3 class="section-title-dash"><i class="ion-ios-keypad-outline"></i> ${isHindi ? 'त्वरित लिंक' : 'Account Settings'}</h3>
                            <div class="quick-actions-list">
                                <a href="#orders" class="action-row-card" onclick="navigateTo('orders')">
                                    <div class="action-row-left">
                                        <i class="ion-ios-list-outline"></i>
                                        <span>${isHindi ? 'मेरे ऑर्डर' : 'My Orders'}</span>
                                    </div>
                                    <i class="ion-ios-arrow-forward"></i>
                                </a>
                                <a href="javascript:void(0)" class="action-row-card" onclick="showToast('🔍 Tracking system loading...')">
                                    <div class="action-row-left">
                                        <i class="ion-ios-navigate-outline"></i>
                                        <span>${isHindi ? 'ट्रैक ऑर्डर' : 'Track Order'}</span>
                                    </div>
                                    <i class="ion-ios-arrow-forward"></i>
                                </a>
                                <a href="javascript:void(0)" class="action-row-card" onclick="showToast('❤️ Wishlist coming soon!')">
                                    <div class="action-row-left">
                                        <i class="ion-ios-heart-outline"></i>
                                        <span>${isHindi ? 'विशलिस्ट' : 'My Wishlist'}</span>
                                    </div>
                                    <i class="ion-ios-arrow-forward"></i>
                                </a>
                                <a href="javascript:void(0)" class="action-row-card" onclick="showToast('🏠 Address manager loading...')">
                                    <div class="action-row-left">
                                        <i class="ion-ios-home-outline"></i>
                                        <span>${isHindi ? 'सेव किए गए पते' : 'Saved Addresses'}</span>
                                    </div>
                                    <i class="ion-ios-arrow-forward"></i>
                                </a>
                                <a href="javascript:void(0)" class="action-row-card" onclick="showToast('💳 Payments secure...')">
                                    <div class="action-row-left">
                                        <i class="ion-ios-card"></i>
                                        <span>${isHindi ? 'पेमेंट तरीके' : 'Payment Methods'}</span>
                                    </div>
                                    <i class="ion-ios-arrow-forward"></i>
                                </a>
                                <a href="javascript:void(0)" class="action-row-card" onclick="showToast('🎧 Support team notified!')">
                                    <div class="action-row-left">
                                        <i class="ion-ios-help-buoy"></i>
                                        <span>${isHindi ? 'मदद और सहायता' : 'Help & Support'}</span>
                                    </div>
                                    <i class="ion-ios-arrow-forward"></i>
                                </a>
                            </div>
                        </div>

                        <!-- 5. Recent Orders Section -->
                        <div class="recent-orders-section animate-fade-in" style="animation-delay: 0.6s">
                            <h3 class="section-title-dash"><i class="ion-ios-box-outline"></i> ${isHindi ? 'हाल के ऑर्डर' : 'Recent Orders'}</h3>
                            <div class="orders-list">
                                <!-- Order Item 1 -->
                                <div class="order-card">
                                    <div class="order-header">
                                        <span class="order-id">ID: #GB-2041</span>
                                        <span class="order-status status-delivered">${isHindi ? 'डिलिवर हो गया' : 'Delivered'}</span>
                                    </div>
                                    <div class="order-body">
                                        <div class="order-detail">
                                            <span class="detail-label">${isHindi ? 'तारीख' : 'Order Date'}</span>
                                            <span class="detail-value">May 12, 2026</span>
                                        </div>
                                        <div class="order-detail">
                                            <span class="detail-label">${isHindi ? 'कुल राशि' : 'Total Amount'}</span>
                                            <span class="detail-value">₹4,500</span>
                                        </div>
                                        <div class="order-detail">
                                            <span class="detail-label">${isHindi ? 'आइटम' : 'Items'}</span>
                                            <span class="detail-value">Red Bricks (500)</span>
                                        </div>
                                    </div>
                                    <div class="order-footer">
                                        <button class="btn-dash btn-dash-outline btn-sm">${isHindi ? 'विवरण' : 'Details'}</button>
                                        <button class="btn-dash btn-dash-primary btn-sm">${isHindi ? 'फिर से ऑर्डर करें' : 'Reorder'}</button>
                                    </div>
                                </div>

                                <!-- Order Item 2 (With Tracking UI) -->
                                <div class="order-card">
                                    <div class="order-header">
                                        <span class="order-id">ID: #GB-1982</span>
                                        <span class="order-status status-shipped">${isHindi ? 'भेजा गया' : 'Shipped'}</span>
                                    </div>
                                    <div class="order-body">
                                        <div class="order-detail">
                                            <span class="detail-label">${isHindi ? 'तारीख' : 'Order Date'}</span>
                                            <span class="detail-value">Apr 28, 2026</span>
                                        </div>
                                        <div class="order-detail">
                                            <span class="detail-label">${isHindi ? 'कुल राशि' : 'Total Amount'}</span>
                                            <span class="detail-value">₹8,200</span>
                                        </div>
                                        
                                        <!-- 6. Order Tracking UI -->
                                        <div class="tracking-container">
                                            <div class="tracking-steps">
                                                <div class="step completed">
                                                    <div class="step-icon"><i class="ion-ios-checkmark-empty"></i></div>
                                                    <span class="step-label">${isHindi ? 'ऑर्डर किया' : 'Ordered'}</span>
                                                </div>
                                                <div class="step completed">
                                                    <div class="step-icon"><i class="ion-ios-checkmark-empty"></i></div>
                                                    <span class="step-label">${isHindi ? 'पैक किया' : 'Packed'}</span>
                                                </div>
                                                <div class="step active">
                                                    <div class="step-icon"><i class="ion-ios-box"></i></div>
                                                    <span class="step-label">${isHindi ? 'शिप किया गया' : 'Shipped'}</span>
                                                </div>
                                                <div class="step">
                                                    <div class="step-icon">4</div>
                                                    <span class="step-label">${isHindi ? 'डिलीवरी के लिए तैयार' : 'Out for Delivery'}</span>
                                                </div>
                                                <div class="step">
                                                    <div class="step-icon">5</div>
                                                    <span class="step-label">${isHindi ? 'डिलिवर हो गया' : 'Delivered'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="order-footer">
                                        <button class="btn-dash btn-dash-primary btn-sm">${isHindi ? 'ट्रैक करें' : 'Track Order'}</button>
                                    </div>
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

