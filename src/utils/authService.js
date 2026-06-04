/**
 * Gurukripa Bricks - Authentication Service
 */
var AuthService = {
    // SHA-256 implementation in vanilla JS using subtle crypto
    sha256: async (message) => {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    hashPassword: async (password) => {
        try {
            return await AuthService.sha256(password);
        } catch (e) {
            // Fallback for unsafe contexts/older browsers
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'fallback-hash-' + hash;
        }
    },

    getUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),
    isLoggedIn: () => !!JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),

    login: (email, password, rememberMe) => {
        return new Promise((resolve, reject) => {
            // Simulated API delay
            setTimeout(async () => {
                try {
                    const users = JSON.parse(localStorage.getItem('users_db')) || [];
                    const emailNormalized = email.toLowerCase().trim();
                    const passwordHash = await AuthService.hashPassword(password);
                    
                    const matchedUser = users.find(u => u.email.toLowerCase().trim() === emailNormalized && u.passwordHash === passwordHash);
                    
                    if (matchedUser) {
                        const sessionUser = { ...matchedUser };
                        delete sessionUser.passwordHash; // Omit password hash in session
                        
                        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionUser));
                        if (rememberMe) localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
                        
                        AuthService.updateUI(sessionUser);
                        showToast('🎉 Login successful! Welcome back!');
                        resolve(sessionUser);
                    } else {
                        reject('Invalid email or password.');
                    }
                } catch (e) {
                    reject('Login failed. Please try again.');
                }
            }, 1000);
        });
    },

    register: (userData) => {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const users = JSON.parse(localStorage.getItem('users_db')) || [];
                    const emailNormalized = userData.email.toLowerCase().trim();
                    
                    if (users.some(u => u.email.toLowerCase().trim() === emailNormalized)) {
                        reject('An account with this email already exists.');
                        return;
                    }
                    
                    const passwordHash = await AuthService.hashPassword(userData.password);
                    
                    const newUser = {
                        id: Date.now(),
                        name: userData.name.trim(),
                        email: emailNormalized,
                        mobile: userData.mobile.trim(),
                        passwordHash: passwordHash,
                        address: userData.address ? userData.address.trim() : '',
                        profileImage: '',
                        orders: []
                    };
                    
                    users.push(newUser);
                    localStorage.setItem('users_db', JSON.stringify(users));
                    
                    const sessionUser = { ...newUser };
                    delete sessionUser.passwordHash;
                    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionUser));
                    
                    AuthService.updateUI(sessionUser);
                    showToast('🎊 Registration successful! Welcome to Gurukripa!');
                    resolve(sessionUser);
                } catch (e) {
                    reject('Registration failed. Please try again.');
                }
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

        // Load fresh user data from database to get live orders
        const users = JSON.parse(localStorage.getItem('users_db')) || [];
        const dbUser = users.find(u => u.id === user.id) || user;
        const orders = dbUser.orders || [];

        // Calculate dynamic stats
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        const spentText = totalSpent >= 1000 ? '₹' + (totalSpent / 1000).toFixed(1) + 'k' : '₹' + totalSpent;
        const savedBricksCount = 8; // Simulated saved bricks

        container.innerHTML = `
            <div class="dashboard-modern">
                <!-- 1. Header Section -->
                <header class="dashboard-header animate-slide-down">
                    <div class="dash-welcome">
                        <h2>${isHindi ? `नमस्ते, ${dbUser.name}! 👋` : `Welcome back, ${dbUser.name}! 👋`}</h2>
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
                        <div class="user-avatar-premium" id="dashAvatarLarge" style="width: 100px; height: 100px; margin: 0 auto 20px; box-shadow: 0 0 30px rgba(139, 92, 246, 0.4); border: 4px solid rgba(255, 255, 255, 0.9); border-radius: 50%; overflow: hidden;">
                            ${dbUser.profileImage ? `<img id="dashAvatarImg" src="${dbUser.profileImage}" alt="${dbUser.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span id="dashAvatarInitial" style="font-size: 2.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; height:100%; width:100%; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; border-radius: 50%;">${AuthService.getInitials(dbUser.name)}</span>`}
                        </div>
                        <div class="profile-info-stack">
                            <h3 class="user-name-title">${dbUser.name}</h3>
                            <p class="user-email-subtitle">${dbUser.email}</p>
                            
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
                                    <span class="stat-number">${String(totalOrders).padStart(2, '0')}</span>
                                    <span class="stat-label">${isHindi ? 'ऑर्डर' : 'Total Orders'}</span>
                                </div>
                            </div>
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.2s">
                                <div class="stat-icon-wrap"><i class="ion-ios-cart-outline"></i></div>
                                <div class="stat-info">
                                    <span class="stat-number">${spentText}</span>
                                    <span class="stat-label">${isHindi ? 'खर्च' : 'Total Spent'}</span>
                                </div>
                            </div>
                            <div class="stat-card animate-scale-in" style="animation-delay: 0.3s">
                                <div class="stat-icon-wrap"><i class="ion-ios-heart-outline"></i></div>
                                <div class="stat-info">
                                    <span class="stat-number">${String(savedBricksCount).padStart(2, '0')}</span>
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
                                <a href="javascript:void(0)" class="dash-link-card" onclick="switchDashboardTab('addresses')">
                                    <i class="ion-ios-location-outline"></i>
                                    <span>${isHindi ? 'पता' : 'Saved Addresses'}</span>
                                </a>
                                <a href="javascript:void(0)" class="dash-link-card" onclick="switchDashboardTab('wishlist')">
                                    <i class="ion-ios-heart-outline"></i>
                                    <span>${isHindi ? 'विशलिस्ट' : 'My Wishlist'}</span>
                                </a>
                            </div>
                        </div>

                        <!-- Wishlist Section (hidden by default) -->
                        <div class="dash-wishlist-section" id="dashWishlistSection" style="display:none;">
                            <div class="section-flex-header">
                                <h4 class="dash-section-label">${isHindi ? 'मेरी विशलिस्ट' : 'My Wishlist'}</h4>
                                <button class="btn-sm-outline" onclick="switchDashboardTab('main')">← Back</button>
                            </div>
                            <div class="wishlist-grid" id="dashWishlistGrid">
                                ${(() => {
                                    const wished = typeof WishlistService !== 'undefined' ? WishlistService.getWishlistProducts() : [];
                                    if (wished.length === 0) return '<div class="empty-state"><p>No items in wishlist yet.</p></div>';
                                    return wished.map(p => `
                                        <div class="wishlist-card">
                                            <img src="${p.image}" alt="${p.name}" class="wishlist-card-img" onerror="this.src='src/assets/images/redbrick1.jpg'">
                                            <div class="wishlist-card-info">
                                                <h4>${p.name}</h4>
                                                <span class="wishlist-card-price">₹${p.price}/pc</span>
                                                <div class="wishlist-card-actions">
                                                    <button class="btn-sm-primary" onclick="CartService.add(${p.id}); WishlistService.remove(${p.id}); switchDashboardTab('main'); showToast('✅ Moved to cart');">Move to Cart</button>
                                                    <button class="btn-sm-text" onclick="WishlistService.remove(${p.id}); AuthService.renderDashboard();">Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('');
                                })()}
                            </div>
                        </div>

                        <!-- Addresses Section (hidden by default) -->
                        <div class="dash-addresses-section" id="dashAddressesSection" style="display:none;">
                            <div class="section-flex-header">
                                <h4 class="dash-section-label">${isHindi ? 'सहेजे गए पते' : 'Saved Addresses'}</h4>
                                <button class="btn-sm-outline" onclick="switchDashboardTab('main')">← Back</button>
                            </div>
                            <div class="address-card-list">
                                <div class="address-card">
                                    <div class="address-card-header">
                                        <span class="address-type-badge">🏠 Home</span>
                                    </div>
                                    <p class="address-text">${dbUser.address || 'No address saved'}</p>
                                    <div class="address-card-actions">
                                        <button class="btn-sm-outline" onclick="openEditProfileModal()">Edit</button>
                                    </div>
                                </div>
                                <button class="address-add-btn" onclick="showToast('📍 Address manager coming soon!')">
                                    <i class="ion-ios-plus-outline"></i> Add New Address
                                </button>
                            </div>
                        </div>

                        <!-- 4. Recent Activity / Orders -->
                        <div class="recent-orders-outer animate-fade-in" style="animation-delay: 0.5s">
                            <div class="section-flex-header">
                                <h4 class="dash-section-label">${isHindi ? 'हाल के ऑर्डर' : 'Recent Tracked Orders'}</h4>
                                <a href="javascript:void(0)" class="view-all-link" onclick="navigateTo('orders')">${isHindi ? 'सभी देखें' : 'View All'}</a>
                            </div>
                            
                            <div class="orders-stack">
                                ${orders.length > 0 ? orders.slice().reverse().map(order => {
                                    const dateStr = new Date(order.date).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                    const qty = order.items.reduce((sum, item) => sum + item.quantity, 0);
                                    const statusClass = order.status.toLowerCase();
                                    const statusLabel = isHindi ? (statusClass === 'delivered' ? 'डिलिवर हो गया' : statusClass === 'shipped' ? 'रास्ते में है' : 'प्रगति पर है') : order.status;
                                    
                                    return `
                                        <div class="order-modern-card">
                                            <div class="order-main-info">
                                                <div class="order-id-tag">#${order.id}</div>
                                                <div class="order-meta">${isHindi ? 'ऑर्डर किया गया:' : 'Ordered on'} ${dateStr} • ${qty} ${isHindi ? 'ईंटें' : 'Bricks'}</div>
                                                <div class="order-tracking-timeline">
                                                    <div class="tracking-step ${['ordered','confirmed','shipped','delivered'].indexOf(order.status.toLowerCase()) >= 0 ? 'done' : ''}">
                                                        <span class="tracking-dot"></span><span class="tracking-label">Ordered</span>
                                                    </div>
                                                    <div class="tracking-line ${['confirmed','shipped','delivered'].indexOf(order.status.toLowerCase()) >= 0 ? 'done' : ''}"></div>
                                                    <div class="tracking-step ${['confirmed','shipped','delivered'].indexOf(order.status.toLowerCase()) >= 0 ? 'done' : ''}">
                                                        <span class="tracking-dot"></span><span class="tracking-label">Confirmed</span>
                                                    </div>
                                                    <div class="tracking-line ${['shipped','delivered'].indexOf(order.status.toLowerCase()) >= 0 ? 'done' : ''}"></div>
                                                    <div class="tracking-step ${['shipped','delivered'].indexOf(order.status.toLowerCase()) >= 0 ? 'done' : ''}">
                                                        <span class="tracking-dot"></span><span class="tracking-label">Shipped</span>
                                                    </div>
                                                    <div class="tracking-line ${order.status.toLowerCase() === 'delivered' ? 'done' : ''}"></div>
                                                    <div class="tracking-step ${order.status.toLowerCase() === 'delivered' ? 'done' : ''}">
                                                        <span class="tracking-dot"></span><span class="tracking-label">Delivered</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="order-status-pill ${statusClass}">${statusLabel}</div>
                                            <button class="order-action-btn" onclick="AuthService.downloadInvoice('${order.id}')" title="${isHindi ? 'इनवॉइस डाउनलोड करें' : 'Download Invoice'}">
                                                <i class="ion-ios-download-outline"></i>
                                            </button>
                                        </div>
                                    `;
                                }).join('') : `
                                    <div class="empty-state">
                                        <div class="empty-state-icon">📦</div>
                                        <p class="empty-state-description">${isHindi ? 'आपने अभी तक कोई ऑर्डर नहीं दिया है।' : 'You have not placed any orders yet.'}</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;
    },

    downloadInvoice: (orderId) => {
        const user = AuthService.getUser();
        if (!user) return;
        
        const users = JSON.parse(localStorage.getItem('users_db')) || [];
        const dbUser = users.find(u => u.id === user.id) || user;
        const order = dbUser.orders ? dbUser.orders.find(o => o.id === orderId) : null;
        
        if (!order) {
            showToast('❌ Order not found');
            return;
        }

        const elements = {
            'invNumber': order.id,
            'invDate': new Date(order.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            'invCustName': dbUser.name,
            'invCustMobile': dbUser.mobile || '',
            'invCustAddr': order.address || dbUser.address || '',
            'invMethod': order.paymentMethod || 'Credit/Debit Card',
            'invTxn': order.transactionId || 'TXN_' + Math.floor(100000000 + Math.random() * 900000000),
            'invSubtotal': '₹' + order.total.toLocaleString('en-IN'),
            'invTotal': '₹' + order.total.toLocaleString('en-IN')
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }

        const itemsContainer = document.getElementById('invItems');
        if (itemsContainer) {
            itemsContainer.innerHTML = order.items.map((item, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${item.name}</td>
                    <td>₹${Number(item.price).toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
            `).join('');
        }

        Modals.open('invoiceModal');
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

        // Save back to user registry database
        const users = JSON.parse(localStorage.getItem('users_db')) || [];
        const index = users.findIndex(u => u.id === currentUser.id);
        if (index !== -1) {
            users[index] = { ...users[index], ...newData };
            localStorage.setItem('users_db', JSON.stringify(users));
        }

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

        // Save back to user registry database
        const users = JSON.parse(localStorage.getItem('users_db')) || [];
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index].profileImage = imageData;
            localStorage.setItem('users_db', JSON.stringify(users));
        }

        // Use the central synchronization method
        AuthService.syncAllAvatars(user);
        showToast('📸 Profile picture updated!');
    },

    init: async () => {
        // Initialize default user registry database if not exists
        let users = JSON.parse(localStorage.getItem('users_db'));
        if (!users || users.length === 0) {
            users = [];
            
            const defaultUser = {
                id: 10001,
                name: 'Praveen Singh',
                email: 'praveen@example.com',
                mobile: '9198923230',
                passwordHash: '',
                address: 'Jaunpur, Uttar Pradesh, India - 222001',
                profileImage: '',
                orders: [
                    {
                        id: 'GB-2041',
                        date: '2026-05-15T10:30:00.000Z',
                        items: [{ id: 1, name: 'Shiv Eent (Grade-A)', price: 7.5, quantity: 500, image: 'src/assets/images/redbrick1.jpg' }],
                        total: 3750,
                        status: 'Delivered',
                        address: 'Jaunpur, Uttar Pradesh, India - 222001',
                        paymentMethod: 'Cash on Delivery',
                        transactionId: 'TXN_COD8274619'
                    },
                    {
                        id: 'GB-1982',
                        date: '2026-05-12T14:15:00.000Z',
                        items: [{ id: 2, name: 'Premium Red Bricks', price: 6.5, quantity: 200, image: 'src/assets/images/redbricks.jpg' }],
                        total: 1300,
                        status: 'Shipped',
                        address: 'Jaunpur, Uttar Pradesh, India - 222001',
                        paymentMethod: 'UPI',
                        transactionId: 'TXN_UPI9827461'
                    }
                ]
            };
            // Seed default password 'Password123'
            defaultUser.passwordHash = await AuthService.hashPassword('Password123');
            users.push(defaultUser);
            localStorage.setItem('users_db', JSON.stringify(users));
        }

        const user = AuthService.getUser();
        if (user) {
            // Retrieve fresh profile from database
            const dbUser = users.find(u => u.id === user.id);
            if (dbUser) {
                const sessionUser = { ...dbUser };
                delete sessionUser.passwordHash;
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionUser));
                AuthService.updateUI(sessionUser);
            } else {
                AuthService.updateUI(user);
            }
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

