// ============================================
// SMART FUNCTIONALITIES
// ============================================

(function() {
    'use strict';

    // ============================================
    // QR CODE GENERATOR
    // ============================================
    
    function generateQRCode(text, size = 200) {
        // Using QR.js library (you can use any QR library)
        const qrContainer = document.createElement('div');
        qrContainer.className = 'qr-code-container';
        qrContainer.innerHTML = `
            <div class="qr-code" style="width: ${size}px; height: ${size}px; background: white; padding: 20px; border-radius: 10px;">
                <canvas id="qrCanvas" width="${size}" height="${size}"></canvas>
            </div>
            <button class="btn btn-primary" onclick="downloadQRCode()">Download QR Code</button>
        `;

        // Simple QR code generation (for production, use a library like qrcode.js)
        drawQRCode(text, size);
        
        return qrContainer;
    }

    function drawQRCode(text, size) {
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        // This is a placeholder - use a proper QR library in production
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('QR: ' + text.substring(0, 20), 10, size / 2);
    }

    function sharePageAsQR() {
        const url = window.location.href;
        const qrModal = document.createElement('div');
        qrModal.className = 'modal';
        qrModal.id = 'qrModal';
        qrModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Share Page</h2>
                    <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    ${generateQRCode(url).outerHTML}
                </div>
            </div>
        `;
        document.body.appendChild(qrModal);
        qrModal.style.display = 'flex';
    }

    // ============================================
    // VOICE SEARCH
    // ============================================
    
    function initVoiceSearch() {
        const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search" i]');
        
        searchInputs.forEach(input => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                return;
            }

            const voiceButton = document.createElement('button');
            voiceButton.type = 'button';
            voiceButton.className = 'voice-search-btn';
            voiceButton.innerHTML = '<i class="ion-ios-mic"></i>';
            voiceButton.setAttribute('aria-label', 'Voice search');
            voiceButton.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 1.2rem;';

            input.style.paddingRight = '40px';
            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(voiceButton);

            voiceButton.addEventListener('click', function() {
                startVoiceSearch(input);
            });
        });
    }

    function startVoiceSearch(input) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        input.placeholder = 'Listening...';
        recognition.start();

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('search', { bubbles: true }));
        };

        recognition.onerror = function(event) {
            console.error('Voice search error:', event.error);
            input.placeholder = 'Voice search failed';
        };

        recognition.onend = function() {
            input.placeholder = 'Search...';
        };
    }

    // ============================================
    // SMART FILTERING UI
    // ============================================
    
    function initSmartFilters() {
        const filterContainers = document.querySelectorAll('.product-category-filters, .blog-filters');
        
        filterContainers.forEach(container => {
            // Add search within filters
            const searchBox = document.createElement('input');
            searchBox.type = 'text';
            searchBox.placeholder = 'Search filters...';
            searchBox.className = 'filter-search';
            searchBox.style.cssText = 'width: 100%; max-width: 300px; margin-bottom: 15px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px;';

            container.insertBefore(searchBox, container.firstChild);

            searchBox.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                const buttons = container.querySelectorAll('button');
                
                buttons.forEach(button => {
                    const text = button.textContent.toLowerCase();
                    if (text.includes(query)) {
                        button.style.display = '';
                    } else {
                        button.style.display = 'none';
                    }
                });
            });
        });
    }

    // ============================================
    // BOOKMARK/FAVORITE SYSTEM
    // ============================================
    
    function initBookmarkSystem() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const bookmarkBtn = document.createElement('button');
            bookmarkBtn.className = 'bookmark-btn';
            bookmarkBtn.innerHTML = '<i class="ion-ios-star-outline"></i>';
            bookmarkBtn.setAttribute('aria-label', 'Bookmark product');
            bookmarkBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 10;';

            const productId = card.dataset.id || card.querySelector('h3')?.textContent;
            
            if (isBookmarked(productId)) {
                bookmarkBtn.innerHTML = '<i class="ion-ios-star"></i>';
                bookmarkBtn.style.color = 'var(--primary-color)';
            }

            bookmarkBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleBookmark(productId, bookmarkBtn);
            });

            if (card.style.position !== 'relative') {
                card.style.position = 'relative';
            }
            card.appendChild(bookmarkBtn);
        });
    }

    function isBookmarked(id) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        return bookmarks.includes(id);
    }

    function toggleBookmark(id, button) {
        let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        
        if (bookmarks.includes(id)) {
            bookmarks = bookmarks.filter(b => b !== id);
            button.innerHTML = '<i class="ion-ios-star-outline"></i>';
            button.style.color = '';
            if (typeof showToast === 'function') {
                showToast('Removed', 'Product removed from favorites', 'info');
            }
        } else {
            bookmarks.push(id);
            button.innerHTML = '<i class="ion-ios-star"></i>';
            button.style.color = 'var(--primary-color)';
            if (typeof showToast === 'function') {
                showToast('Bookmarked', 'Product added to favorites', 'success');
            }
        }
        
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }

    // ============================================
    // USER ACTIVITY TRACKING
    // ============================================
    
    function initActivityTracking() {
        const activity = {
            pageViews: parseInt(localStorage.getItem('pageViews') || '0') + 1,
            lastVisit: new Date().toISOString(),
            timeSpent: 0,
            interactions: []
        };

        localStorage.setItem('pageViews', activity.pageViews.toString());
        localStorage.setItem('lastVisit', activity.lastVisit);

        // Track time spent
        const startTime = Date.now();
        window.addEventListener('beforeunload', function() {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            const totalTime = parseInt(localStorage.getItem('totalTimeSpent') || '0') + timeSpent;
            localStorage.setItem('totalTimeSpent', totalTime.toString());
        });

        // Track interactions
        document.addEventListener('click', function(e) {
            const interaction = {
                type: 'click',
                target: e.target.tagName,
                text: e.target.textContent?.substring(0, 50),
                timestamp: new Date().toISOString()
            };
            
            const interactions = JSON.parse(localStorage.getItem('interactions') || '[]');
            interactions.push(interaction);
            
            // Keep only last 100 interactions
            if (interactions.length > 100) {
                interactions.shift();
            }
            
            localStorage.setItem('interactions', JSON.stringify(interactions));
        }, { passive: true });
    }

    // ============================================
    // SWIPE GESTURES (MOBILE)
    // ============================================
    
    function initSwipeGestures() {
        if (!('ontouchstart' in window)) return;

        const swipeableElements = document.querySelectorAll('.product-card, .blog-card, .modal-content');
        
        swipeableElements.forEach(element => {
            let startX, startY, distX, distY;
            const threshold = 50; // Minimum distance for swipe

            element.addEventListener('touchstart', function(e) {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
            }, { passive: true });

            element.addEventListener('touchend', function(e) {
                if (!startX || !startY) return;

                const touch = e.changedTouches[0];
                distX = touch.clientX - startX;
                distY = touch.clientY - startY;

                if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > threshold) {
                    if (distX > 0) {
                        // Swipe right
                        element.dispatchEvent(new CustomEvent('swiperight'));
                    } else {
                        // Swipe left
                        element.dispatchEvent(new CustomEvent('swipeleft'));
                    }
                }

                startX = startY = null;
            }, { passive: true });
        });
    }

    // ============================================
    // INITIALIZE ALL SMART FEATURES
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initVoiceSearch();
                initSmartFilters();
                initBookmarkSystem();
                initActivityTracking();
                initSwipeGestures();
            });
        } else {
            initVoiceSearch();
            initSmartFilters();
            initBookmarkSystem();
            initActivityTracking();
            initSwipeGestures();
        }
    }

    init();

    // Export functions
    window.generateQRCode = generateQRCode;
    window.sharePageAsQR = sharePageAsQR;
    window.toggleBookmark = toggleBookmark;

})();

