/**
 * Gurukripa Bricks - Wishlist Service
 * Handles wishlist persistence via localStorage and UI updates.
 */
const WishlistService = {
    STORAGE_KEY: 'gurukripa_wishlist',
    
    init: () => {
        WishlistService.updateBadge();
    },

    getAll: () => {
        try {
            return JSON.parse(localStorage.getItem(WishlistService.STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    },

    isWishlisted: (productId) => {
        const list = WishlistService.getAll();
        return list.includes(productId);
    },

    toggle: (productId) => {
        let list = WishlistService.getAll();
        const index = list.indexOf(productId);
        
        if (index > -1) {
            list.splice(index, 1);
            showToast('💔 Removed from wishlist');
        } else {
            list.push(productId);
            showToast('❤️ Added to wishlist!');
        }
        
        try {
            localStorage.setItem(WishlistService.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn('Failed to save wishlist:', e);
        }
        
        WishlistService.updateBadge();
        WishlistService.updateCardHeart(productId);
    },

    remove: (productId) => {
        let list = WishlistService.getAll();
        list = list.filter(id => id !== productId);
        try {
            localStorage.setItem(WishlistService.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        WishlistService.updateBadge();
        WishlistService.updateCardHeart(productId);
    },

    getCount: () => {
        return WishlistService.getAll().length;
    },

    updateBadge: () => {
        const badge = document.getElementById('wishlistBadge');
        const count = WishlistService.getCount();
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('visible', count > 0);
        }
    },

    updateCardHeart: (productId) => {
        const hearts = document.querySelectorAll(`.wishlist-heart[data-product-id="${productId}"]`);
        hearts.forEach(heart => {
            heart.classList.toggle('active', WishlistService.isWishlisted(productId));
        });
    },

    getWishlistProducts: () => {
        const list = WishlistService.getAll();
        return (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).filter(p => list.includes(p.id));
    }
};

window.WishlistService = WishlistService;
