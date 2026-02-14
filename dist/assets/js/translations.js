// Translation system for Hindi/English
const translations = {
    en: {
        // Navigation
        home: "Home",
        products: "Products",
        blog: "Blog",
        customerPortal: "Customer Portal",
        aboutUs: "About Us",
        cities: "Our Cities",
        contact: "Contact",
        socialMedia: "Social Media",
        
        // Hero Section
        heroTitle: "Gurukripa Bricks",
        heroSubtitle: "Get the best bricks to build your dream home. We are one of the best brick manufacturers in Jaunpur.",
        callUs: "Call Us",
        directions: "Directions",
        
        // Features
        featuresTitle: "Choose Strong and Durable Bricks &mdash; Avoid Bad Bricks",
        featuresDescription: "Gurukripa Bricks has continuously advanced the art and science of brick making, making bricks an affordable, durable, sustainable and beautiful option for Indian homeowners, builders, and contractors. We are one of the best sellers and manufacturers in Jaunpur district of Uttar Pradesh. We make quality bricks to build your dream home.",
        whyChoose: "Why Choose Gurukripa Bricks?",
        whyChooseDesc: "For over 25 years, Gurukripa Bricks Industry, manufacturing a wide range of machine-made bricks, has helped build better, more stylish and more durable homes. We are known for the best quality, durability, size and shape of bricks.",
        ourCommitment: "Our Commitment",
        ourCommitmentDesc: "Order our bricks from anywhere. We are just a call away whether you are in a village or city, we will deliver our bricks to your home in Jaunpur district within a day.",
        
        // Quality
        qualityTitle: "Features of Our Bricks",
        strength: "Strength",
        strengthDesc: "Strong and durable bricks with high pressure resistance",
        uniformSize: "Uniform Size",
        uniformSizeDesc: "All bricks in uniform size and shape",
        lowWater: "Low Water Absorption",
        lowWaterDesc: "Less than 20% water absorption rate",
        
        // Products
        productsTitle: "Our Products",
        viewDetails: "View Details",
        addToCart: "Add to Cart",
        filterBy: "Filter By",
        allProducts: "All Products",
        priceRange: "Price Range",
        minPrice: "Min Price",
        maxPrice: "Max Price",
        applyFilter: "Apply Filter",
        resetFilter: "Reset",
        
        // Ordering
        orderNow: "Order Now",
        cart: "Cart",
        checkout: "Checkout",
        quantity: "Quantity",
        total: "Total",
        remove: "Remove",
        emptyCart: "Your cart is empty",
        orderSummary: "Order Summary",
        shippingInfo: "Shipping Information",
        paymentMethod: "Payment Method",
        placeOrder: "Place Order",
        
        // Blog
        blogTitle: "Our Blog",
        readMore: "Read More",
        categories: "Categories",
        recentPosts: "Recent Posts",
        allCategories: "All Categories",
        
        // Customer Portal
        login: "Login",
        register: "Register",
        logout: "Logout",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        name: "Name",
        mobile: "Mobile Number",
        address: "Address",
        forgotPassword: "Forgot Password?",
        rememberMe: "Remember Me",
        dashboard: "Dashboard",
        myOrders: "My Orders",
        profile: "Profile",
        orderHistory: "Order History",
        accountSettings: "Account Settings",
        
        // Common
        loading: "Loading...",
        error: "Error",
        success: "Success",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        search: "Search",
        submit: "Submit",
        close: "Close",
        
        // Chatbot
        chatbotTitle: "Gurukripa Bricks",
        chatbotPlaceholder: "Type your message..."
    },
    hi: {
        // Navigation
        home: "होम",
        products: "उत्पाद",
        blog: "ब्लॉग",
        customerPortal: "ग्राहक पोर्टल",
        aboutUs: "हमारे बारे में",
        cities: "हमारे शहर",
        contact: "संपर्क",
        socialMedia: "सोशल मीडिया",
        
        // Hero Section
        heroTitle: "गुरुकृपा ईंट",
        heroSubtitle: "उत्तम घर बनाने के लिए सर्वोत्तम ईंटें प्राप्त करें। हम जौनपुर में सबसे अच्छे ईंट निर्माताओं में से एक हैं।",
        callUs: "हमें कॉल करें",
        directions: "दिशा-निर्देश",
        
        // Features
        featuresTitle: "मजबूत और टिकाऊ ईंटें चुने &mdash; खराब ईंटों से बचें",
        featuresDescription: "गुरुकृपा ईंट ने ईंट बनाने की कला और विज्ञान को लगातार उन्नत किया है, जिससे ईंट को एक सस्ती, टिकाऊ, स्थायी और भारतीय घर के मालिकों, बिल्डरों, ठेकेदारों के लिए सुंदर विकल्प बनाया जा सके। हम उत्तर प्रदेश के जौनपुर जिले में सर्वश्रेष्ठ विक्रेता और निर्माता में से एक हैं। हम आपके सपनों का घर बनाने के लिए गुणवत्तापूर्ण ईंटें बनाते हैं।",
        whyChoose: "गुरुकृपा ईंट क्यों चुनें?",
        whyChooseDesc: "२५ से अधिक वर्षों से, गुरुकृपा ईंट उद्योग, मशीन से बनी ईंटों की एक विस्तृत श्रृंखला के निर्माण ने बेहतर, अधिक स्टाइलिश और अधिक टिकाऊ घर बनाने में मदद की है। हम ईंटों की सर्वोत्तम गुणवत्ता, स्थायित्व, आकार और आकृति के लिए जाने जाते हैं।",
        ourCommitment: "हमारा संकल्प",
        ourCommitmentDesc: "हमारी ईंटें कहीं से भी मंगवाएं। हम बस एक कॉल दूर हैं चाहे आप गांव में हों या शहर में हम एक दिन के भीतर जौनपुर जिले में आपके घर तक अपनी ईंटें पहुंचाएंगे।",
        
        // Quality
        qualityTitle: "हमारी ईंटों की विशेषताएं",
        strength: "मजबूती",
        strengthDesc: "उच्च दबाव प्रतिरोध के साथ मजबूत और टिकाऊ ईंटें",
        uniformSize: "समान आकार",
        uniformSizeDesc: "सभी ईंटें एक समान आकार और आकृति में",
        lowWater: "कम पानी अवशोषण",
        lowWaterDesc: "20% से कम पानी अवशोषण दर",
        
        // Products
        productsTitle: "हमारे उत्पाद",
        viewDetails: "विवरण देखें",
        addToCart: "कार्ट में जोड़ें",
        filterBy: "फ़िल्टर करें",
        allProducts: "सभी उत्पाद",
        priceRange: "मूल्य सीमा",
        minPrice: "न्यूनतम मूल्य",
        maxPrice: "अधिकतम मूल्य",
        applyFilter: "फ़िल्टर लागू करें",
        resetFilter: "रीसेट",
        
        // Ordering
        orderNow: "अभी ऑर्डर करें",
        cart: "कार्ट",
        checkout: "चेकआउट",
        quantity: "मात्रा",
        total: "कुल",
        remove: "हटाएं",
        emptyCart: "आपकी कार्ट खाली है",
        orderSummary: "ऑर्डर सारांश",
        shippingInfo: "शिपिंग जानकारी",
        paymentMethod: "भुगतान विधि",
        placeOrder: "ऑर्डर दें",
        
        // Blog
        blogTitle: "हमारा ब्लॉग",
        readMore: "और पढ़ें",
        categories: "श्रेणियां",
        recentPosts: "हाल की पोस्ट",
        allCategories: "सभी श्रेणियां",
        
        // Customer Portal
        login: "लॉगिन",
        register: "रजिस्टर करें",
        logout: "लॉगआउट",
        email: "ईमेल",
        password: "पासवर्ड",
        confirmPassword: "पासवर्ड की पुष्टि करें",
        name: "नाम",
        mobile: "मोबाइल नंबर",
        address: "पता",
        forgotPassword: "पासवर्ड भूल गए?",
        rememberMe: "मुझे याद रखें",
        dashboard: "डैशबोर्ड",
        myOrders: "मेरे ऑर्डर",
        profile: "प्रोफ़ाइल",
        orderHistory: "ऑर्डर इतिहास",
        accountSettings: "खाता सेटिंग्स",
        
        // Common
        loading: "लोड हो रहा है...",
        error: "त्रुटि",
        success: "सफल",
        save: "सहेजें",
        cancel: "रद्द करें",
        edit: "संपादित करें",
        delete: "हटाएं",
        search: "खोजें",
        submit: "जमा करें",
        close: "बंद करें",
        
        // Chatbot
        chatbotTitle: "गुरुकृपा ईंट उद्योग",
        chatbotPlaceholder: "अपना संदेश टाइप करें..."
    }
};

// Language management
let currentLanguage = localStorage.getItem('language') || 'hi';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    translatePage();
    updateLanguageToggle();
}

function translatePage() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            // Special handling for hero title
            if (key === 'heroTitle') {
                if (currentLanguage === 'hi') {
                    element.innerHTML = '<span class="color-changing-text">गुरुकृपा</span> ईंट';
                } else {
                    element.innerHTML = '<span class="color-changing-text">Gurukripa</span> Bricks';
                }
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    // Update placeholders
    const placeholders = document.querySelectorAll('[data-placeholder]');
    placeholders.forEach(element => {
        const key = element.getAttribute('data-placeholder');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
}

function updateLanguageToggle() {
    const toggle = document.getElementById('langToggle');
    if (toggle) {
        toggle.textContent = currentLanguage === 'hi' ? 'EN' : 'हिंदी';
    }
}

function getTranslation(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] 
        ? translations[currentLanguage][key] 
        : key;
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    translatePage();
    updateLanguageToggle();
});

// Make setLanguage globally available
window.setLanguage = function(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    translatePage();
    updateLanguageToggle();
    
    // Track analytics
    if (typeof trackLanguageChange === 'function') {
        trackLanguageChange(lang);
    }
};

// Make other functions globally available
window.getTranslation = getTranslation;
window.translatePage = translatePage;
window.updateLanguageToggle = updateLanguageToggle;

