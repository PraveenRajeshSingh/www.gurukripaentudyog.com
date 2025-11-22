// Functionality Test and Error Fix Script
(function() {
    'use strict';
    
    console.log('🔍 Testing website functionality...');
    
    const tests = {
        cart: false,
        language: false,
        products: false,
        chatbot: false,
        navigation: false,
        modals: false
    };
    
    // Test Cart Functionality
    function testCart() {
        try {
            if (typeof addToCart === 'function' && typeof openCart === 'function') {
                tests.cart = true;
                console.log('✅ Cart functionality: OK');
            } else {
                console.error('❌ Cart functionality: Missing functions');
            }
        } catch (e) {
            console.error('❌ Cart test error:', e);
        }
    }
    
    // Test Language Toggle
    function testLanguage() {
        try {
            const langToggle = document.getElementById('langToggle');
            if (langToggle && typeof window.setLanguage === 'function') {
                tests.language = true;
                console.log('✅ Language toggle: OK');
            } else {
                console.error('❌ Language toggle: Missing element or function');
            }
        } catch (e) {
            console.error('❌ Language test error:', e);
        }
    }
    
    // Test Products
    function testProducts() {
        try {
            if (typeof products !== 'undefined' && products.length > 0) {
                if (typeof renderProducts === 'function') {
                    tests.products = true;
                    console.log('✅ Products functionality: OK');
                } else {
                    console.error('❌ Products: renderProducts function missing');
                }
            } else {
                console.error('❌ Products: Products array not found');
            }
        } catch (e) {
            console.error('❌ Products test error:', e);
        }
    }
    
    // Test Chatbot
    function testChatbot() {
        try {
            const chatbot = document.getElementById('chatbot');
            const chatbotToggle = document.getElementById('chatbotToggle');
            if (chatbot && chatbotToggle) {
                tests.chatbot = true;
                console.log('✅ Chatbot: OK');
            } else {
                console.error('❌ Chatbot: Missing elements');
            }
        } catch (e) {
            console.error('❌ Chatbot test error:', e);
        }
    }
    
    // Test Navigation
    function testNavigation() {
        try {
            const nav = document.getElementById('mainNav');
            const navToggle = document.getElementById('navToggle');
            if (nav && navToggle) {
                tests.navigation = true;
                console.log('✅ Navigation: OK');
            } else {
                console.error('❌ Navigation: Missing elements');
            }
        } catch (e) {
            console.error('❌ Navigation test error:', e);
        }
    }
    
    // Test Modals
    function testModals() {
        try {
            const cartModal = document.getElementById('cartModal');
            const loginModal = document.getElementById('loginModal');
            if (cartModal && loginModal) {
                tests.modals = true;
                console.log('✅ Modals: OK');
            } else {
                console.error('❌ Modals: Missing modal elements');
            }
        } catch (e) {
            console.error('❌ Modals test error:', e);
        }
    }
    
    // Run all tests
    function runTests() {
        testCart();
        testLanguage();
        testProducts();
        testChatbot();
        testNavigation();
        testModals();
        
        const passed = Object.values(tests).filter(v => v).length;
        const total = Object.keys(tests).length;
        
        console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All functionality tests passed!');
        } else {
            console.warn('⚠️ Some tests failed. Check errors above.');
        }
    }
    
    // Fix common issues
    function fixCommonIssues() {
        // Ensure all required functions are globally available
        if (typeof window.addToCart !== 'function' && typeof addToCart === 'function') {
            window.addToCart = addToCart;
        }
        
        if (typeof window.openCart !== 'function' && typeof openCart === 'function') {
            window.openCart = openCart;
        }
        
        if (typeof window.setLanguage !== 'function' && typeof setLanguage === 'function') {
            window.setLanguage = setLanguage;
        }
        
        // Ensure products array is available globally
        if (typeof window.products === 'undefined' && typeof products !== 'undefined') {
            window.products = products;
        }
        
        // Fix modal close on outside click
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        console.log('🔧 Common issues fixed');
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                fixCommonIssues();
                runTests();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            fixCommonIssues();
            runTests();
        }, 1000);
    }
    
})();

